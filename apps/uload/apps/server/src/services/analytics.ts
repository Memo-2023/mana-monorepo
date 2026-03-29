import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';

/**
 * Analytics service that reads click data from mana-sync's sync_changes table.
 * Clicks are stored with app_id='uload', table_name='clicks'.
 */
export class AnalyticsService {
	constructor(private db: Database) {}

	async getClickStats(linkId: string) {
		const result = await this.db.execute(sql`
			SELECT
				count(*)::int as "totalClicks",
				count(DISTINCT data->>'ipHash')::int as "uniqueVisitors"
			FROM sync_changes
			WHERE app_id = 'uload' AND table_name = 'clicks'
				AND data->>'linkId' = ${linkId}
				AND op = 'insert'
		`);
		const rows = result as unknown as { totalClicks: number; uniqueVisitors: number }[];
		return rows[0] ?? { totalClicks: 0, uniqueVisitors: 0 };
	}

	async getClicksOverTime(linkId: string, days = 30) {
		return this.db.execute(sql`
			SELECT
				date_trunc('day', created_at)::date::text as date,
				count(*)::int as count
			FROM sync_changes
			WHERE app_id = 'uload' AND table_name = 'clicks'
				AND data->>'linkId' = ${linkId}
				AND op = 'insert'
				AND created_at >= now() - make_interval(days => ${days})
			GROUP BY date_trunc('day', created_at)
			ORDER BY date_trunc('day', created_at)
		`) as unknown as { date: string; count: number }[];
	}

	async getTopReferrers(linkId: string, limit = 10) {
		return this.db.execute(sql`
			SELECT
				COALESCE(data->>'referer', 'Direct') as referer,
				count(*)::int as count
			FROM sync_changes
			WHERE app_id = 'uload' AND table_name = 'clicks'
				AND data->>'linkId' = ${linkId}
				AND op = 'insert'
			GROUP BY data->>'referer'
			ORDER BY count(*) DESC
			LIMIT ${limit}
		`) as unknown as { referer: string; count: number }[];
	}

	async getDeviceBreakdown(linkId: string) {
		return this.db.execute(sql`
			SELECT
				COALESCE(data->>'deviceType', 'Unknown') as "deviceType",
				count(*)::int as count
			FROM sync_changes
			WHERE app_id = 'uload' AND table_name = 'clicks'
				AND data->>'linkId' = ${linkId}
				AND op = 'insert'
			GROUP BY data->>'deviceType'
			ORDER BY count(*) DESC
		`) as unknown as { deviceType: string; count: number }[];
	}

	async getCountryBreakdown(linkId: string) {
		return this.db.execute(sql`
			SELECT
				COALESCE(data->>'country', 'Unknown') as country,
				count(*)::int as count
			FROM sync_changes
			WHERE app_id = 'uload' AND table_name = 'clicks'
				AND data->>'linkId' = ${linkId}
				AND op = 'insert'
			GROUP BY data->>'country'
			ORDER BY count(*) DESC
		`) as unknown as { country: string; count: number }[];
	}
}
