import { eq, sql, and, gte, lte, desc } from 'drizzle-orm';
import { clicks } from '@manacore/uload-database';
import type { Database } from '../db/connection';

export class AnalyticsService {
	constructor(private db: Database) {}

	async getClicksByLink(linkId: string, from?: Date, to?: Date) {
		const conditions = [eq(clicks.linkId, linkId)];
		if (from) conditions.push(gte(clicks.clickedAt, from));
		if (to) conditions.push(lte(clicks.clickedAt, to));

		return this.db
			.select()
			.from(clicks)
			.where(and(...conditions))
			.orderBy(desc(clicks.clickedAt));
	}

	async getClickStats(linkId: string) {
		const [stats] = await this.db
			.select({
				totalClicks: sql<number>`count(*)`,
				uniqueVisitors: sql<number>`count(distinct ${clicks.ipHash})`,
				browsers: sql<Record<string, number>>`json_object_agg(
					coalesce(${clicks.browser}, 'unknown'),
					1
				)`,
			})
			.from(clicks)
			.where(eq(clicks.linkId, linkId));

		return stats;
	}

	async getClicksOverTime(linkId: string, days = 30) {
		const since = new Date();
		since.setDate(since.getDate() - days);

		return this.db
			.select({
				date: sql<string>`date_trunc('day', ${clicks.clickedAt})::date`,
				count: sql<number>`count(*)`,
			})
			.from(clicks)
			.where(and(eq(clicks.linkId, linkId), gte(clicks.clickedAt, since)))
			.groupBy(sql`date_trunc('day', ${clicks.clickedAt})`)
			.orderBy(sql`date_trunc('day', ${clicks.clickedAt})`);
	}

	async getTopReferrers(linkId: string, limit = 10) {
		return this.db
			.select({
				referer: clicks.referer,
				count: sql<number>`count(*)`,
			})
			.from(clicks)
			.where(eq(clicks.linkId, linkId))
			.groupBy(clicks.referer)
			.orderBy(desc(sql`count(*)`))
			.limit(limit);
	}

	async getDeviceBreakdown(linkId: string) {
		return this.db
			.select({
				deviceType: clicks.deviceType,
				count: sql<number>`count(*)`,
			})
			.from(clicks)
			.where(eq(clicks.linkId, linkId))
			.groupBy(clicks.deviceType)
			.orderBy(desc(sql`count(*)`));
	}

	async getCountryBreakdown(linkId: string) {
		return this.db
			.select({
				country: clicks.country,
				count: sql<number>`count(*)`,
			})
			.from(clicks)
			.where(eq(clicks.linkId, linkId))
			.groupBy(clicks.country)
			.orderBy(desc(sql`count(*)`));
	}
}
