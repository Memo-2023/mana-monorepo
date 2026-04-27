/**
 * Credits Service — Personal balance management
 *
 * Ported from mana-auth CreditsService.
 * Handles balance CRUD, credit usage, purchases, and transaction ledger.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { balances, transactions, purchases, packages, usageStats } from '../db/schema/credits';
import { creditReservations } from '../db/schema/reservations';
import type { Database } from '../db/connection';
import type { StripeService } from './stripe';
import {
	BadRequestError,
	NotFoundError,
	ConflictError,
	InsufficientCreditsError,
} from '../lib/errors';

interface UseCreditsParams {
	amount: number;
	appId: string;
	description: string;
	idempotencyKey?: string;
	metadata?: Record<string, unknown>;
}

export class CreditsService {
	constructor(
		private db: Database,
		private stripeService: StripeService
	) {}

	async initializeBalance(userId: string) {
		const [existing] = await this.db
			.select()
			.from(balances)
			.where(eq(balances.userId, userId))
			.limit(1);

		if (existing) return existing;

		const [balance] = await this.db
			.insert(balances)
			.values({ userId, balance: 0, totalEarned: 0, totalSpent: 0 })
			.returning();

		return balance;
	}

	async getBalance(userId: string) {
		const [balance] = await this.db
			.select()
			.from(balances)
			.where(eq(balances.userId, userId))
			.limit(1);

		if (!balance) return this.initializeBalance(userId);

		return {
			balance: balance.balance,
			totalEarned: balance.totalEarned,
			totalSpent: balance.totalSpent,
		};
	}

	async useCredits(userId: string, params: UseCreditsParams) {
		// Idempotency check
		if (params.idempotencyKey) {
			const [existing] = await this.db
				.select()
				.from(transactions)
				.where(eq(transactions.idempotencyKey, params.idempotencyKey))
				.limit(1);

			if (existing) {
				return { success: true, transaction: existing, message: 'Transaction already processed' };
			}
		}

		return await this.db.transaction(async (tx) => {
			// Row lock
			const [current] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, userId))
				.for('update')
				.limit(1);

			if (!current) throw new NotFoundError('User balance not found');
			if (current.balance < params.amount) {
				throw new InsufficientCreditsError(params.amount, current.balance);
			}

			const newBalance = current.balance - params.amount;
			const newTotalSpent = current.totalSpent + params.amount;

			// Optimistic locking update
			const updateResult = await tx
				.update(balances)
				.set({
					balance: newBalance,
					totalSpent: newTotalSpent,
					version: current.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, userId), eq(balances.version, current.version)))
				.returning();

			if (updateResult.length === 0) {
				throw new ConflictError('Balance was modified concurrently. Please retry.');
			}

			// Ledger entry
			const [transaction] = await tx
				.insert(transactions)
				.values({
					userId,
					type: 'usage',
					status: 'completed',
					amount: -params.amount,
					balanceBefore: current.balance,
					balanceAfter: newBalance,
					appId: params.appId,
					description: params.description,
					metadata: params.metadata,
					idempotencyKey: params.idempotencyKey,
					completedAt: new Date(),
				})
				.returning();

			// Usage stats
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			await tx.insert(usageStats).values({
				userId,
				appId: params.appId,
				creditsUsed: params.amount,
				date: today,
				metadata: params.metadata,
			});

			return {
				success: true,
				transaction,
				newBalance: { balance: newBalance, totalSpent: newTotalSpent },
			};
		});
	}

	async refundCredits(
		userId: string,
		amount: number,
		description: string,
		appId = 'system',
		metadata?: Record<string, unknown>
	) {
		return await this.db.transaction(async (tx) => {
			const [current] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, userId))
				.for('update')
				.limit(1);

			if (!current) throw new NotFoundError('User balance not found');

			const newBalance = current.balance + amount;

			await tx
				.update(balances)
				.set({
					balance: newBalance,
					totalEarned: current.totalEarned + amount,
					version: current.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, userId), eq(balances.version, current.version)))
				.returning();

			const [transaction] = await tx
				.insert(transactions)
				.values({
					userId,
					type: 'refund',
					status: 'completed',
					amount,
					balanceBefore: current.balance,
					balanceAfter: newBalance,
					appId,
					description,
					metadata,
					completedAt: new Date(),
				})
				.returning();

			return { success: true, transaction, newBalance: { balance: newBalance } };
		});
	}

	/**
	 * Grant credits to a user as a reward (no money changed hands).
	 * Idempotent on `referenceId`: if a previous grant with the same
	 * referenceId already landed, returns `alreadyGranted: true` without
	 * mutating balance.
	 *
	 * Used by mana-analytics to drop +5 Credits for every quality
	 * feedback submission and +500 Credits when a wish ships, plus +25
	 * to each reactioner whose vote nudged the wish toward 'completed'.
	 */
	async grantCredits(params: {
		userId: string;
		amount: number;
		reason: string;
		referenceId: string;
		description?: string;
	}) {
		if (params.amount <= 0) throw new BadRequestError('amount must be > 0');
		if (!params.referenceId) throw new BadRequestError('referenceId is required for idempotency');

		// Idempotency: short-circuit if this referenceId already produced a grant.
		const existing = await this.db
			.select({ id: transactions.id, balanceAfter: transactions.balanceAfter })
			.from(transactions)
			.where(
				and(
					eq(transactions.userId, params.userId),
					eq(transactions.type, 'grant'),
					sql`${transactions.metadata}->>'referenceId' = ${params.referenceId}`
				)
			)
			.limit(1);

		if (existing.length > 0) {
			return { ok: true, alreadyGranted: true, newBalance: existing[0].balanceAfter };
		}

		return await this.db.transaction(async (tx) => {
			// Ensure balance row exists.
			const [current] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, params.userId))
				.for('update')
				.limit(1);

			let balanceBefore: number;
			let totalEarnedBefore: number;
			let version: number;
			if (!current) {
				const [created] = await tx
					.insert(balances)
					.values({ userId: params.userId, balance: 0, totalEarned: 0, totalSpent: 0 })
					.returning();
				balanceBefore = created.balance;
				totalEarnedBefore = created.totalEarned;
				version = created.version;
			} else {
				balanceBefore = current.balance;
				totalEarnedBefore = current.totalEarned;
				version = current.version;
			}

			const newBalance = balanceBefore + params.amount;

			await tx
				.update(balances)
				.set({
					balance: newBalance,
					totalEarned: totalEarnedBefore + params.amount, // grants count as earned
					version: version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, params.userId), eq(balances.version, version)));

			const [transaction] = await tx
				.insert(transactions)
				.values({
					userId: params.userId,
					type: 'grant',
					status: 'completed',
					amount: params.amount,
					balanceBefore,
					balanceAfter: newBalance,
					appId: 'community',
					description: params.description ?? `Reward: ${params.reason}`,
					metadata: { reason: params.reason, referenceId: params.referenceId },
					completedAt: new Date(),
				})
				.returning();

			return { ok: true, alreadyGranted: false, newBalance, transactionId: transaction.id };
		});
	}

	async getTransactions(userId: string, limit = 50, offset = 0) {
		return this.db
			.select()
			.from(transactions)
			.where(eq(transactions.userId, userId))
			.orderBy(desc(transactions.createdAt))
			.limit(limit)
			.offset(offset);
	}

	async getPurchases(userId: string) {
		return this.db
			.select()
			.from(purchases)
			.where(eq(purchases.userId, userId))
			.orderBy(desc(purchases.createdAt));
	}

	async getPackages() {
		return this.db
			.select()
			.from(packages)
			.where(eq(packages.active, true))
			.orderBy(packages.sortOrder);
	}

	async initiatePurchase(userId: string, packageId: string, userEmail: string) {
		const [pkg] = await this.db
			.select()
			.from(packages)
			.where(and(eq(packages.id, packageId), eq(packages.active, true)))
			.limit(1);

		if (!pkg) throw new NotFoundError('Package not found or inactive');

		const stripeCustomerId = await this.stripeService.getOrCreateCustomer(userId, userEmail);

		const [purchase] = await this.db
			.insert(purchases)
			.values({
				userId,
				packageId,
				credits: pkg.credits,
				priceEuroCents: pkg.priceEuroCents,
				stripeCustomerId,
				status: 'pending',
			})
			.returning();

		const paymentIntent = await this.stripeService.createPaymentIntent(
			stripeCustomerId,
			pkg.priceEuroCents,
			{ userId, packageId, purchaseId: purchase.id }
		);

		await this.db
			.update(purchases)
			.set({ stripePaymentIntentId: paymentIntent.id })
			.where(eq(purchases.id, purchase.id));

		return {
			purchaseId: purchase.id,
			clientSecret: paymentIntent.client_secret!,
			amount: pkg.priceEuroCents,
			credits: pkg.credits,
		};
	}

	async completePurchase(paymentIntentId: string) {
		return await this.db.transaction(async (tx) => {
			const [purchase] = await tx
				.select()
				.from(purchases)
				.where(eq(purchases.stripePaymentIntentId, paymentIntentId))
				.limit(1);

			if (!purchase) throw new NotFoundError('Purchase not found');
			if (purchase.status === 'completed') return { success: true, already: true };

			// Lock and update balance
			const [current] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, purchase.userId))
				.for('update')
				.limit(1);

			const balanceBefore = current?.balance ?? 0;
			const newBalance = balanceBefore + purchase.credits;

			if (current) {
				await tx
					.update(balances)
					.set({
						balance: newBalance,
						totalEarned: current.totalEarned + purchase.credits,
						version: current.version + 1,
						updatedAt: new Date(),
					})
					.where(eq(balances.userId, purchase.userId));
			} else {
				await tx.insert(balances).values({
					userId: purchase.userId,
					balance: purchase.credits,
					totalEarned: purchase.credits,
					totalSpent: 0,
				});
			}

			// Ledger entry
			await tx.insert(transactions).values({
				userId: purchase.userId,
				type: 'purchase',
				status: 'completed',
				amount: purchase.credits,
				balanceBefore,
				balanceAfter: newBalance,
				appId: 'stripe',
				description: `Credit purchase: ${purchase.credits} credits`,
				metadata: { purchaseId: purchase.id, paymentIntentId },
				completedAt: new Date(),
			});

			// Mark purchase complete
			await tx
				.update(purchases)
				.set({ status: 'completed', completedAt: new Date() })
				.where(eq(purchases.id, purchase.id));

			return { success: true };
		});
	}

	async failPurchase(paymentIntentId: string) {
		await this.db
			.update(purchases)
			.set({ status: 'failed' })
			.where(eq(purchases.stripePaymentIntentId, paymentIntentId));
	}

	async getPurchaseStatus(userId: string, purchaseId: string) {
		const [purchase] = await this.db
			.select()
			.from(purchases)
			.where(and(eq(purchases.id, purchaseId), eq(purchases.userId, userId)))
			.limit(1);

		if (!purchase) throw new NotFoundError('Purchase not found');
		return purchase;
	}

	// ─── 2-phase debit (reserve / commit / refund) ─────────────
	// Used by mana-research for provider calls that should only be charged
	// after the downstream API succeeds. See services/mana-research.

	async reserve(userId: string, amount: number, reason: string) {
		if (amount <= 0) throw new BadRequestError('Reservation amount must be positive');

		return await this.db.transaction(async (tx) => {
			const [current] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, userId))
				.for('update')
				.limit(1);

			if (!current) throw new NotFoundError('User balance not found');
			if (current.balance < amount) {
				throw new InsufficientCreditsError(amount, current.balance);
			}

			const newBalance = current.balance - amount;

			const updated = await tx
				.update(balances)
				.set({
					balance: newBalance,
					version: current.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, userId), eq(balances.version, current.version)))
				.returning();

			if (updated.length === 0) {
				throw new ConflictError('Balance was modified concurrently. Please retry.');
			}

			const [reservation] = await tx
				.insert(creditReservations)
				.values({ userId, amount, reason, status: 'reserved' })
				.returning();

			return {
				reservationId: reservation.id,
				balance: newBalance,
			};
		});
	}

	async commitReservation(reservationId: string, description?: string) {
		return await this.db.transaction(async (tx) => {
			const [reservation] = await tx
				.select()
				.from(creditReservations)
				.where(eq(creditReservations.id, reservationId))
				.for('update')
				.limit(1);

			if (!reservation) throw new NotFoundError('Reservation not found');
			if (reservation.status !== 'reserved') {
				throw new BadRequestError(`Cannot commit reservation in status: ${reservation.status}`);
			}

			await tx
				.update(creditReservations)
				.set({ status: 'committed', resolvedAt: new Date() })
				.where(eq(creditReservations.id, reservationId));

			const [balance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, reservation.userId))
				.limit(1);

			const balanceAfter = balance?.balance ?? 0;
			const balanceBefore = balanceAfter + reservation.amount;

			await tx
				.update(balances)
				.set({
					totalSpent: (balance?.totalSpent ?? 0) + reservation.amount,
					updatedAt: new Date(),
				})
				.where(eq(balances.userId, reservation.userId));

			const [transaction] = await tx
				.insert(transactions)
				.values({
					userId: reservation.userId,
					type: 'usage',
					status: 'completed',
					amount: -reservation.amount,
					balanceBefore,
					balanceAfter,
					appId: reservation.reason.split(':')[0] || 'mana-research',
					description: description ?? reservation.reason,
					metadata: { reservationId: reservation.id },
					completedAt: new Date(),
				})
				.returning();

			return { success: true, transactionId: transaction.id };
		});
	}

	async refundReservation(reservationId: string) {
		return await this.db.transaction(async (tx) => {
			const [reservation] = await tx
				.select()
				.from(creditReservations)
				.where(eq(creditReservations.id, reservationId))
				.for('update')
				.limit(1);

			if (!reservation) throw new NotFoundError('Reservation not found');
			if (reservation.status !== 'reserved') {
				throw new BadRequestError(`Cannot refund reservation in status: ${reservation.status}`);
			}

			await tx
				.update(creditReservations)
				.set({ status: 'refunded', resolvedAt: new Date() })
				.where(eq(creditReservations.id, reservationId));

			const [current] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, reservation.userId))
				.for('update')
				.limit(1);

			if (!current) throw new NotFoundError('User balance not found');

			const newBalance = current.balance + reservation.amount;
			await tx
				.update(balances)
				.set({
					balance: newBalance,
					version: current.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, reservation.userId), eq(balances.version, current.version)));

			return { success: true, balance: newBalance };
		});
	}
}
