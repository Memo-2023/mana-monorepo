import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_TOKEN } from '../database.module';
import type { Database } from '../database.module';
import { clicks, eq, desc, sql, and, gte, lte } from '@manacore/uload-database';
import type { Click, NewClick } from '@manacore/uload-database';

export interface ClickStats {
	totalClicks: number;
	uniqueVisitors: number;
	topCountries: { country: string; count: number }[];
	topBrowsers: { browser: string; count: number }[];
	topDevices: { deviceType: string; count: number }[];
	clicksByDay: { date: string; count: number }[];
}

@Injectable()
export class ClickRepository {
	private readonly logger = new Logger(ClickRepository.name);

	constructor(@Inject(DATABASE_TOKEN) private readonly db: Database) {}

	async create(data: NewClick): Promise<Click> {
		const result = await this.db.insert(clicks).values(data).returning();
		return result[0];
	}

	async findByLinkId(
		linkId: string,
		options: { limit?: number; offset?: number } = {}
	): Promise<Click[]> {
		const { limit = 100, offset = 0 } = options;
		return this.db
			.select()
			.from(clicks)
			.where(eq(clicks.linkId, linkId))
			.orderBy(desc(clicks.clickedAt))
			.limit(limit)
			.offset(offset);
	}

	async countByLinkId(linkId: string): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(clicks)
			.where(eq(clicks.linkId, linkId));
		return result[0]?.count || 0;
	}

	async getStats(linkId: string, fromDate?: Date, toDate?: Date): Promise<ClickStats> {
		const conditions = [eq(clicks.linkId, linkId)];

		if (fromDate) {
			conditions.push(gte(clicks.clickedAt, fromDate));
		}
		if (toDate) {
			conditions.push(lte(clicks.clickedAt, toDate));
		}

		const whereClause = and(...conditions);

		// Total clicks
		const totalResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(clicks)
			.where(whereClause);

		// Unique visitors (by IP hash)
		const uniqueResult = await this.db
			.select({ count: sql<number>`count(distinct ${clicks.ipHash})::int` })
			.from(clicks)
			.where(whereClause);

		// Top countries
		const countriesResult = await this.db
			.select({
				country: clicks.country,
				count: sql<number>`count(*)::int`,
			})
			.from(clicks)
			.where(whereClause)
			.groupBy(clicks.country)
			.orderBy(sql`count(*) desc`)
			.limit(10);

		// Top browsers
		const browsersResult = await this.db
			.select({
				browser: clicks.browser,
				count: sql<number>`count(*)::int`,
			})
			.from(clicks)
			.where(whereClause)
			.groupBy(clicks.browser)
			.orderBy(sql`count(*) desc`)
			.limit(10);

		// Top devices
		const devicesResult = await this.db
			.select({
				deviceType: clicks.deviceType,
				count: sql<number>`count(*)::int`,
			})
			.from(clicks)
			.where(whereClause)
			.groupBy(clicks.deviceType)
			.orderBy(sql`count(*) desc`)
			.limit(10);

		// Clicks by day (last 30 days)
		const clicksByDayResult = await this.db
			.select({
				date: sql<string>`date_trunc('day', ${clicks.clickedAt})::date::text`,
				count: sql<number>`count(*)::int`,
			})
			.from(clicks)
			.where(whereClause)
			.groupBy(sql`date_trunc('day', ${clicks.clickedAt})`)
			.orderBy(sql`date_trunc('day', ${clicks.clickedAt})`)
			.limit(30);

		return {
			totalClicks: totalResult[0]?.count || 0,
			uniqueVisitors: uniqueResult[0]?.count || 0,
			topCountries: countriesResult.map((r) => ({
				country: r.country || 'Unknown',
				count: r.count,
			})),
			topBrowsers: browsersResult.map((r) => ({
				browser: r.browser || 'Unknown',
				count: r.count,
			})),
			topDevices: devicesResult.map((r) => ({
				deviceType: r.deviceType || 'Unknown',
				count: r.count,
			})),
			clicksByDay: clicksByDayResult.map((r) => ({
				date: r.date,
				count: r.count,
			})),
		};
	}

	async deleteByLinkId(linkId: string): Promise<number> {
		const result = await this.db
			.delete(clicks)
			.where(eq(clicks.linkId, linkId))
			.returning({ id: clicks.id });
		return result.length;
	}
}
