/**
 * Gift Code Service — Gift code generation, redemption, cancellation
 *
 * Simplified: only 'simple' and 'personalized' gift types.
 * Each gift is a single-use code (one redeemer gets all credits).
 */

import { eq, and, desc } from 'drizzle-orm';
import {
	giftCodes,
	giftRedemptions,
	GIFT_CODE_CHARS,
	GIFT_CODE_LENGTH,
	GIFT_CODE_RULES,
} from '../db/schema/gifts';
import { balances, transactions } from '../db/schema/credits';
import type { Database } from '../db/connection';
import { BadRequestError, NotFoundError } from '../lib/errors';

interface CreateGiftParams {
	totalCredits: number;
	type?: 'simple' | 'personalized';
	targetEmail?: string;
	message?: string;
	expirationDays?: number;
}

export class GiftCodeService {
	constructor(
		private db: Database,
		private baseUrl: string
	) {}

	private generateCode(): string {
		let code = '';
		for (let i = 0; i < GIFT_CODE_LENGTH; i++) {
			code += GIFT_CODE_CHARS[Math.floor(Math.random() * GIFT_CODE_CHARS.length)];
		}
		return code;
	}

	async createGift(creatorId: string, creatorName: string, params: CreateGiftParams) {
		const { totalCredits, type = 'simple' } = params;

		if (totalCredits < GIFT_CODE_RULES.minCredits || totalCredits > GIFT_CODE_RULES.maxCredits) {
			throw new BadRequestError(
				`Credits must be between ${GIFT_CODE_RULES.minCredits} and ${GIFT_CODE_RULES.maxCredits}`
			);
		}

		return await this.db.transaction(async (tx) => {
			const [balance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, creatorId))
				.for('update')
				.limit(1);

			if (!balance || balance.balance < totalCredits) {
				throw new BadRequestError('Insufficient credits to create gift');
			}

			// Deduct from creator
			await tx
				.update(balances)
				.set({
					balance: balance.balance - totalCredits,
					totalSpent: balance.totalSpent + totalCredits,
					version: balance.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, creatorId), eq(balances.version, balance.version)));

			// Reservation transaction
			const [reservationTx] = await tx
				.insert(transactions)
				.values({
					userId: creatorId,
					type: 'gift',
					status: 'completed',
					amount: -totalCredits,
					balanceBefore: balance.balance,
					balanceAfter: balance.balance - totalCredits,
					appId: 'gifts',
					description: `Gift code created: ${totalCredits} credits`,
					completedAt: new Date(),
				})
				.returning();

			const code = this.generateCode();
			const expiresAt = params.expirationDays
				? new Date(Date.now() + params.expirationDays * 24 * 60 * 60 * 1000)
				: new Date(Date.now() + GIFT_CODE_RULES.defaultExpirationDays * 24 * 60 * 60 * 1000);

			const [gift] = await tx
				.insert(giftCodes)
				.values({
					code,
					shortUrl: `${this.baseUrl}/g/${code}`,
					creatorId,
					creatorName,
					totalCredits,
					type,
					targetEmail: params.targetEmail,
					message: params.message,
					expiresAt,
					reservationTransactionId: reservationTx.id,
				})
				.returning();

			return gift;
		});
	}

	async redeemGift(code: string, redeemerId: string, sourceAppId?: string) {
		return await this.db.transaction(async (tx) => {
			const [gift] = await tx
				.select()
				.from(giftCodes)
				.where(eq(giftCodes.code, code.toUpperCase()))
				.for('update')
				.limit(1);

			if (!gift) throw new NotFoundError('Gift code not found');
			if (gift.status !== 'active') throw new BadRequestError(`Gift code is ${gift.status}`);
			if (gift.expiresAt && new Date() > gift.expiresAt)
				throw new BadRequestError('Gift code expired');
			if (gift.redeemed >= 1) throw new BadRequestError('Gift already claimed');

			// Add credits to redeemer
			const [balance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, redeemerId))
				.for('update')
				.limit(1);

			const balanceBefore = balance?.balance ?? 0;
			const newBalance = balanceBefore + gift.totalCredits;

			if (balance) {
				await tx
					.update(balances)
					.set({
						balance: newBalance,
						totalEarned: balance.totalEarned + gift.totalCredits,
						version: balance.version + 1,
						updatedAt: new Date(),
					})
					.where(eq(balances.userId, redeemerId));
			} else {
				await tx.insert(balances).values({
					userId: redeemerId,
					balance: gift.totalCredits,
					totalEarned: gift.totalCredits,
					totalSpent: 0,
				});
			}

			// Ledger
			const [creditTx] = await tx
				.insert(transactions)
				.values({
					userId: redeemerId,
					type: 'gift',
					status: 'completed',
					amount: gift.totalCredits,
					balanceBefore,
					balanceAfter: newBalance,
					appId: 'gifts',
					description: `Gift redeemed: ${gift.totalCredits} credits from ${gift.creatorName || 'someone'}`,
					completedAt: new Date(),
				})
				.returning();

			// Track redemption
			await tx.insert(giftRedemptions).values({
				giftCodeId: gift.id,
				redeemerUserId: redeemerId,
				status: 'success',
				creditsReceived: gift.totalCredits,
				creditTransactionId: creditTx.id,
				sourceAppId,
			});

			// Mark gift as depleted
			await tx
				.update(giftCodes)
				.set({ redeemed: 1, status: 'depleted', updatedAt: new Date() })
				.where(eq(giftCodes.id, gift.id));

			return {
				success: true,
				creditsReceived: gift.totalCredits,
				message: gift.message,
				creatorName: gift.creatorName,
			};
		});
	}

	async getGiftInfo(code: string) {
		const [gift] = await this.db
			.select()
			.from(giftCodes)
			.where(eq(giftCodes.code, code.toUpperCase()))
			.limit(1);

		if (!gift) throw new NotFoundError('Gift code not found');

		return {
			code: gift.code,
			type: gift.type,
			status: gift.status,
			totalCredits: gift.totalCredits,
			redeemed: gift.redeemed > 0,
			message: gift.message,
			creatorName: gift.creatorName,
			expiresAt: gift.expiresAt,
		};
	}

	async getCreatedGifts(userId: string) {
		return this.db
			.select()
			.from(giftCodes)
			.where(eq(giftCodes.creatorId, userId))
			.orderBy(desc(giftCodes.createdAt));
	}

	async getReceivedGifts(userId: string) {
		return this.db
			.select()
			.from(giftRedemptions)
			.where(eq(giftRedemptions.redeemerUserId, userId))
			.orderBy(desc(giftRedemptions.createdAt));
	}

	async cancelGift(giftId: string, userId: string) {
		return await this.db.transaction(async (tx) => {
			const [gift] = await tx
				.select()
				.from(giftCodes)
				.where(and(eq(giftCodes.id, giftId), eq(giftCodes.creatorId, userId)))
				.for('update')
				.limit(1);

			if (!gift) throw new NotFoundError('Gift not found');
			if (gift.status !== 'active') throw new BadRequestError('Only active gifts can be cancelled');

			// Only refund if not yet redeemed
			const refundAmount = gift.redeemed === 0 ? gift.totalCredits : 0;

			if (refundAmount > 0) {
				const [balance] = await tx
					.select()
					.from(balances)
					.where(eq(balances.userId, userId))
					.for('update')
					.limit(1);

				if (balance) {
					await tx
						.update(balances)
						.set({
							balance: balance.balance + refundAmount,
							totalEarned: balance.totalEarned + refundAmount,
							version: balance.version + 1,
							updatedAt: new Date(),
						})
						.where(eq(balances.userId, userId));

					await tx.insert(transactions).values({
						userId,
						type: 'refund',
						status: 'completed',
						amount: refundAmount,
						balanceBefore: balance.balance,
						balanceAfter: balance.balance + refundAmount,
						appId: 'gifts',
						description: `Gift cancelled, ${refundAmount} credits refunded`,
						completedAt: new Date(),
					});
				}
			}

			await tx
				.update(giftCodes)
				.set({ status: 'cancelled', updatedAt: new Date() })
				.where(eq(giftCodes.id, giftId));

			return { success: true, refundedCredits: refundAmount };
		});
	}

	/** Auto-redeem pending gifts for a newly registered user */
	async redeemPendingForUser(userId: string, email: string) {
		const pendingGifts = await this.db
			.select()
			.from(giftCodes)
			.where(
				and(
					eq(giftCodes.targetEmail, email),
					eq(giftCodes.status, 'active'),
					eq(giftCodes.type, 'personalized')
				)
			);

		let totalRedeemed = 0;
		for (const gift of pendingGifts) {
			try {
				const result = await this.redeemGift(gift.code, userId, 'auto-registration');
				totalRedeemed += result.creditsReceived;
			} catch {
				// Skip failed redemptions
			}
		}
		return { redeemed: pendingGifts.length, totalCredits: totalRedeemed };
	}
}
