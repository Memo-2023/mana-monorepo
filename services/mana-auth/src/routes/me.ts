/**
 * Me routes — GDPR self-service data management
 */

import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import type { AuthUser } from '../middleware/jwt-auth';
import type { Database } from '../db/connection';
import { sendAccountDeletionEmail } from '../email/send';

export function createMeRoutes(db: Database) {
	return new Hono<{ Variables: { user: AuthUser } }>()
		.get('/data', async (c) => {
			const user = c.get('user');
			// Return basic user data summary
			const result = await db.execute(
				sql`SELECT id, email, name, role, created_at FROM auth.users WHERE id = ${user.userId}`
			);
			return c.json({ user: (result as any)[0] || null });
		})
		.get('/data/export', async (c) => {
			const user = c.get('user');
			const [userData] = (await db.execute(
				sql`SELECT * FROM auth.users WHERE id = ${user.userId}`
			)) as any[];
			const sessions = await db.execute(
				sql`SELECT id, created_at, expires_at, ip_address FROM auth.sessions WHERE user_id = ${user.userId}`
			);
			const securityEvents = await db.execute(
				sql`SELECT event_type, ip_address, created_at FROM auth.security_events WHERE user_id = ${user.userId} ORDER BY created_at DESC LIMIT 100`
			);

			return c.json({
				exportedAt: new Date().toISOString(),
				exportVersion: '1.0',
				user: userData,
				sessions,
				securityEvents,
			});
		})
		.delete('/data', async (c) => {
			const user = c.get('user');
			// Delete user (cascades via FK)
			await db.execute(sql`DELETE FROM auth.users WHERE id = ${user.userId}`);
			// Send confirmation email
			sendAccountDeletionEmail(user.email).catch(() => {});
			return c.json({ success: true, message: 'Account and all data deleted' });
		});
}
