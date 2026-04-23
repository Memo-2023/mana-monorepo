/**
 * Onboarding routes — per-user completion status for the 3-screen
 * first-login flow (Name → Look → Templates).
 *
 * GET    /         — { completedAt: ISO string | null }
 * POST   /complete — idempotent; sets `onboardingCompletedAt = now()` if null
 * PATCH  /reset    — sets back to null (for "Onboarding erneut durchlaufen")
 *
 * Mounted under `/api/v1/me/onboarding`, so it inherits the same
 * `jwtAuth` middleware as the GDPR `/me/*` routes.
 *
 * Design notes — see docs/plans/onboarding-flow.md §"Data changes":
 * we keep the state on a first-class column (not in `user_settings`
 * JSONB) so a brand-new account reliably returns `null` without having
 * to distinguish "no settings row" from "explicitly null". And we use
 * a dedicated endpoint rather than a JWT claim so finishing the flow
 * takes effect without a token re-mint.
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { AuthUser } from '../middleware/jwt-auth';
import type { Database } from '../db/connection';
import { users } from '../db/schema/auth';

type OnboardingApp = Hono<{ Variables: { user: AuthUser } }>;

export function createOnboardingRoutes(db: Database) {
	const app: OnboardingApp = new Hono();

	app.get('/', async (c) => {
		const user = c.get('user');
		const [row] = await db
			.select({ completedAt: users.onboardingCompletedAt })
			.from(users)
			.where(eq(users.id, user.userId))
			.limit(1);

		if (!row) return c.json({ error: 'User not found' }, 404);
		return c.json({ completedAt: row.completedAt?.toISOString() ?? null });
	});

	app.post('/complete', async (c) => {
		const user = c.get('user');
		const now = new Date();
		const [updated] = await db
			.update(users)
			.set({ onboardingCompletedAt: now, updatedAt: now })
			.where(eq(users.id, user.userId))
			.returning({ completedAt: users.onboardingCompletedAt });

		if (!updated) return c.json({ error: 'User not found' }, 404);
		return c.json({ completedAt: updated.completedAt?.toISOString() ?? null });
	});

	app.patch('/reset', async (c) => {
		const user = c.get('user');
		const [updated] = await db
			.update(users)
			.set({ onboardingCompletedAt: null, updatedAt: new Date() })
			.where(eq(users.id, user.userId))
			.returning({ completedAt: users.onboardingCompletedAt });

		if (!updated) return c.json({ error: 'User not found' }, 404);
		return c.json({ completedAt: null });
	});

	return app;
}
