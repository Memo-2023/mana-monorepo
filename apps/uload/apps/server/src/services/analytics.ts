import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';

/**
 * Analytics service that reads click data from the dedicated uload.clicks table.
 * Uses SQL indexes on link_id, clicked_at, country, device_type for fast aggregation.
 */
export class AnalyticsService {
	constructor(private db: Database) {}

	async getClickStats(linkId: string) {
		const result = await this.db.execute(sql`
			SELECT
				count(*)::int as "totalClicks",
				count(DISTINCT ip_hash)::int as "uniqueVisitors"
			FROM uload.clicks
			WHERE link_id = ${linkId}
		`);
		const rows = result as unknown as { totalClicks: number; uniqueVisitors: number }[];
		return rows[0] ?? { totalClicks: 0, uniqueVisitors: 0 };
	}

	async getClicksOverTime(linkId: string, days = 30) {
		return this.db.execute(sql`
			SELECT
				date_trunc('day', clicked_at)::date::text as date,
				count(*)::int as count
			FROM uload.clicks
			WHERE link_id = ${linkId}
				AND clicked_at >= now() - make_interval(days => ${days})
			GROUP BY date_trunc('day', clicked_at)
			ORDER BY date_trunc('day', clicked_at)
		`) as unknown as { date: string; count: number }[];
	}

	async getTopReferrers(linkId: string, limit = 10) {
		return this.db.execute(sql`
			SELECT
				COALESCE(referer, 'Direct') as referer,
				count(*)::int as count
			FROM uload.clicks
			WHERE link_id = ${linkId}
			GROUP BY referer
			ORDER BY count(*) DESC
			LIMIT ${limit}
		`) as unknown as { referer: string; count: number }[];
	}

	async getDeviceBreakdown(linkId: string) {
		return this.db.execute(sql`
			SELECT
				COALESCE(device_type, 'Unknown') as "deviceType",
				count(*)::int as count
			FROM uload.clicks
			WHERE link_id = ${linkId}
			GROUP BY device_type
			ORDER BY count(*) DESC
		`) as unknown as { deviceType: string; count: number }[];
	}

	async getCountryBreakdown(linkId: string) {
		return this.db.execute(sql`
			SELECT
				COALESCE(country, 'Unknown') as country,
				count(*)::int as count
			FROM uload.clicks
			WHERE link_id = ${linkId}
			GROUP BY country
			ORDER BY count(*) DESC
		`) as unknown as { country: string; count: number }[];
	}
}
