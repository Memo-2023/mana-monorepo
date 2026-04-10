/**
 * Credits Service — Personal balance management
 *
 * Ported from mana-auth CreditsService.
 * Handles balance CRUD, credit usage, purchases, and transaction ledger.
 */

import { eq, and, desc } from 'drizzle-orm';
import { balances, transactions, purchases, packages, usageStats } from '../db/schema/credits';
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
}
