import {
	Injectable,
	BadRequestException,
	NotFoundException,
	ForbiddenException,
	ConflictException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, desc, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { getDb } from '../../db/connection';
import {
	giftCodes,
	giftRedemptions,
	GIFT_CODE_CHARS,
	GIFT_CODE_LENGTH,
	GIFT_CODE_RULES,
} from '../../db/schema/gifts.schema';
import { balances, transactions, users } from '../../db/schema';
import { CreateGiftDto, GiftCodeType } from '../dto/create-gift.dto';
import {
	RedeemGiftDto,
	GiftCodeInfoResponse,
	GiftRedeemResponse,
	CreateGiftResponse,
	GiftListItem,
	ReceivedGiftItem,
} from '../dto/redeem-gift.dto';

@Injectable()
export class GiftCodeService {
	private readonly logger = new Logger(GiftCodeService.name);

	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Generate a unique 6-character gift code
	 */
	private async generateUniqueCode(): Promise<string> {
		const db = this.getDb();
		let attempts = 0;
		const maxAttempts = 10;

		while (attempts < maxAttempts) {
			// Generate random code
			let code = '';
			for (let i = 0; i < GIFT_CODE_LENGTH; i++) {
				code += GIFT_CODE_CHARS[Math.floor(Math.random() * GIFT_CODE_CHARS.length)];
			}

			// Check if code exists
			const [existing] = await db
				.select({ id: giftCodes.id })
				.from(giftCodes)
				.where(eq(giftCodes.code, code))
				.limit(1);

			if (!existing) {
				return code;
			}

			attempts++;
		}

		throw new Error('Failed to generate unique code after max attempts');
	}

	/**
	 * Create a new gift code
	 */
	async createGiftCode(userId: string, dto: CreateGiftDto): Promise<CreateGiftResponse> {
		const db = this.getDb();

		// Validate credits
		if (dto.credits < GIFT_CODE_RULES.minCredits) {
			throw new BadRequestException(`Minimum ${GIFT_CODE_RULES.minCredits} credits required`);
		}
		if (dto.credits > GIFT_CODE_RULES.maxCredits) {
			throw new BadRequestException(`Maximum ${GIFT_CODE_RULES.maxCredits} credits allowed`);
		}

		// Determine gift type and portions
		const type: GiftCodeType = dto.type || 'simple';
		const portions = dto.portions || 1;

		if (portions > GIFT_CODE_RULES.maxPortions) {
			throw new BadRequestException(`Maximum ${GIFT_CODE_RULES.maxPortions} portions allowed`);
		}

		// Calculate credits per portion
		const creditsPerPortion = Math.floor(dto.credits / portions);
		const totalCredits = creditsPerPortion * portions;

		if (creditsPerPortion < 1) {
			throw new BadRequestException('Each portion must have at least 1 credit');
		}

		// Validate riddle if provided
		if (type === 'riddle' && (!dto.riddleQuestion || !dto.riddleAnswer)) {
			throw new BadRequestException('Riddle type requires both question and answer');
		}

		// Hash riddle answer if provided
		let riddleAnswerHash: string | null = null;
		if (dto.riddleAnswer) {
			riddleAnswerHash = await bcrypt.hash(dto.riddleAnswer.toLowerCase().trim(), 10);
		}

		// Calculate expiration
		let expiresAt: Date | null = null;
		if (dto.expiresAt) {
			expiresAt = new Date(dto.expiresAt);
			if (expiresAt <= new Date()) {
				throw new BadRequestException('Expiration date must be in the future');
			}
		} else {
			// Default expiration
			expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + GIFT_CODE_RULES.defaultExpirationDays);
		}

		return await db.transaction(async (tx) => {
			// 1. Get user balance with row lock
			const [userBalance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, userId))
				.for('update')
				.limit(1);

			if (!userBalance) {
				throw new NotFoundException('User balance not found');
			}

			const totalAvailable = userBalance.balance + userBalance.freeCreditsRemaining;
			if (totalAvailable < totalCredits) {
				throw new BadRequestException(
					`Insufficient credits. Required: ${totalCredits}, Available: ${totalAvailable}`
				);
			}

			// 2. Generate unique code
			const code = await this.generateUniqueCode();

			// 3. Deduct credits from user (reserve them)
			const freeCreditsUsed = Math.min(totalCredits, userBalance.freeCreditsRemaining);
			const paidCreditsUsed = totalCredits - freeCreditsUsed;

			const newFreeCredits = userBalance.freeCreditsRemaining - freeCreditsUsed;
			const newBalance = userBalance.balance - paidCreditsUsed;

			const updateResult = await tx
				.update(balances)
				.set({
					balance: newBalance,
					freeCreditsRemaining: newFreeCredits,
					version: userBalance.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, userId), eq(balances.version, userBalance.version)))
				.returning();

			if (updateResult.length === 0) {
				throw new ConflictException('Balance was modified. Please retry.');
			}

			// 4. Create reservation transaction
			const [reservationTx] = await tx
				.insert(transactions)
				.values({
					userId,
					type: 'gift_reserve',
					status: 'completed',
					amount: -totalCredits,
					balanceBefore: totalAvailable,
					balanceAfter: newBalance + newFreeCredits,
					appId: dto.sourceAppId || 'gift',
					description: `Gift code reservation: ${code}`,
					completedAt: new Date(),
				})
				.returning();

			// 5. Create gift code
			const baseUrl = this.configService.get<string>('app.baseUrl') || 'https://mana.how';
			const shortUrl = `${baseUrl}/g/${code}`;

			const [giftCode] = await tx
				.insert(giftCodes)
				.values({
					code,
					shortUrl,
					creatorId: userId,
					totalCredits,
					creditsPerPortion,
					totalPortions: portions,
					claimedPortions: 0,
					type,
					status: 'active',
					targetEmail: dto.targetEmail || null,
					targetMatrixId: dto.targetMatrixId || null,
					riddleQuestion: dto.riddleQuestion || null,
					riddleAnswerHash,
					message: dto.message || null,
					expiresAt,
					reservationTransactionId: reservationTx.id,
				})
				.returning();

			this.logger.log('Gift code created', {
				codeId: giftCode.id,
				code,
				userId,
				totalCredits,
				type,
			});

			return {
				id: giftCode.id,
				code: giftCode.code,
				url: shortUrl,
				totalCredits,
				creditsPerPortion,
				totalPortions: portions,
				type,
				expiresAt: expiresAt?.toISOString(),
			};
		});
	}

	/**
	 * Get gift code info (public, for preview before redeeming)
	 */
	async getGiftCodeInfo(code: string): Promise<GiftCodeInfoResponse | null> {
		const db = this.getDb();

		const [giftCode] = await db
			.select({
				code: giftCodes.code,
				type: giftCodes.type,
				status: giftCodes.status,
				creditsPerPortion: giftCodes.creditsPerPortion,
				totalPortions: giftCodes.totalPortions,
				claimedPortions: giftCodes.claimedPortions,
				message: giftCodes.message,
				riddleQuestion: giftCodes.riddleQuestion,
				targetEmail: giftCodes.targetEmail,
				targetMatrixId: giftCodes.targetMatrixId,
				expiresAt: giftCodes.expiresAt,
				creatorId: giftCodes.creatorId,
			})
			.from(giftCodes)
			.where(eq(giftCodes.code, code.toUpperCase()))
			.limit(1);

		if (!giftCode) {
			return null;
		}

		// Get creator name
		const [creator] = await db
			.select({ name: users.name })
			.from(users)
			.where(eq(users.id, giftCode.creatorId))
			.limit(1);

		return {
			code: giftCode.code,
			type: giftCode.type,
			status: giftCode.status,
			creditsPerPortion: giftCode.creditsPerPortion,
			totalPortions: giftCode.totalPortions,
			claimedPortions: giftCode.claimedPortions,
			remainingPortions: giftCode.totalPortions - giftCode.claimedPortions,
			message: giftCode.message || undefined,
			riddleQuestion: giftCode.riddleQuestion || undefined,
			hasRiddle: !!giftCode.riddleQuestion,
			isPersonalized: !!(giftCode.targetEmail || giftCode.targetMatrixId),
			expiresAt: giftCode.expiresAt?.toISOString(),
			creatorName: creator?.name || undefined,
		};
	}

	/**
	 * Redeem a gift code
	 */
	async redeemGiftCode(
		userId: string,
		code: string,
		dto: RedeemGiftDto,
		userEmail?: string,
		userMatrixId?: string
	): Promise<GiftRedeemResponse> {
		const db = this.getDb();

		return await db.transaction(async (tx) => {
			// 1. Get gift code with row lock
			const [giftCode] = await tx
				.select()
				.from(giftCodes)
				.where(eq(giftCodes.code, code.toUpperCase()))
				.for('update')
				.limit(1);

			if (!giftCode) {
				return { success: false, error: 'Gift code not found' };
			}

			// 2. Check status
			if (giftCode.status !== 'active') {
				const statusMessages: Record<string, string> = {
					depleted: 'This gift code has been fully claimed',
					expired: 'This gift code has expired',
					cancelled: 'This gift code has been cancelled',
					refunded: 'This gift code has been refunded',
				};
				return {
					success: false,
					error: statusMessages[giftCode.status] || 'Gift code is not active',
				};
			}

			// 3. Check expiration
			if (giftCode.expiresAt && giftCode.expiresAt < new Date()) {
				// Update status to expired
				await tx
					.update(giftCodes)
					.set({ status: 'expired', updatedAt: new Date() })
					.where(eq(giftCodes.id, giftCode.id));

				return { success: false, error: 'This gift code has expired' };
			}

			// 4. Check if depleted
			if (giftCode.claimedPortions >= giftCode.totalPortions) {
				await tx
					.update(giftCodes)
					.set({ status: 'depleted', updatedAt: new Date() })
					.where(eq(giftCodes.id, giftCode.id));

				return { success: false, error: 'This gift code has been fully claimed' };
			}

			// 5. Check personalization
			if (giftCode.targetEmail || giftCode.targetMatrixId) {
				const emailMatch =
					giftCode.targetEmail && userEmail?.toLowerCase() === giftCode.targetEmail.toLowerCase();
				const matrixMatch = giftCode.targetMatrixId && userMatrixId === giftCode.targetMatrixId;

				if (!emailMatch && !matrixMatch) {
					// Record failed attempt
					await tx.insert(giftRedemptions).values({
						giftCodeId: giftCode.id,
						redeemerUserId: userId,
						status: 'failed_wrong_user',
						creditsReceived: 0,
						sourceAppId: dto.sourceAppId ?? null,
					});

					return { success: false, error: 'This gift code is for a specific person' };
				}
			}

			// 6. Check riddle answer
			if (giftCode.riddleAnswerHash) {
				if (!dto.answer) {
					return { success: false, error: 'Please provide the answer to the riddle' };
				}

				const isCorrect = await bcrypt.compare(
					dto.answer.toLowerCase().trim(),
					giftCode.riddleAnswerHash
				);
				if (!isCorrect) {
					// Record failed attempt
					await tx.insert(giftRedemptions).values({
						giftCodeId: giftCode.id,
						redeemerUserId: userId,
						status: 'failed_wrong_answer',
						creditsReceived: 0,
						sourceAppId: dto.sourceAppId ?? null,
					});

					return { success: false, error: 'Incorrect answer' };
				}
			}

			// 7. Check if user already claimed (for most types except 'split')
			if (
				giftCode.type === 'simple' ||
				giftCode.type === 'personalized' ||
				giftCode.type === 'riddle' ||
				giftCode.type === 'first_come'
			) {
				const [existingClaim] = await tx
					.select({ id: giftRedemptions.id })
					.from(giftRedemptions)
					.where(
						and(
							eq(giftRedemptions.giftCodeId, giftCode.id),
							eq(giftRedemptions.redeemerUserId, userId),
							eq(giftRedemptions.status, 'success')
						)
					)
					.limit(1);

				if (existingClaim) {
					return { success: false, error: 'You have already claimed this gift' };
				}
			}

			// 8. Get or create redeemer balance
			let [redeemerBalance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, userId))
				.for('update')
				.limit(1);

			if (!redeemerBalance) {
				// Initialize balance
				[redeemerBalance] = await tx
					.insert(balances)
					.values({
						userId,
						balance: 0,
						freeCreditsRemaining: 150, // Signup bonus
						dailyFreeCredits: 5,
						lastDailyResetAt: new Date(),
					})
					.returning();
			}

			// 9. Add credits to redeemer
			const creditsToAdd = giftCode.creditsPerPortion;
			const newBalance = redeemerBalance.balance + creditsToAdd;
			const portionNumber = giftCode.claimedPortions + 1;

			await tx
				.update(balances)
				.set({
					balance: newBalance,
					totalEarned: redeemerBalance.totalEarned + creditsToAdd,
					version: redeemerBalance.version + 1,
					updatedAt: new Date(),
				})
				.where(eq(balances.userId, userId));

			// 10. Create credit transaction for receiver
			const [creditTx] = await tx
				.insert(transactions)
				.values({
					userId,
					type: 'gift_receive',
					status: 'completed',
					amount: creditsToAdd,
					balanceBefore: redeemerBalance.balance,
					balanceAfter: newBalance,
					appId: dto.sourceAppId || 'gift',
					description: `Gift received: ${giftCode.code}`,
					metadata: { giftCodeId: giftCode.id, portionNumber },
					completedAt: new Date(),
				})
				.returning();

			// 11. Update gift code
			const newClaimedPortions = giftCode.claimedPortions + 1;
			const newStatus = newClaimedPortions >= giftCode.totalPortions ? 'depleted' : 'active';

			await tx
				.update(giftCodes)
				.set({
					claimedPortions: newClaimedPortions,
					status: newStatus,
					updatedAt: new Date(),
				})
				.where(eq(giftCodes.id, giftCode.id));

			// 12. Record successful redemption
			await tx.insert(giftRedemptions).values({
				giftCodeId: giftCode.id,
				redeemerUserId: userId,
				status: 'success',
				creditsReceived: creditsToAdd,
				portionNumber,
				creditTransactionId: creditTx.id,
				sourceAppId: dto.sourceAppId ?? null,
			});

			this.logger.log('Gift code redeemed', {
				code: giftCode.code,
				redeemerUserId: userId,
				credits: creditsToAdd,
				portionNumber,
			});

			return {
				success: true,
				credits: creditsToAdd,
				message: giftCode.message || undefined,
				newBalance,
			};
		});
	}

	/**
	 * Cancel a gift code and refund remaining credits
	 */
	async cancelGiftCode(userId: string, codeId: string): Promise<{ refundedCredits: number }> {
		const db = this.getDb();

		return await db.transaction(async (tx) => {
			// 1. Get gift code with row lock
			const [giftCode] = await tx
				.select()
				.from(giftCodes)
				.where(and(eq(giftCodes.id, codeId), eq(giftCodes.creatorId, userId)))
				.for('update')
				.limit(1);

			if (!giftCode) {
				throw new NotFoundException('Gift code not found');
			}

			if (giftCode.status !== 'active') {
				throw new BadRequestException('Gift code cannot be cancelled in current status');
			}

			// 2. Calculate refund
			const unclaimedPortions = giftCode.totalPortions - giftCode.claimedPortions;
			const refundAmount = unclaimedPortions * giftCode.creditsPerPortion;

			if (refundAmount > 0) {
				// 3. Get creator balance
				const [creatorBalance] = await tx
					.select()
					.from(balances)
					.where(eq(balances.userId, userId))
					.for('update')
					.limit(1);

				if (!creatorBalance) {
					throw new NotFoundException('Creator balance not found');
				}

				// 4. Refund credits
				const newBalance = creatorBalance.balance + refundAmount;

				await tx
					.update(balances)
					.set({
						balance: newBalance,
						totalEarned: creatorBalance.totalEarned + refundAmount,
						version: creatorBalance.version + 1,
						updatedAt: new Date(),
					})
					.where(eq(balances.userId, userId));

				// 5. Create refund transaction
				await tx.insert(transactions).values({
					userId,
					type: 'gift_release',
					status: 'completed',
					amount: refundAmount,
					balanceBefore: creatorBalance.balance,
					balanceAfter: newBalance,
					appId: 'gift',
					description: `Gift code cancelled: ${giftCode.code}`,
					metadata: { giftCodeId: giftCode.id },
					completedAt: new Date(),
				});
			}

			// 6. Update gift code status
			const newStatus = giftCode.claimedPortions > 0 ? 'cancelled' : 'refunded';

			await tx
				.update(giftCodes)
				.set({
					status: newStatus,
					updatedAt: new Date(),
				})
				.where(eq(giftCodes.id, giftCode.id));

			this.logger.log('Gift code cancelled', {
				codeId: giftCode.id,
				code: giftCode.code,
				refundedCredits: refundAmount,
			});

			return { refundedCredits: refundAmount };
		});
	}

	/**
	 * List gift codes created by a user
	 */
	async listCreatedGifts(userId: string): Promise<GiftListItem[]> {
		const db = this.getDb();

		const codes = await db
			.select({
				id: giftCodes.id,
				code: giftCodes.code,
				shortUrl: giftCodes.shortUrl,
				type: giftCodes.type,
				status: giftCodes.status,
				totalCredits: giftCodes.totalCredits,
				creditsPerPortion: giftCodes.creditsPerPortion,
				totalPortions: giftCodes.totalPortions,
				claimedPortions: giftCodes.claimedPortions,
				message: giftCodes.message,
				expiresAt: giftCodes.expiresAt,
				createdAt: giftCodes.createdAt,
			})
			.from(giftCodes)
			.where(eq(giftCodes.creatorId, userId))
			.orderBy(desc(giftCodes.createdAt))
			.limit(50);

		return codes.map((code) => ({
			id: code.id,
			code: code.code,
			url: code.shortUrl || `https://mana.how/g/${code.code}`,
			type: code.type,
			status: code.status,
			totalCredits: code.totalCredits,
			creditsPerPortion: code.creditsPerPortion,
			totalPortions: code.totalPortions,
			claimedPortions: code.claimedPortions,
			message: code.message || undefined,
			expiresAt: code.expiresAt?.toISOString(),
			createdAt: code.createdAt.toISOString(),
		}));
	}

	/**
	 * List gifts received by a user
	 */
	async listReceivedGifts(userId: string): Promise<ReceivedGiftItem[]> {
		const db = this.getDb();

		const redemptions = await db
			.select({
				id: giftRedemptions.id,
				code: giftCodes.code,
				credits: giftRedemptions.creditsReceived,
				message: giftCodes.message,
				creatorId: giftCodes.creatorId,
				redeemedAt: giftRedemptions.createdAt,
			})
			.from(giftRedemptions)
			.innerJoin(giftCodes, eq(giftRedemptions.giftCodeId, giftCodes.id))
			.where(and(eq(giftRedemptions.redeemerUserId, userId), eq(giftRedemptions.status, 'success')))
			.orderBy(desc(giftRedemptions.createdAt))
			.limit(50);

		// Get creator names
		const creatorIds = [...new Set(redemptions.map((r) => r.creatorId))];
		const creators =
			creatorIds.length > 0
				? await db
						.select({ id: users.id, name: users.name })
						.from(users)
						.where(sql`${users.id} = ANY(${creatorIds})`)
				: [];

		const creatorMap = new Map(creators.map((c) => [c.id, c.name]));

		return redemptions.map((r) => ({
			id: r.id,
			code: r.code,
			credits: r.credits,
			message: r.message || undefined,
			creatorName: creatorMap.get(r.creatorId) || undefined,
			redeemedAt: r.redeemedAt.toISOString(),
		}));
	}
}
