/**
 * Admin routes — User management, tier management, user data access
 *
 * Protected by JWT auth + admin role check.
 */

import { Hono } from 'hono';
import { and, count, countDistinct, eq, gte, isNull } from 'drizzle-orm';
import type { AuthUser } from '../middleware/jwt-auth';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users, sessions } from '../db/schema/auth';
import { loginAttempts } from '../db/schema/login-attempts';
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

	// ─── Aggregate stats for the admin dashboard ──────────────
	//
	// Replaces hardcoded mock data in apps/mana/apps/web/src/routes/
	// (app)/admin/+page.svelte. All seven values come from auth.users,
	// auth.sessions and auth.login_attempts — no other service is
	// involved, which keeps this endpoint a pure single-DB read.

	app.get('/stats', async (c) => {
		const now = new Date();
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

		// One query per stat — Postgres handles them in parallel via
		// the connection pool when wrapped in Promise.all. Each one is
		// a single indexed count, so total latency is dominated by
		// round-trip not query work.
		const [
			[{ value: totalUsers }],
			[{ value: newUsers7d }],
			[{ value: newUsers30d }],
			[{ value: activeSessions }],
			[{ value: uniqueUsers24h }],
			[{ value: loginSuccess7d }],
			[{ value: loginFailed7d }],
		] = await Promise.all([
			db.select({ value: count() }).from(users).where(isNull(users.deletedAt)),
			db
				.select({ value: count() })
				.from(users)
				.where(and(isNull(users.deletedAt), gte(users.createdAt, sevenDaysAgo))),
			db
				.select({ value: count() })
				.from(users)
				.where(and(isNull(users.deletedAt), gte(users.createdAt, thirtyDaysAgo))),
			db
				.select({ value: count() })
				.from(sessions)
				.where(and(gte(sessions.expiresAt, now), isNull(sessions.revokedAt))),
			db
				.select({ value: countDistinct(sessions.userId) })
				.from(sessions)
				.where(and(isNull(sessions.revokedAt), gte(sessions.lastActivityAt, twentyFourHoursAgo))),
			db
				.select({ value: count() })
				.from(loginAttempts)
				.where(
					and(eq(loginAttempts.successful, true), gte(loginAttempts.attemptedAt, sevenDaysAgo))
				),
			db
				.select({ value: count() })
				.from(loginAttempts)
				.where(
					and(eq(loginAttempts.successful, false), gte(loginAttempts.attemptedAt, sevenDaysAgo))
				),
		]);

		return c.json({
			totalUsers,
			newUsers7d,
			newUsers30d,
			activeSessions,
			uniqueUsers24h,
			loginSuccess7d,
			loginFailed7d,
			generatedAt: now.toISOString(),
		});
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
