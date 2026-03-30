/**
 * Admin routes — User tier management
 *
 * Protected by JWT auth + admin role check.
 * Only users with role 'admin' can manage tiers.
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '../middleware/jwt-auth';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users } from '../db/schema/auth';

const VALID_TIERS = ['guest', 'public', 'beta', 'alpha', 'founder'] as const;
type AccessTier = (typeof VALID_TIERS)[number];

export function createAdminRoutes(db: PostgresJsDatabase<any>) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// Admin role check middleware
	app.use('*', async (c, next) => {
		const user = c.get('user');
		if (user.role !== 'admin') {
			return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
		}
		await next();
	});

	// ─── Update user's access tier ─────────────────────────────

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

		return c.json({
			success: true,
			user: updated,
		});
	});

	// ─── Get user's current tier ───────────────────────────────

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

	// ─── List all users with their tiers ───────────────────────

	app.get('/users', async (c) => {
		const tier = c.req.query('tier');
		const limit = parseInt(c.req.query('limit') || '50', 10);
		const offset = parseInt(c.req.query('offset') || '0', 10);

		let query = db
			.select({
				id: users.id,
				email: users.email,
				name: users.name,
				role: users.role,
				accessTier: users.accessTier,
				createdAt: users.createdAt,
			})
			.from(users);

		if (tier && VALID_TIERS.includes(tier as AccessTier)) {
			query = query.where(eq(users.accessTier, tier as AccessTier)) as typeof query;
		}

		const result = await query.limit(limit).offset(offset);

		return c.json({ users: result, count: result.length });
	});

	return app;
}
