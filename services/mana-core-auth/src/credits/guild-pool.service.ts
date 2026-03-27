import {
	Injectable,
	BadRequestException,
	ForbiddenException,
	NotFoundException,
	ConflictException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { getDb } from '../db/connection';
import {
	balances,
	transactions,
	guildPools,
	guildTransactions,
	guildSpendingLimits,
	members,
	usageStats,
} from '../db/schema';
import { UseCreditsDto } from './dto/use-credits.dto';

@Injectable()
export class GuildPoolService {
	private readonly logger = new Logger(GuildPoolService.name);

	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Verify user is a member of the guild. Returns the member record.
	 */
	private async verifyMembership(db: ReturnType<typeof getDb>, guildId: string, userId: string) {
		const [member] = await db
			.select()
			.from(members)
			.where(and(eq(members.organizationId, guildId), eq(members.userId, userId)))
			.limit(1);

		if (!member) {
			throw new ForbiddenException('User is not a member of this guild');
		}

		return member;
	}

	/**
	 * Verify user is owner or admin of the guild.
	 */
	private async verifyOwnerOrAdmin(db: ReturnType<typeof getDb>, guildId: string, userId: string) {
		const member = await this.verifyMembership(db, guildId, userId);

		if (member.role !== 'owner' && member.role !== 'admin') {
			throw new ForbiddenException('Only guild owners and admins can perform this action');
		}

		return member;
	}

	/**
	 * Initialize a guild pool with balance 0. Called when a guild is created.
	 */
	async initializeGuildPool(organizationId: string) {
		const db = this.getDb();

		const [existing] = await db
			.select()
			.from(guildPools)
			.where(eq(guildPools.organizationId, organizationId))
			.limit(1);

		if (existing) {
			return existing;
		}

		const [pool] = await db.insert(guildPools).values({ organizationId }).returning();

		this.logger.log('Guild pool initialized', { organizationId });
		return pool;
	}

	/**
	 * Get guild pool balance. Verifies the requesting user is a guild member.
	 */
	async getGuildPoolBalance(guildId: string, userId: string) {
		const db = this.getDb();
		await this.verifyMembership(db, guildId, userId);

		const [pool] = await db
			.select()
			.from(guildPools)
			.where(eq(guildPools.organizationId, guildId))
			.limit(1);

		if (!pool) {
			throw new NotFoundException('Guild pool not found');
		}

		return {
			balance: pool.balance,
			totalFunded: pool.totalFunded,
			totalSpent: pool.totalSpent,
		};
	}

	/**
	 * Fund the guild pool from a user's personal balance.
	 * Only owners and admins can fund.
	 */
	async fundGuildPool(guildId: string, funderId: string, amount: number, idempotencyKey?: string) {
		if (amount <= 0) {
			throw new BadRequestException('Amount must be positive');
		}

		const db = this.getDb();
		await this.verifyOwnerOrAdmin(db, guildId, funderId);

		// Check idempotency
		if (idempotencyKey) {
			const [existing] = await db
				.select()
				.from(guildTransactions)
				.where(eq(guildTransactions.idempotencyKey, idempotencyKey))
				.limit(1);

			if (existing) {
				return { success: true, message: 'Transaction already processed' };
			}
		}

		return await db.transaction(async (tx) => {
			// Lock and check personal balance
			const [personalBalance] = await tx
				.select()
				.from(balances)
				.where(eq(balances.userId, funderId))
				.for('update')
				.limit(1);

			if (!personalBalance) {
				throw new NotFoundException('Personal balance not found');
			}

			if (personalBalance.balance < amount) {
				throw new BadRequestException('Insufficient personal credits');
			}

			// Lock and update guild pool
			const [pool] = await tx
				.select()
				.from(guildPools)
				.where(eq(guildPools.organizationId, guildId))
				.for('update')
				.limit(1);

			if (!pool) {
				throw new NotFoundException('Guild pool not found');
			}

			const newPersonalBalance = personalBalance.balance - amount;
			const newPoolBalance = pool.balance + amount;

			// Debit personal balance
			const personalUpdate = await tx
				.update(balances)
				.set({
					balance: newPersonalBalance,
					totalSpent: personalBalance.totalSpent + amount,
					version: personalBalance.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(balances.userId, funderId), eq(balances.version, personalBalance.version)))
				.returning();

			if (personalUpdate.length === 0) {
				throw new ConflictException('Personal balance was modified concurrently. Please retry.');
			}

			// Credit guild pool
			const poolUpdate = await tx
				.update(guildPools)
				.set({
					balance: newPoolBalance,
					totalFunded: pool.totalFunded + amount,
					version: pool.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(guildPools.organizationId, guildId), eq(guildPools.version, pool.version)))
				.returning();

			if (poolUpdate.length === 0) {
				throw new ConflictException('Guild pool was modified concurrently. Please retry.');
			}

			// Record personal transaction (debit)
			await tx.insert(transactions).values({
				userId: funderId,
				type: 'guild_funding',
				status: 'completed',
				amount: -amount,
				balanceBefore: personalBalance.balance,
				balanceAfter: newPersonalBalance,
				appId: 'guild',
				description: `Funded guild pool`,
				guildId,
				idempotencyKey: idempotencyKey ? `personal:${idempotencyKey}` : undefined,
				completedAt: new Date(),
			});

			// Record guild transaction (credit)
			await tx.insert(guildTransactions).values({
				organizationId: guildId,
				userId: funderId,
				type: 'funding',
				amount,
				balanceBefore: pool.balance,
				balanceAfter: newPoolBalance,
				description: `Pool funded by member`,
				idempotencyKey,
				completedAt: new Date(),
			});

			this.logger.log('Guild pool funded', { guildId, funderId, amount, newPoolBalance });

			return {
				success: true,
				personalBalance: { balance: newPersonalBalance },
				poolBalance: { balance: newPoolBalance, totalFunded: pool.totalFunded + amount },
			};
		});
	}

	/**
	 * Use credits from the guild pool. Any member can use, subject to spending limits.
	 */
	async useGuildCredits(guildId: string, userId: string, dto: UseCreditsDto) {
		const db = this.getDb();
		await this.verifyMembership(db, guildId, userId);

		// Check idempotency
		if (dto.idempotencyKey) {
			const [existing] = await db
				.select()
				.from(guildTransactions)
				.where(eq(guildTransactions.idempotencyKey, dto.idempotencyKey))
				.limit(1);

			if (existing) {
				return { success: true, message: 'Transaction already processed' };
			}
		}

		// Check spending limits before entering transaction
		await this.checkSpendingLimits(db, guildId, userId, dto.amount);

		return await db.transaction(async (tx) => {
			// Lock guild pool
			const [pool] = await tx
				.select()
				.from(guildPools)
				.where(eq(guildPools.organizationId, guildId))
				.for('update')
				.limit(1);

			if (!pool) {
				throw new NotFoundException('Guild pool not found');
			}

			if (pool.balance < dto.amount) {
				throw new BadRequestException('Insufficient guild pool credits');
			}

			const newBalance = pool.balance - dto.amount;

			// Update pool
			const poolUpdate = await tx
				.update(guildPools)
				.set({
					balance: newBalance,
					totalSpent: pool.totalSpent + dto.amount,
					version: pool.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(guildPools.organizationId, guildId), eq(guildPools.version, pool.version)))
				.returning();

			if (poolUpdate.length === 0) {
				throw new ConflictException('Guild pool was modified concurrently. Please retry.');
			}

			// Record guild transaction
			const [transaction] = await tx
				.insert(guildTransactions)
				.values({
					organizationId: guildId,
					userId,
					type: 'usage',
					amount: -dto.amount,
					balanceBefore: pool.balance,
					balanceAfter: newBalance,
					appId: dto.appId,
					description: dto.description,
					metadata: dto.metadata,
					idempotencyKey: dto.idempotencyKey,
					completedAt: new Date(),
				})
				.returning();

			// Track usage stats
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			await tx.insert(usageStats).values({
				userId,
				appId: dto.appId,
				creditsUsed: dto.amount,
				date: today,
				metadata: { ...dto.metadata, guildId },
			});

			this.logger.log('Guild credits used', {
				guildId,
				userId,
				amount: dto.amount,
				appId: dto.appId,
				newBalance,
			});

			return {
				success: true,
				transaction,
				newBalance: { balance: newBalance },
			};
		});
	}

	/**
	 * Check if the user's spending is within their limits for this guild.
	 */
	private async checkSpendingLimits(
		db: ReturnType<typeof getDb>,
		guildId: string,
		userId: string,
		amount: number
	) {
		const [limits] = await db
			.select()
			.from(guildSpendingLimits)
			.where(
				and(eq(guildSpendingLimits.organizationId, guildId), eq(guildSpendingLimits.userId, userId))
			)
			.limit(1);

		// No limits set = unlimited
		if (!limits) return;

		const now = new Date();

		if (limits.dailyLimit !== null) {
			const startOfDay = new Date(now);
			startOfDay.setHours(0, 0, 0, 0);

			const [dailySpending] = await db
				.select({
					total: sql<number>`COALESCE(SUM(ABS(${guildTransactions.amount})), 0)`,
				})
				.from(guildTransactions)
				.where(
					and(
						eq(guildTransactions.organizationId, guildId),
						eq(guildTransactions.userId, userId),
						eq(guildTransactions.type, 'usage'),
						gte(guildTransactions.createdAt, startOfDay)
					)
				);

			const spent = Number(dailySpending.total);
			if (spent + amount > limits.dailyLimit) {
				throw new BadRequestException(
					`Daily spending limit exceeded. Limit: ${limits.dailyLimit}, spent today: ${spent}, requested: ${amount}`
				);
			}
		}

		if (limits.monthlyLimit !== null) {
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			const [monthlySpending] = await db
				.select({
					total: sql<number>`COALESCE(SUM(ABS(${guildTransactions.amount})), 0)`,
				})
				.from(guildTransactions)
				.where(
					and(
						eq(guildTransactions.organizationId, guildId),
						eq(guildTransactions.userId, userId),
						eq(guildTransactions.type, 'usage'),
						gte(guildTransactions.createdAt, startOfMonth)
					)
				);

			const spent = Number(monthlySpending.total);
			if (spent + amount > limits.monthlyLimit) {
				throw new BadRequestException(
					`Monthly spending limit exceeded. Limit: ${limits.monthlyLimit}, spent this month: ${spent}, requested: ${amount}`
				);
			}
		}
	}

	/**
	 * Get guild transaction history. Owners/admins see all; members see only their own.
	 */
	async getGuildTransactions(guildId: string, userId: string, limit = 50, offset = 0) {
		const db = this.getDb();
		const member = await this.verifyMembership(db, guildId, userId);

		const isAdmin = member.role === 'owner' || member.role === 'admin';

		const conditions = [eq(guildTransactions.organizationId, guildId)];

		// Members can only see their own transactions
		if (!isAdmin) {
			conditions.push(eq(guildTransactions.userId, userId));
		}

		return await db
			.select()
			.from(guildTransactions)
			.where(and(...conditions))
			.orderBy(desc(guildTransactions.createdAt))
			.limit(limit)
			.offset(offset);
	}

	/**
	 * Set spending limits for a guild member. Only owner/admin can set limits.
	 */
	async setSpendingLimit(
		guildId: string,
		setterId: string,
		targetUserId: string,
		dailyLimit?: number | null,
		monthlyLimit?: number | null
	) {
		const db = this.getDb();
		await this.verifyOwnerOrAdmin(db, guildId, setterId);
		await this.verifyMembership(db, guildId, targetUserId);

		if (dailyLimit !== undefined && dailyLimit !== null && dailyLimit < 0) {
			throw new BadRequestException('Daily limit must be non-negative');
		}
		if (monthlyLimit !== undefined && monthlyLimit !== null && monthlyLimit < 0) {
			throw new BadRequestException('Monthly limit must be non-negative');
		}

		// Upsert spending limits
		const [existing] = await db
			.select()
			.from(guildSpendingLimits)
			.where(
				and(
					eq(guildSpendingLimits.organizationId, guildId),
					eq(guildSpendingLimits.userId, targetUserId)
				)
			)
			.limit(1);

		if (existing) {
			const [updated] = await db
				.update(guildSpendingLimits)
				.set({
					dailyLimit: dailyLimit === undefined ? existing.dailyLimit : dailyLimit,
					monthlyLimit: monthlyLimit === undefined ? existing.monthlyLimit : monthlyLimit,
					updatedAt: new Date(),
				})
				.where(eq(guildSpendingLimits.id, existing.id))
				.returning();

			return updated;
		}

		const [created] = await db
			.insert(guildSpendingLimits)
			.values({
				organizationId: guildId,
				userId: targetUserId,
				dailyLimit: dailyLimit ?? null,
				monthlyLimit: monthlyLimit ?? null,
			})
			.returning();

		return created;
	}

	/**
	 * Get spending limits for a guild member.
	 */
	async getSpendingLimits(guildId: string, userId: string) {
		const db = this.getDb();
		await this.verifyMembership(db, guildId, userId);

		const [limits] = await db
			.select()
			.from(guildSpendingLimits)
			.where(
				and(eq(guildSpendingLimits.organizationId, guildId), eq(guildSpendingLimits.userId, userId))
			)
			.limit(1);

		return limits || { dailyLimit: null, monthlyLimit: null };
	}

	/**
	 * Get a member's spending summary (today + this month) vs their limits.
	 */
	async getMemberSpendingSummary(guildId: string, userId: string) {
		const db = this.getDb();
		await this.verifyMembership(db, guildId, userId);

		const now = new Date();
		const startOfDay = new Date(now);
		startOfDay.setHours(0, 0, 0, 0);
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const [dailySpending] = await db
			.select({
				total: sql<number>`COALESCE(SUM(ABS(${guildTransactions.amount})), 0)`,
			})
			.from(guildTransactions)
			.where(
				and(
					eq(guildTransactions.organizationId, guildId),
					eq(guildTransactions.userId, userId),
					eq(guildTransactions.type, 'usage'),
					gte(guildTransactions.createdAt, startOfDay)
				)
			);

		const [monthlySpending] = await db
			.select({
				total: sql<number>`COALESCE(SUM(ABS(${guildTransactions.amount})), 0)`,
			})
			.from(guildTransactions)
			.where(
				and(
					eq(guildTransactions.organizationId, guildId),
					eq(guildTransactions.userId, userId),
					eq(guildTransactions.type, 'usage'),
					gte(guildTransactions.createdAt, startOfMonth)
				)
			);

		const [limits] = await db
			.select()
			.from(guildSpendingLimits)
			.where(
				and(eq(guildSpendingLimits.organizationId, guildId), eq(guildSpendingLimits.userId, userId))
			)
			.limit(1);

		return {
			spentToday: Number(dailySpending.total),
			spentThisMonth: Number(monthlySpending.total),
			dailyLimit: limits?.dailyLimit ?? null,
			monthlyLimit: limits?.monthlyLimit ?? null,
			dailyRemaining:
				limits?.dailyLimit !== null && limits?.dailyLimit !== undefined
					? Math.max(0, limits.dailyLimit - Number(dailySpending.total))
					: null,
			monthlyRemaining:
				limits?.monthlyLimit !== null && limits?.monthlyLimit !== undefined
					? Math.max(0, limits.monthlyLimit - Number(monthlySpending.total))
					: null,
		};
	}
}
