/**
 * Gift Code Service — Gift code generation, redemption, cancellation
 *
 * Ported from mana-core-auth GiftCodeService.
 */

import { eq, and, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
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
	type?: 'simple' | 'personalized' | 'split' | 'first_come' | 'riddle';
	totalPortions?: number;
	targetEmail?: string;
	targetMatrixId?: string;
	riddleQuestion?: string;
	riddleAnswer?: string;
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
		const { totalCredits, type = 'simple', totalPortions = 1 } = params;

		if (totalCredits < GIFT_CODE_RULES.minCredits || totalCredits > GIFT_CODE_RULES.maxCredits) {
			throw new BadRequestError(
				`Credits must be between ${GIFT_CODE_RULES.minCredits} and ${GIFT_CODE_RULES.maxCredits}`
			);
		}

		const creditsPerPortion = Math.floor(totalCredits / totalPortions);
		if (creditsPerPortion < 1) throw new BadRequestError('Credits per portion must be at least 1');

		// Reserve credits from creator's balance
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

			// Hash riddle answer if present
			let riddleAnswerHash: string | undefined;
			if (params.riddleAnswer) {
				riddleAnswerHash = await bcrypt.hash(params.riddleAnswer.toLowerCase().trim(), 10);
			}

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
					creditsPerPortion,
					totalPortions,
					type,
					targetEmail: params.targetEmail,
					targetMatrixId: params.targetMatrixId,
					riddleQuestion: params.riddleQuestion,
					riddleAnswerHash,
					message: params.message,
					expiresAt,
					reservationTransactionId: reservationTx.id,
				})
				.returning();

			return gift;
		});
	}

	async redeemGift(code: string, redeemerId: string, riddleAnswer?: string, sourceAppId?: string) {
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
			if (gift.claimedPortions >= gift.totalPortions)
				throw new BadRequestError('Gift fully claimed');

			// Personalization check
			if (gift.type === 'personalized' && gift.targetEmail) {
				// Caller must verify email matches — for now we allow all
			}

			// Riddle check
			if (gift.type === 'riddle' && gift.riddleAnswerHash) {
				if (!riddleAnswer) throw new BadRequestError('Riddle answer required');
				const correct = await bcrypt.compare(
					riddleAnswer.toLowerCase().trim(),
					gift.riddleAnswerHash
				);
				if (!correct) {
					await tx.insert(giftRedemptions).values({
						giftCodeId: gift.id,
						redeemerUserId: redeemerId,
						status: 'failed_wrong_answer',
						creditsReceived: 0,
						sourceAppId,
					});
					throw new BadRequestError('Wrong riddle answer');
				}
			}

			// Add credits to redeemer
			const [balance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, redeemerId))
				.for('update')
				.limit(1);

			const balanceBefore = balance?.balance ?? 0;
			const newBalance = balanceBefore + gift.creditsPerPortion;

			if (balance) {
				await tx
					.update(balances)
					.set({
						balance: newBalance,
						totalEarned: balance.totalEarned + gift.creditsPerPortion,
						version: balance.version + 1,
						updatedAt: new Date(),
					})
					.where(eq(balances.userId, redeemerId));
			} else {
				await tx.insert(balances).values({
					userId: redeemerId,
					balance: gift.creditsPerPortion,
					totalEarned: gift.creditsPerPortion,
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
					amount: gift.creditsPerPortion,
					balanceBefore,
					balanceAfter: newBalance,
					appId: 'gifts',
					description: `Gift redeemed: ${gift.creditsPerPortion} credits from ${gift.creatorName || 'someone'}`,
					completedAt: new Date(),
				})
				.returning();

			// Track redemption
			await tx.insert(giftRedemptions).values({
				giftCodeId: gift.id,
				redeemerUserId: redeemerId,
				status: 'success',
				creditsReceived: gift.creditsPerPortion,
				portionNumber: gift.claimedPortions + 1,
				creditTransactionId: creditTx.id,
				sourceAppId,
			});

			// Update gift
			const newClaimedPortions = gift.claimedPortions + 1;
			const newStatus = newClaimedPortions >= gift.totalPortions ? 'depleted' : 'active';
			await tx
				.update(giftCodes)
				.set({ claimedPortions: newClaimedPortions, status: newStatus, updatedAt: new Date() })
				.where(eq(giftCodes.id, gift.id));

			return {
				success: true,
				creditsReceived: gift.creditsPerPortion,
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
			creditsPerPortion: gift.creditsPerPortion,
			totalPortions: gift.totalPortions,
			claimedPortions: gift.claimedPortions,
			riddleQuestion: gift.riddleQuestion,
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

			const refundAmount = (gift.totalPortions - gift.claimedPortions) * gift.creditsPerPortion;

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
				const result = await this.redeemGift(gift.code, userId, undefined, 'auto-registration');
				totalRedeemed += result.creditsReceived;
			} catch {
				// Skip failed redemptions
			}
		}
		return { redeemed: pendingGifts.length, totalCredits: totalRedeemed };
	}
}
