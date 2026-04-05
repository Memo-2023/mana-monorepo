/**
 * Guild Pool Service — Shared organization credit pools
 *
 * Ported from mana-auth GuildPoolService.
 * Membership checks via HTTP call to mana-auth (separate DB).
 */

import { eq, and, desc, gte, sql } from 'drizzle-orm';
import { guildPools, guildTransactions, guildSpendingLimits } from '../db/schema/guilds';
import type { Database } from '../db/connection';
import {
	BadRequestError,
	NotFoundError,
	ForbiddenError,
	InsufficientCreditsError,
} from '../lib/errors';

interface UseGuildCreditsParams {
	amount: number;
	appId: string;
	description: string;
	idempotencyKey?: string;
	metadata?: Record<string, unknown>;
}

export class GuildPoolService {
	constructor(
		private db: Database,
		private authUrl: string,
		private serviceKey: string
	) {}

	/** Verify guild membership via mana-auth internal API */
	private async verifyMembership(
		guildId: string,
		userId: string
	): Promise<{ isMember: boolean; role: string }> {
		try {
			const res = await fetch(`${this.authUrl}/api/v1/internal/org/${guildId}/member/${userId}`, {
				headers: { 'X-Service-Key': this.serviceKey },
			});
			if (!res.ok) return { isMember: false, role: '' };
			return await res.json();
		} catch {
			return { isMember: false, role: '' };
		}
	}

	async initializePool(organizationId: string) {
		const [existing] = await this.db
			.select()
			.from(guildPools)
			.where(eq(guildPools.organizationId, organizationId))
			.limit(1);

		if (existing) return existing;

		const [pool] = await this.db
			.insert(guildPools)
			.values({ organizationId, balance: 0, totalFunded: 0, totalSpent: 0 })
			.returning();

		return pool;
	}

	async getBalance(guildId: string, userId: string) {
		const membership = await this.verifyMembership(guildId, userId);
		if (!membership.isMember) throw new ForbiddenError('Not a guild member');

		const [pool] = await this.db
			.select()
			.from(guildPools)
			.where(eq(guildPools.organizationId, guildId))
			.limit(1);

		if (!pool) throw new NotFoundError('Guild pool not found');

		return { balance: pool.balance, totalFunded: pool.totalFunded, totalSpent: pool.totalSpent };
	}

	async useGuildCredits(guildId: string, userId: string, params: UseGuildCreditsParams) {
		const membership = await this.verifyMembership(guildId, userId);
		if (!membership.isMember) throw new ForbiddenError('Not a guild member');

		// Check spending limits
		await this.checkSpendingLimits(guildId, userId, params.amount);

		// Idempotency
		if (params.idempotencyKey) {
			const [existing] = await this.db
				.select()
				.from(guildTransactions)
				.where(eq(guildTransactions.idempotencyKey, params.idempotencyKey))
				.limit(1);
			if (existing) return { success: true, transaction: existing };
		}

		return await this.db.transaction(async (tx) => {
			const [pool] = await tx
				.select()
				.from(guildPools)
				.where(eq(guildPools.organizationId, guildId))
				.for('update')
				.limit(1);

			if (!pool) throw new NotFoundError('Guild pool not found');
			if (pool.balance < params.amount) {
				throw new InsufficientCreditsError(params.amount, pool.balance);
			}

			const newBalance = pool.balance - params.amount;

			await tx
				.update(guildPools)
				.set({
					balance: newBalance,
					totalSpent: pool.totalSpent + params.amount,
					version: pool.version + 1,
					updatedAt: new Date(),
				})
				.where(and(eq(guildPools.organizationId, guildId), eq(guildPools.version, pool.version)));

			const [transaction] = await tx
				.insert(guildTransactions)
				.values({
					organizationId: guildId,
					userId,
					type: 'usage',
					amount: -params.amount,
					balanceBefore: pool.balance,
					balanceAfter: newBalance,
					appId: params.appId,
					description: params.description,
					metadata: params.metadata,
					idempotencyKey: params.idempotencyKey,
					completedAt: new Date(),
				})
				.returning();

			return { success: true, transaction, newBalance: { balance: newBalance } };
		});
	}

	async fundPool(guildId: string, funderId: string, amount: number, idempotencyKey?: string) {
		const membership = await this.verifyMembership(guildId, funderId);
		if (!membership.isMember || !['owner', 'admin'].includes(membership.role)) {
			throw new ForbiddenError('Only owners and admins can fund the pool');
		}

		return await this.db.transaction(async (tx) => {
			const [pool] = await tx
				.select()
				.from(guildPools)
				.where(eq(guildPools.organizationId, guildId))
				.for('update')
				.limit(1);

			if (!pool) throw new NotFoundError('Guild pool not found');

			const newBalance = pool.balance + amount;

			await tx
				.update(guildPools)
				.set({
					balance: newBalance,
					totalFunded: pool.totalFunded + amount,
					version: pool.version + 1,
					updatedAt: new Date(),
				})
				.where(eq(guildPools.organizationId, guildId));

			const [transaction] = await tx
				.insert(guildTransactions)
				.values({
					organizationId: guildId,
					userId: funderId,
					type: 'funding',
					amount,
					balanceBefore: pool.balance,
					balanceAfter: newBalance,
					description: `Pool funded with ${amount} credits`,
					idempotencyKey,
					completedAt: new Date(),
				})
				.returning();

			return { success: true, transaction, newBalance: { balance: newBalance } };
		});
	}

	async getTransactions(guildId: string, userId: string, limit = 50, offset = 0) {
		const membership = await this.verifyMembership(guildId, userId);
		if (!membership.isMember) throw new ForbiddenError('Not a guild member');

		return this.db
			.select()
			.from(guildTransactions)
			.where(eq(guildTransactions.organizationId, guildId))
			.orderBy(desc(guildTransactions.createdAt))
			.limit(limit)
			.offset(offset);
	}

	async getSpendingLimits(guildId: string, userId: string) {
		const [limit] = await this.db
			.select()
			.from(guildSpendingLimits)
			.where(
				and(eq(guildSpendingLimits.organizationId, guildId), eq(guildSpendingLimits.userId, userId))
			)
			.limit(1);

		return limit || { dailyLimit: null, monthlyLimit: null };
	}

	async setSpendingLimits(
		guildId: string,
		targetUserId: string,
		setterId: string,
		dailyLimit: number | null,
		monthlyLimit: number | null
	) {
		const membership = await this.verifyMembership(guildId, setterId);
		if (!membership.isMember || !['owner', 'admin'].includes(membership.role)) {
			throw new ForbiddenError('Only owners and admins can set spending limits');
		}

		const [existing] = await this.db
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
			await this.db
				.update(guildSpendingLimits)
				.set({ dailyLimit, monthlyLimit, updatedAt: new Date() })
				.where(eq(guildSpendingLimits.id, existing.id));
		} else {
			await this.db.insert(guildSpendingLimits).values({
				organizationId: guildId,
				userId: targetUserId,
				dailyLimit,
				monthlyLimit,
			});
		}

		return { dailyLimit, monthlyLimit };
	}

	private async checkSpendingLimits(guildId: string, userId: string, amount: number) {
		const [limit] = await this.db
			.select()
			.from(guildSpendingLimits)
			.where(
				and(eq(guildSpendingLimits.organizationId, guildId), eq(guildSpendingLimits.userId, userId))
			)
			.limit(1);

		if (!limit) return; // No limits set

		const now = new Date();

		if (limit.dailyLimit !== null) {
			const dayStart = new Date(now);
			dayStart.setHours(0, 0, 0, 0);

			const dailySpent = await this.db
				.select({ total: sql<number>`COALESCE(SUM(ABS(${guildTransactions.amount})), 0)` })
				.from(guildTransactions)
				.where(
					and(
						eq(guildTransactions.organizationId, guildId),
						eq(guildTransactions.userId, userId),
						eq(guildTransactions.type, 'usage'),
						gte(guildTransactions.createdAt, dayStart)
					)
				);

			const spent = Number(dailySpent[0]?.total ?? 0);
			if (spent + amount > limit.dailyLimit) {
				throw new BadRequestError(
					`Daily spending limit exceeded (${limit.dailyLimit} credits/day)`
				);
			}
		}

		if (limit.monthlyLimit !== null) {
			const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

			const monthlySpent = await this.db
				.select({ total: sql<number>`COALESCE(SUM(ABS(${guildTransactions.amount})), 0)` })
				.from(guildTransactions)
				.where(
					and(
						eq(guildTransactions.organizationId, guildId),
						eq(guildTransactions.userId, userId),
						eq(guildTransactions.type, 'usage'),
						gte(guildTransactions.createdAt, monthStart)
					)
				);

			const spent = Number(monthlySpent[0]?.total ?? 0);
			if (spent + amount > limit.monthlyLimit) {
				throw new BadRequestError(
					`Monthly spending limit exceeded (${limit.monthlyLimit} credits/month)`
				);
			}
		}
	}
}
