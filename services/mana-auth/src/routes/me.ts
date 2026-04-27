/**
 * Me routes — GDPR self-service data management
 *
 * GET  /data        — Full user data summary (auth, credits, projects)
 * GET  /data/export — Download all data as JSON
 * DELETE /data      — Delete all user data (right to be forgotten)
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '../middleware/jwt-auth';
import type { UserDataService } from '../services/user-data';
import type { Database } from '../db/connection';
import { users } from '../db/schema/auth';
import { sendAccountDeletionEmail } from '../email/send';

export function createMeRoutes(userDataService: UserDataService, db: Database) {
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

			// ─── Update profile (name, avatar) ──────────────────────
			// Minimal patch endpoint used by the onboarding flow and
			// Settings → Profile. JWT-based like the rest of /me/*; the
			// updated name only lands in the user's JWT on next mint, so
			// the caller is responsible for refreshing its in-memory
			// representation of authStore.user. See docs/plans/onboarding-flow.md.
			.patch('/profile', async (c) => {
				const user = c.get('user');
				const body = (await c.req.json().catch(() => ({}))) as {
					name?: unknown;
					image?: unknown;
					communityShowRealName?: unknown;
				};

				const patch: {
					name?: string;
					image?: string;
					communityShowRealName?: boolean;
					updatedAt: Date;
				} = {
					updatedAt: new Date(),
				};
				if (typeof body.name === 'string') {
					const trimmed = body.name.trim();
					if (trimmed.length < 1 || trimmed.length > 80) {
						return c.json({ error: 'name must be 1–80 characters' }, 400);
					}
					patch.name = trimmed;
				}
				if (typeof body.image === 'string') {
					patch.image = body.image;
				}
				if (typeof body.communityShowRealName === 'boolean') {
					patch.communityShowRealName = body.communityShowRealName;
				}

				if (!('name' in patch) && !('image' in patch) && !('communityShowRealName' in patch)) {
					return c.json({ error: 'no fields to update' }, 400);
				}

				const [updated] = await db
					.update(users)
					.set(patch)
					.where(eq(users.id, user.userId))
					.returning({
						id: users.id,
						name: users.name,
						image: users.image,
						communityShowRealName: users.communityShowRealName,
					});

				if (!updated) return c.json({ error: 'User not found' }, 404);
				return c.json({
					name: updated.name,
					image: updated.image,
					communityShowRealName: updated.communityShowRealName,
				});
			})
	);
}
