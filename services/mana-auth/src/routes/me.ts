/**
 * Me routes — GDPR self-service data management
 *
 * GET  /data        — Full user data summary (auth, credits, projects)
 * GET  /data/export — Download all data as JSON
 * DELETE /data      — Delete all user data (right to be forgotten)
 */

import { Hono } from 'hono';
import type { AuthUser } from '../middleware/jwt-auth';
import type { UserDataService } from '../services/user-data';
import { sendAccountDeletionEmail } from '../email/send';

export function createMeRoutes(userDataService: UserDataService) {
	return (
		new Hono<{ Variables: { user: AuthUser } }>()

			// ─── Get full user data summary ─────────────────────────
			.get('/data', async (c) => {
				const user = c.get('user');
				const summary = await userDataService.getUserDataSummary(user.userId);

				if (!summary) {
					return c.json({ error: 'User not found' }, 404);
				}

				return c.json(summary);
			})

			// ─── Export user data as JSON download ──────────────────
			.get('/data/export', async (c) => {
				const user = c.get('user');
				const exportData = await userDataService.exportUserData(user.userId);

				if (!exportData) {
					return c.json({ error: 'User not found' }, 404);
				}

				const filename = `meine-daten-${new Date().toISOString().split('T')[0]}.json`;
				const json = JSON.stringify(exportData, null, 2);

				return new Response(json, {
					headers: {
						'Content-Type': 'application/json',
						'Content-Disposition': `attachment; filename="${filename}"`,
					},
				});
			})

			// ─── Delete all user data ───────────────────────────────
			.delete('/data', async (c) => {
				const user = c.get('user');
				const result = await userDataService.deleteUserData(user.userId, user.email);

				// Send confirmation email (fire-and-forget)
				sendAccountDeletionEmail(user.email).catch(() => {});

				return c.json(result);
			})
	);
}
