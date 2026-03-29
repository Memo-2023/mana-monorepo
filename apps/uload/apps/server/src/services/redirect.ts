import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';

interface ResolvedLink {
	id: string;
	originalUrl: string;
	isActive: boolean;
	password: string | null;
	maxClicks: number | null;
	clickCount: number;
	expiresAt: string | null;
}

/**
 * Reads link data from mana-sync's sync_changes table.
 * Data is stored as JSONB in the `data` column with app_id='uload' and table_name='links'.
 * We get the latest version of each record by using DISTINCT ON.
 */
export class RedirectService {
	constructor(private db: Database) {}

	async resolve(shortCode: string): Promise<ResolvedLink | null> {
		const result = await this.db.execute(sql`
			SELECT DISTINCT ON (record_id)
				record_id as id,
				data->>'originalUrl' as "originalUrl",
				COALESCE((data->>'isActive')::boolean, true) as "isActive",
				data->>'password' as password,
				(data->>'maxClicks')::int as "maxClicks",
				COALESCE((data->>'clickCount')::int, 0) as "clickCount",
				data->>'expiresAt' as "expiresAt"
			FROM sync_changes
			WHERE app_id = 'uload'
				AND table_name = 'links'
				AND data->>'shortCode' = ${shortCode}
				AND op != 'delete'
			ORDER BY record_id, created_at DESC
			LIMIT 1
		`);

		const rows = result as unknown as ResolvedLink[];
		const link = rows[0];
		if (!link) return null;
		if (!link.isActive) return null;
		if (link.expiresAt && new Date(link.expiresAt) < new Date()) return null;
		if (link.maxClicks && link.clickCount >= link.maxClicks) return null;

		return link;
	}

	async trackClick(
		linkId: string,
		meta: {
			ipHash?: string;
			userAgent?: string;
			referer?: string;
			browser?: string;
			deviceType?: string;
			os?: string;
			country?: string;
		}
	) {
		const clickId = crypto.randomUUID();
		const clickData = JSON.stringify({
			id: clickId,
			linkId,
			ipHash: meta.ipHash || null,
			userAgent: meta.userAgent || null,
			referer: meta.referer || null,
			browser: meta.browser || null,
			deviceType: meta.deviceType || null,
			os: meta.os || null,
			country: meta.country || null,
			clickedAt: new Date().toISOString(),
		});

		// Insert click as a sync_changes record so it's visible to clients
		await this.db.execute(sql`
			INSERT INTO sync_changes (app_id, table_name, record_id, user_id, op, data, client_id)
			VALUES ('uload', 'clicks', ${clickId}, 'system', 'insert', ${clickData}::jsonb, 'uload-server')
		`);
	}
}
