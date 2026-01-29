import { Injectable, Inject } from '@nestjs/common';
import { eq, sql, gte, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { apiUsage, apiUsageDaily, NewApiUsage } from '../db/schema';

export interface TrackUsageParams {
	apiKeyId: string;
	endpoint: string;
	method: string;
	path: string;
	latencyMs: number;
	statusCode: number;
	creditsUsed: number;
	requestSize?: number;
	responseSize?: number;
	creditReason?: string;
	metadata?: Record<string, any>;
}

export interface UsageSummary {
	totalRequests: number;
	totalCreditsUsed: number;
	avgLatencyMs: number;
	errorCount: number;
	byEndpoint: Record<
		string,
		{
			requests: number;
			credits: number;
			avgLatencyMs: number;
			errors: number;
		}
	>;
}

@Injectable()
export class UsageService {
	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: ReturnType<typeof import('../db/connection').getDb>
	) {}

	/**
	 * Track a single API usage event
	 */
	async track(params: TrackUsageParams): Promise<void> {
		const usage: NewApiUsage = {
			apiKeyId: params.apiKeyId,
			endpoint: params.endpoint,
			method: params.method,
			path: params.path,
			latencyMs: params.latencyMs,
			statusCode: params.statusCode,
			creditsUsed: params.creditsUsed,
			requestSize: params.requestSize,
			responseSize: params.responseSize,
			creditReason: params.creditReason,
			metadata: params.metadata,
		};

		await this.db.insert(apiUsage).values(usage);

		// Also update daily aggregates
		await this.updateDailyAggregate(params);
	}

	/**
	 * Update daily usage aggregate
	 */
	private async updateDailyAggregate(params: TrackUsageParams): Promise<void> {
		const today = new Date().toISOString().split('T')[0];
		const isError = params.statusCode >= 400;

		// Upsert daily aggregate
		await this.db
			.insert(apiUsageDaily)
			.values({
				apiKeyId: params.apiKeyId,
				date: today,
				endpoint: params.endpoint,
				requestCount: 1,
				creditsUsed: params.creditsUsed,
				totalLatencyMs: params.latencyMs,
				errorCount: isError ? 1 : 0,
			})
			.onConflictDoUpdate({
				target: [apiUsageDaily.apiKeyId, apiUsageDaily.date, apiUsageDaily.endpoint],
				set: {
					requestCount: sql`${apiUsageDaily.requestCount} + 1`,
					creditsUsed: sql`${apiUsageDaily.creditsUsed} + ${params.creditsUsed}`,
					totalLatencyMs: sql`${apiUsageDaily.totalLatencyMs} + ${params.latencyMs}`,
					errorCount: isError ? sql`${apiUsageDaily.errorCount} + 1` : apiUsageDaily.errorCount,
				},
			});
	}

	/**
	 * Get daily usage for an API key
	 */
	async getDailyUsage(apiKeyId: string, days: number = 30) {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const usage = await this.db
			.select()
			.from(apiUsageDaily)
			.where(
				and(
					eq(apiUsageDaily.apiKeyId, apiKeyId),
					gte(apiUsageDaily.date, startDate.toISOString().split('T')[0])
				)
			)
			.orderBy(desc(apiUsageDaily.date));

		return usage;
	}

	/**
	 * Get usage summary for an API key
	 */
	async getUsageSummary(apiKeyId: string, days: number = 30): Promise<UsageSummary> {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		const dailyUsage = await this.getDailyUsage(apiKeyId, days);

		const summary: UsageSummary = {
			totalRequests: 0,
			totalCreditsUsed: 0,
			avgLatencyMs: 0,
			errorCount: 0,
			byEndpoint: {},
		};

		let totalLatency = 0;

		for (const day of dailyUsage) {
			summary.totalRequests += day.requestCount;
			summary.totalCreditsUsed += day.creditsUsed;
			totalLatency += day.totalLatencyMs;
			summary.errorCount += day.errorCount;

			if (!summary.byEndpoint[day.endpoint]) {
				summary.byEndpoint[day.endpoint] = {
					requests: 0,
					credits: 0,
					avgLatencyMs: 0,
					errors: 0,
				};
			}

			const ep = summary.byEndpoint[day.endpoint];
			ep.requests += day.requestCount;
			ep.credits += day.creditsUsed;
			ep.avgLatencyMs += day.totalLatencyMs;
			ep.errors += day.errorCount;
		}

		if (summary.totalRequests > 0) {
			summary.avgLatencyMs = Math.round(totalLatency / summary.totalRequests);
		}

		// Calculate average latency per endpoint
		for (const endpoint of Object.keys(summary.byEndpoint)) {
			const ep = summary.byEndpoint[endpoint];
			if (ep.requests > 0) {
				ep.avgLatencyMs = Math.round(ep.avgLatencyMs / ep.requests);
			}
		}

		return summary;
	}

	/**
	 * Get recent usage logs for an API key
	 */
	async getRecentLogs(apiKeyId: string, limit: number = 100) {
		const logs = await this.db
			.select()
			.from(apiUsage)
			.where(eq(apiUsage.apiKeyId, apiKeyId))
			.orderBy(desc(apiUsage.createdAt))
			.limit(limit);

		return logs;
	}
}
