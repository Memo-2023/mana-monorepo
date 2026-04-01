/**
 * Admin routes — User management, tier management, user data access
 *
 * Protected by JWT auth + admin role check.
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '../middleware/jwt-auth';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users } from '../db/schema/auth';
import type { UserDataService } from '../services/user-data';

const VALID_TIERS = ['guest', 'public', 'beta', 'alpha', 'founder'] as const;
type AccessTier = (typeof VALID_TIERS)[number];

export function createAdminRoutes(db: PostgresJsDatabase<any>, userDataService: UserDataService) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// Admin role check middleware
	app.use('*', async (c, next) => {
		const user = c.get('user');
		if (user.role !== 'admin') {
			return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
		}
		await next();
	});

	// ─── List users with pagination and search ────────────────

	app.get('/users', async (c) => {
		const page = parseInt(c.req.query('page') || '1', 10);
		const limit = parseInt(c.req.query('limit') || '20', 10);
		const search = c.req.query('search');
		const tier = c.req.query('tier');

		// If tier-only query (legacy), use simple response
		if (tier && !search && !c.req.query('page')) {
			if (!VALID_TIERS.includes(tier as AccessTier)) {
				return c.json({ error: 'Invalid tier' }, 400);
			}
			const result = await db
				.select({
					id: users.id,
					email: users.email,
					name: users.name,
					role: users.role,
					accessTier: users.accessTier,
					createdAt: users.createdAt,
				})
				.from(users)
				.where(eq(users.accessTier, tier as AccessTier))
				.limit(limit);

			return c.json({ users: result, count: result.length });
		}

		// Full paginated list with search
		const result = await userDataService.listUsers(page, limit, search || undefined);
		return c.json(result);
	});

	// ─── Get user data summary (aggregated) ───────────────────

	app.get('/users/:userId/data', async (c) => {
		const { userId } = c.req.param();
		const summary = await userDataService.getUserDataSummary(userId);

		if (!summary) {
			return c.json({ error: 'Not found', message: 'User not found' }, 404);
		}

		return c.json(summary);
	});

	// ─── Delete user data ─────────────────────────────────────

	app.delete('/users/:userId/data', async (c) => {
		const { userId } = c.req.param();

		// Get user email first for confirmation
		const [user] = await db
			.select({ email: users.email })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return c.json({ error: 'Not found', message: 'User not found' }, 404);
		}

		const result = await userDataService.deleteUserData(userId, user.email);
		return c.json(result);
	});

	// ─── Update user's access tier ────────────────────────────

	app.put('/users/:userId/tier', async (c) => {
		const { userId } = c.req.param();
		const body = await c.req.json();
		const { tier } = body as { tier: string };

		if (!tier || !VALID_TIERS.includes(tier as AccessTier)) {
			return c.json(
				{
					error: 'Invalid tier',
					message: `Tier must be one of: ${VALID_TIERS.join(', ')}`,
				},
				400
			);
		}

		const [updated] = await db
			.update(users)
			.set({ accessTier: tier as AccessTier, updatedAt: new Date() })
			.where(eq(users.id, userId))
			.returning({ id: users.id, email: users.email, accessTier: users.accessTier });

		if (!updated) {
			return c.json({ error: 'Not found', message: 'User not found' }, 404);
		}

		return c.json({ success: true, user: updated });
	});

	// ─── Get user's current tier ──────────────────────────────

	app.get('/users/:userId/tier', async (c) => {
		const { userId } = c.req.param();

		const [user] = await db
			.select({ id: users.id, email: users.email, accessTier: users.accessTier })
			.from(users)
			.where(eq(users.id, userId))
			.limit(1);

		if (!user) {
			return c.json({ error: 'Not found', message: 'User not found' }, 404);
		}

		return c.json(user);
	});

	return app;
}
