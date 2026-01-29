import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, sql, desc, and, gte } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { apiKeys, apiUsage, apiUsageDaily } from '../db/schema';
import { PRICING_TIERS, PricingTier } from '../config/pricing';
import { AdminUpdateKeyDto } from './dto/admin-update-key.dto';

interface ListKeysOptions {
	page: number;
	limit: number;
	userId?: string;
	tier?: string;
	active?: boolean;
}

@Injectable()
export class AdminService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: ReturnType<typeof import('../db/connection').getDb>
	) {}

	async listAllKeys(options: ListKeysOptions) {
		const { page, limit, userId, tier, active } = options;
		const offset = (page - 1) * limit;

		// Build conditions
		const conditions = [];
		if (userId) {
			conditions.push(eq(apiKeys.userId, userId));
		}
		if (tier) {
			conditions.push(eq(apiKeys.tier, tier));
		}
		if (active !== undefined) {
			conditions.push(eq(apiKeys.active, active));
		}

		const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

		const [keys, countResult] = await Promise.all([
			this.db
				.select({
					id: apiKeys.id,
					name: apiKeys.name,
					keyPrefix: apiKeys.keyPrefix,
					userId: apiKeys.userId,
					organizationId: apiKeys.organizationId,
					tier: apiKeys.tier,
					rateLimit: apiKeys.rateLimit,
					monthlyCredits: apiKeys.monthlyCredits,
					creditsUsed: apiKeys.creditsUsed,
					active: apiKeys.active,
					lastUsedAt: apiKeys.lastUsedAt,
					createdAt: apiKeys.createdAt,
				})
				.from(apiKeys)
				.where(whereClause)
				.orderBy(desc(apiKeys.createdAt))
				.limit(limit)
				.offset(offset),
			this.db
				.select({ count: sql<number>`count(*)` })
				.from(apiKeys)
				.where(whereClause),
		]);

		const total = Number(countResult[0]?.count || 0);

		return {
			apiKeys: keys,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getKeyDetails(id: string) {
		const key = await this.db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);

		if (!key.length) {
			throw new NotFoundException('API key not found');
		}

		// Get recent usage
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const recentUsage = await this.db
			.select({
				endpoint: apiUsageDaily.endpoint,
				requestCount: sql<number>`sum(${apiUsageDaily.requestCount})`,
				creditsUsed: sql<number>`sum(${apiUsageDaily.creditsUsed})`,
			})
			.from(apiUsageDaily)
			.where(
				and(
					eq(apiUsageDaily.apiKeyId, id),
					gte(apiUsageDaily.date, thirtyDaysAgo.toISOString().split('T')[0])
				)
			)
			.groupBy(apiUsageDaily.endpoint);

		return {
			apiKey: {
				...key[0],
				keyHash: undefined, // Don't expose hash
			},
			usage: {
				last30Days: recentUsage,
			},
		};
	}

	async updateKey(id: string, dto: AdminUpdateKeyDto) {
		// Verify key exists
		const existing = await this.db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);

		if (!existing.length) {
			throw new NotFoundException('API key not found');
		}

		// Build update object
		const updates: Record<string, unknown> = {
			updatedAt: new Date(),
		};

		if (dto.name !== undefined) updates.name = dto.name;
		if (dto.description !== undefined) updates.description = dto.description;
		if (dto.active !== undefined) updates.active = dto.active;
		if (dto.expiresAt !== undefined) updates.expiresAt = new Date(dto.expiresAt);
		if (dto.rateLimit !== undefined) updates.rateLimit = dto.rateLimit;
		if (dto.monthlyCredits !== undefined) updates.monthlyCredits = dto.monthlyCredits;

		if (dto.allowedEndpoints !== undefined) {
			updates.allowedEndpoints = JSON.stringify(dto.allowedEndpoints);
		}

		if (dto.allowedIps !== undefined) {
			updates.allowedIps = JSON.stringify(dto.allowedIps);
		}

		if (dto.resetCredits) {
			updates.creditsUsed = 0;
		}

		// If tier is changed, apply tier defaults
		if (dto.tier !== undefined) {
			const tierConfig = PRICING_TIERS[dto.tier as PricingTier];
			updates.tier = dto.tier;
			// Only apply tier defaults if not explicitly set
			if (dto.rateLimit === undefined) updates.rateLimit = tierConfig.rateLimit;
			if (dto.monthlyCredits === undefined) updates.monthlyCredits = tierConfig.monthlyCredits;
		}

		const [updated] = await this.db
			.update(apiKeys)
			.set(updates)
			.where(eq(apiKeys.id, id))
			.returning();

		return {
			apiKey: {
				...updated,
				keyHash: undefined,
			},
		};
	}

	async deleteKey(id: string) {
		const existing = await this.db.select().from(apiKeys).where(eq(apiKeys.id, id)).limit(1);

		if (!existing.length) {
			throw new NotFoundException('API key not found');
		}

		// Delete usage data first (foreign key constraint)
		await this.db.delete(apiUsageDaily).where(eq(apiUsageDaily.apiKeyId, id));
		await this.db.delete(apiUsage).where(eq(apiUsage.apiKeyId, id));

		// Delete the key
		await this.db.delete(apiKeys).where(eq(apiKeys.id, id));
	}

	async getSystemUsage(days: number) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const dailyStats = await this.db
			.select({
				date: apiUsageDaily.date,
				requestCount: sql<number>`sum(${apiUsageDaily.requestCount})`,
				creditsUsed: sql<number>`sum(${apiUsageDaily.creditsUsed})`,
				errorCount: sql<number>`sum(${apiUsageDaily.errorCount})`,
			})
			.from(apiUsageDaily)
			.where(gte(apiUsageDaily.date, startDate.toISOString().split('T')[0]))
			.groupBy(apiUsageDaily.date)
			.orderBy(apiUsageDaily.date);

		const endpointStats = await this.db
			.select({
				endpoint: apiUsageDaily.endpoint,
				requestCount: sql<number>`sum(${apiUsageDaily.requestCount})`,
				creditsUsed: sql<number>`sum(${apiUsageDaily.creditsUsed})`,
			})
			.from(apiUsageDaily)
			.where(gte(apiUsageDaily.date, startDate.toISOString().split('T')[0]))
			.groupBy(apiUsageDaily.endpoint);

		const tierStats = await this.db
			.select({
				tier: apiKeys.tier,
				keyCount: sql<number>`count(*)`,
				activeCount: sql<number>`sum(case when ${apiKeys.active} then 1 else 0 end)`,
			})
			.from(apiKeys)
			.groupBy(apiKeys.tier);

		return {
			period: {
				start: startDate.toISOString().split('T')[0],
				end: new Date().toISOString().split('T')[0],
				days,
			},
			daily: dailyStats,
			byEndpoint: endpointStats,
			byTier: tierStats,
		};
	}

	async getTopUsers(limit: number, days: number) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const topUsers = await this.db
			.select({
				apiKeyId: apiUsageDaily.apiKeyId,
				keyName: apiKeys.name,
				userId: apiKeys.userId,
				tier: apiKeys.tier,
				requestCount: sql<number>`sum(${apiUsageDaily.requestCount})`,
				creditsUsed: sql<number>`sum(${apiUsageDaily.creditsUsed})`,
			})
			.from(apiUsageDaily)
			.innerJoin(apiKeys, eq(apiUsageDaily.apiKeyId, apiKeys.id))
			.where(gte(apiUsageDaily.date, startDate.toISOString().split('T')[0]))
			.groupBy(apiUsageDaily.apiKeyId, apiKeys.name, apiKeys.userId, apiKeys.tier)
			.orderBy(desc(sql`sum(${apiUsageDaily.requestCount})`))
			.limit(limit);

		return {
			period: {
				start: startDate.toISOString().split('T')[0],
				end: new Date().toISOString().split('T')[0],
				days,
			},
			topUsers,
		};
	}
}
