import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';

export function createPublicRoutes(db: Database) {
	return new Hono().get('/u/:username', async (c) => {
		const username = c.req.param('username');

		// Query links for a user from sync_changes
		// Note: In mana-sync, user_id is the auth user ID, not username.
		// For public profiles, we'd need a user lookup. For now, treat username as user_id.
		const result = await db.execute(sql`
			SELECT DISTINCT ON (record_id)
				record_id as id,
				data->>'shortCode' as "shortCode",
				data->>'title' as title,
				data->>'description' as description,
				COALESCE((data->>'clickCount')::int, 0) as "clickCount",
				created_at as "createdAt"
			FROM sync_changes
			WHERE app_id = 'uload'
				AND table_name = 'links'
				AND user_id = ${username}
				AND op != 'delete'
				AND COALESCE((data->>'isActive')::boolean, true) = true
			ORDER BY record_id, created_at DESC
			LIMIT 50
		`);

		const links = result as unknown as {
			id: string;
			shortCode: string;
			title: string | null;
			description: string | null;
			clickCount: number;
			createdAt: string;
		}[];

		return c.json({
			user: { username, name: null, bio: null },
			links,
		});
	});
}
