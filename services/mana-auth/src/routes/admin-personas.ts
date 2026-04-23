/**
 * Admin endpoints for persona lifecycle.
 *
 * Personas are real Mana users with `kind = 'persona'`. They go through
 * the same Better Auth sign-up pipeline as humans (no bypass), then get
 * stamped with kind+tier and a personas-table row. The seed script
 * (scripts/personas/seed.ts) drives this; the same endpoints power any
 * future admin UI.
 *
 * Plan: docs/plans/mana-mcp-and-personas.md (M2.b).
 *
 * Lifecycle:
 *   POST   /api/v1/admin/personas         create-or-update by email (idempotent)
 *   GET    /api/v1/admin/personas         list with action+feedback summary
 *   GET    /api/v1/admin/personas/:id     detail
 *   DELETE /api/v1/admin/personas/:id     hard delete (cascades user → spaces)
 */

import { Hono } from 'hono';
import { and, count, desc, eq, gte } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { AuthUser } from '../middleware/jwt-auth';
import type { BetterAuthInstance } from '../auth/better-auth.config';
import { users } from '../db/schema/auth';
import { personas, personaActions, personaFeedback } from '../db/schema/personas';

interface PersonaUpsertBody {
	email: string;
	name?: string;
	password: string;
	archetype: string;
	systemPrompt: string;
	moduleMix: Record<string, number>;
	tickCadence?: 'daily' | 'weekdays' | 'hourly';
}

const VALID_CADENCES = new Set(['daily', 'weekdays', 'hourly']);

export function createAdminPersonasRoutes(db: PostgresJsDatabase<any>, auth: BetterAuthInstance) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// All routes admin-gated. Mirrors the check in admin.ts so this file
	// is safe to mount under any prefix without losing protection.
	app.use('*', async (c, next) => {
		const principal = c.get('user');
		if (principal.role !== 'admin') {
			return c.json({ error: 'Forbidden', message: 'Admin access required' }, 403);
		}
		await next();
	});

	// ─── POST /api/v1/admin/personas ─ create or update ─────────────

	app.post('/', async (c) => {
		let body: PersonaUpsertBody;
		try {
			body = (await c.req.json()) as PersonaUpsertBody;
		} catch {
			return c.json({ error: 'Invalid JSON body' }, 400);
		}

		const errors: string[] = [];
		if (!body.email || !body.email.includes('@')) errors.push('email required');
		if (!body.password || body.password.length < 8) errors.push('password ≥ 8 chars required');
		if (!body.archetype) errors.push('archetype required');
		if (!body.systemPrompt) errors.push('systemPrompt required');
		if (!body.moduleMix || typeof body.moduleMix !== 'object')
			errors.push('moduleMix object required');
		if (body.tickCadence && !VALID_CADENCES.has(body.tickCadence)) {
			errors.push(`tickCadence must be one of ${[...VALID_CADENCES].join(', ')}`);
		}
		if (errors.length > 0) return c.json({ error: 'ValidationError', details: errors }, 400);

		// Find or create the underlying user. signUpEmail throws on collision —
		// we treat that as "user exists, we'll just upsert metadata".
		let userId: string;
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, body.email));
		if (existing) {
			userId = existing.id;
		} else {
			try {
				const signUp = await auth.api.signUpEmail({
					body: {
						email: body.email,
						password: body.password,
						name: body.name ?? body.email.split('@')[0],
					},
					headers: c.req.raw.headers,
				});
				if (!signUp?.user?.id) {
					return c.json({ error: 'Sign-up returned no user' }, 500);
				}
				userId = signUp.user.id;
			} catch (err) {
				return c.json(
					{
						error: 'Sign-up failed',
						message: err instanceof Error ? err.message : String(err),
					},
					500
				);
			}
		}

		// Stamp the user as a persona with founder tier and verified email
		// (we control this address — no bounce risk, no need for the
		// verification mail flow). updatedAt bumps so caches invalidate.
		await db
			.update(users)
			.set({
				kind: 'persona',
				accessTier: 'founder',
				emailVerified: true,
				updatedAt: new Date(),
			})
			.where(eq(users.id, userId));

		// Upsert the persona descriptor.
		await db
			.insert(personas)
			.values({
				userId,
				archetype: body.archetype,
				systemPrompt: body.systemPrompt,
				moduleMix: body.moduleMix,
				tickCadence: body.tickCadence ?? 'daily',
			})
			.onConflictDoUpdate({
				target: personas.userId,
				set: {
					archetype: body.archetype,
					systemPrompt: body.systemPrompt,
					moduleMix: body.moduleMix,
					tickCadence: body.tickCadence ?? 'daily',
				},
			});

		return c.json({ ok: true, userId, email: body.email });
	});

	// ─── GET /api/v1/admin/personas ─ list ─────────────────────────

	app.get('/', async (c) => {
		const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		const rows = await db
			.select({
				userId: personas.userId,
				email: users.email,
				name: users.name,
				archetype: personas.archetype,
				tickCadence: personas.tickCadence,
				lastActiveAt: personas.lastActiveAt,
				createdAt: personas.createdAt,
			})
			.from(personas)
			.innerJoin(users, eq(users.id, personas.userId))
			.orderBy(desc(personas.createdAt));

		// Per-persona action count for the last 7d. One small grouped query
		// rather than N round-trips.
		const actionCounts = await db
			.select({
				personaId: personaActions.personaId,
				value: count(),
			})
			.from(personaActions)
			.where(gte(personaActions.createdAt, sevenDaysAgo))
			.groupBy(personaActions.personaId);
		const countByPersona = new Map(actionCounts.map((r) => [r.personaId, Number(r.value)]));

		return c.json({
			personas: rows.map((r) => ({
				...r,
				actions7d: countByPersona.get(r.userId) ?? 0,
			})),
		});
	});

	// ─── GET /api/v1/admin/personas/:id ─ detail ───────────────────

	app.get('/:id', async (c) => {
		const userId = c.req.param('id');

		const [row] = await db
			.select({
				userId: personas.userId,
				email: users.email,
				name: users.name,
				archetype: personas.archetype,
				systemPrompt: personas.systemPrompt,
				moduleMix: personas.moduleMix,
				tickCadence: personas.tickCadence,
				lastActiveAt: personas.lastActiveAt,
				createdAt: personas.createdAt,
			})
			.from(personas)
			.innerJoin(users, eq(users.id, personas.userId))
			.where(eq(personas.userId, userId));

		if (!row) return c.json({ error: 'Not found' }, 404);

		// Recent activity: last 20 actions + feedback aggregate per module.
		const recentActions = await db
			.select()
			.from(personaActions)
			.where(eq(personaActions.personaId, userId))
			.orderBy(desc(personaActions.createdAt))
			.limit(20);

		const feedbackAgg = await db
			.select({
				module: personaFeedback.module,
				avgRating: count(),
			})
			.from(personaFeedback)
			.where(eq(personaFeedback.personaId, userId))
			.groupBy(personaFeedback.module);

		return c.json({ persona: row, recentActions, feedbackByModule: feedbackAgg });
	});

	// ─── DELETE /api/v1/admin/personas/:id ─ hard delete ───────────

	app.delete('/:id', async (c) => {
		const userId = c.req.param('id');

		// Safety check — only delete users that are actually personas.
		// Without this, an admin typo could nuke a real account; the
		// FK cascade from users would then take down credits, sync rows,
		// the works.
		const [row] = await db.select({ kind: users.kind }).from(users).where(eq(users.id, userId));
		if (!row) return c.json({ error: 'Not found' }, 404);
		if (row.kind !== 'persona') {
			return c.json(
				{
					error: 'Refusing to delete non-persona user via this endpoint',
					hint: 'Use /api/v1/admin/users/:id/data instead',
				},
				400
			);
		}

		// Cascade: personas → personaActions, personaFeedback (via FK ON DELETE
		// CASCADE), then users → personas (same), then organizations / sync /
		// credits via their own onDelete handling. We only need to delete the
		// user row.
		await db.delete(users).where(and(eq(users.id, userId), eq(users.kind, 'persona')));

		return c.json({ ok: true, deleted: userId });
	});

	return app;
}
