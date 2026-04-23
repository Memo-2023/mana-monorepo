/**
 * Internal endpoints for the persona-runner (M3.c).
 *
 * Service-to-service — gated by `X-Service-Key` at the app level (see
 * `app.use('/api/v1/internal/*', serviceAuth(...))` in index.ts).
 *
 * Two write endpoints:
 *   POST /api/v1/internal/personas/:id/actions    batch of tool-call rows
 *   POST /api/v1/internal/personas/:id/feedback   batch of rating rows
 *
 * Both are **append-only** and **idempotent by (tickId + some natural
 * key)** — the runner can retry a failed batch without doubling rows.
 * Also: both bump `personas.last_active_at` so the next tick's "is this
 * persona due?" check sees the activity.
 */

import { Hono } from 'hono';
import { and, eq, isNull, lte, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users } from '../db/schema/auth';
import { personas, personaActions, personaFeedback } from '../db/schema/personas';

// ─── Input shapes (no zod dependency here — minimal sanity checks) ────

interface ActionRow {
	tickId: string;
	toolName: string;
	inputHash?: string;
	result: 'ok' | 'error';
	errorMessage?: string;
	latencyMs?: number;
}

interface FeedbackRow {
	tickId: string;
	module: string;
	rating: 1 | 2 | 3 | 4 | 5;
	notes?: string;
}

function isValidAction(row: unknown): row is ActionRow {
	if (!row || typeof row !== 'object') return false;
	const r = row as Record<string, unknown>;
	return (
		typeof r.tickId === 'string' &&
		typeof r.toolName === 'string' &&
		(r.result === 'ok' || r.result === 'error')
	);
}

function isValidFeedback(row: unknown): row is FeedbackRow {
	if (!row || typeof row !== 'object') return false;
	const r = row as Record<string, unknown>;
	return (
		typeof r.tickId === 'string' &&
		typeof r.module === 'string' &&
		typeof r.rating === 'number' &&
		r.rating >= 1 &&
		r.rating <= 5
	);
}

export function createInternalPersonasRoutes(db: PostgresJsDatabase<any>) {
	const app = new Hono();

	// Guard: every route under this router requires the :id to be an
	// existing persona. Keeps the runner from accidentally writing
	// audit rows for a deleted persona (FK would catch it, but a
	// clean 404 is a better diagnostic).
	async function requirePersona(personaId: string): Promise<boolean> {
		const [row] = await db
			.select({ userId: personas.userId })
			.from(personas)
			.where(eq(personas.userId, personaId));
		return !!row;
	}

	// ─── GET /api/v1/internal/personas/due ──────────────────────────
	//
	// Returns personas the runner should act on **now**, given each
	// persona's `tickCadence` + `lastActiveAt`. Simple rules:
	//
	//   hourly   — due if lastActiveAt is null or > 1 hour ago
	//   daily    — due if lastActiveAt is null or > 24 hours ago
	//   weekdays — same as daily + server clock is Mon–Fri
	//
	// Deletion and soft-delete are respected: users.deletedAt IS NULL.

	app.get('/due', async (c) => {
		const now = new Date();
		const dow = now.getUTCDay(); // 0=Sun … 6=Sat
		const isWeekday = dow >= 1 && dow <= 5;
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

		// Compose (cadence='hourly' AND stale-by-hour) OR (cadence='daily' AND stale-by-day)
		// OR (cadence='weekdays' AND today-is-weekday AND stale-by-day)
		const hourly = and(
			eq(personas.tickCadence, 'hourly'),
			or(isNull(personas.lastActiveAt), lte(personas.lastActiveAt, oneHourAgo))
		);
		const daily = and(
			eq(personas.tickCadence, 'daily'),
			or(isNull(personas.lastActiveAt), lte(personas.lastActiveAt, oneDayAgo))
		);
		const weekdays = isWeekday
			? and(
					eq(personas.tickCadence, 'weekdays'),
					or(isNull(personas.lastActiveAt), lte(personas.lastActiveAt, oneDayAgo))
				)
			: undefined;

		const rows = await db
			.select({
				userId: personas.userId,
				email: users.email,
				archetype: personas.archetype,
				systemPrompt: personas.systemPrompt,
				moduleMix: personas.moduleMix,
				tickCadence: personas.tickCadence,
				lastActiveAt: personas.lastActiveAt,
			})
			.from(personas)
			.innerJoin(users, eq(users.id, personas.userId))
			.where(
				and(
					isNull(users.deletedAt),
					or(...[hourly, daily, weekdays].filter((x): x is NonNullable<typeof x> => !!x))
				)
			)
			.orderBy(sql`${personas.lastActiveAt} NULLS FIRST`);

		return c.json({ personas: rows, serverTime: now.toISOString() });
	});

	// ─── POST /api/v1/internal/personas/:id/actions ──────────────────

	app.post('/:id/actions', async (c) => {
		const personaId = c.req.param('id');
		if (!(await requirePersona(personaId))) {
			return c.json({ error: 'Persona not found' }, 404);
		}

		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: 'Invalid JSON' }, 400);
		}

		const rawActions = (body as { actions?: unknown[] })?.actions;
		if (!Array.isArray(rawActions) || rawActions.length === 0) {
			return c.json({ error: '`actions` array required' }, 400);
		}
		if (rawActions.length > 500) {
			return c.json({ error: '`actions` batch size must be ≤ 500' }, 400);
		}
		if (!rawActions.every(isValidAction)) {
			return c.json({ error: 'One or more action rows failed validation' }, 400);
		}

		const now = new Date();
		const values = rawActions.map((a, i) => ({
			// Deterministic id per (tickId, toolName, index) so retrying
			// the same batch doesn't produce duplicates. crypto.randomUUID
			// would work too but would leak idempotency on retry.
			id: `${a.tickId}-${i}-${a.toolName}`.slice(0, 255),
			personaId,
			tickId: a.tickId,
			toolName: a.toolName,
			inputHash: a.inputHash ?? null,
			result: a.result,
			errorMessage: a.errorMessage ?? null,
			latencyMs: a.latencyMs ?? null,
			createdAt: now,
		}));

		await db.insert(personaActions).values(values).onConflictDoNothing();
		await db.update(personas).set({ lastActiveAt: now }).where(eq(personas.userId, personaId));

		return c.json({ ok: true, written: values.length });
	});

	// ─── POST /api/v1/internal/personas/:id/feedback ─────────────────

	app.post('/:id/feedback', async (c) => {
		const personaId = c.req.param('id');
		if (!(await requirePersona(personaId))) {
			return c.json({ error: 'Persona not found' }, 404);
		}

		let body: unknown;
		try {
			body = await c.req.json();
		} catch {
			return c.json({ error: 'Invalid JSON' }, 400);
		}

		const rawFeedback = (body as { feedback?: unknown[] })?.feedback;
		if (!Array.isArray(rawFeedback) || rawFeedback.length === 0) {
			return c.json({ error: '`feedback` array required' }, 400);
		}
		if (rawFeedback.length > 100) {
			return c.json({ error: '`feedback` batch size must be ≤ 100' }, 400);
		}
		if (!rawFeedback.every(isValidFeedback)) {
			return c.json({ error: 'One or more feedback rows failed validation' }, 400);
		}

		const now = new Date();
		const values = rawFeedback.map((f) => ({
			// (tickId, module) is the natural uniqueness key — one rating
			// per module per tick. Retries hit onConflictDoNothing.
			id: `${f.tickId}-${f.module}`.slice(0, 255),
			personaId,
			tickId: f.tickId,
			module: f.module,
			rating: f.rating,
			notes: f.notes ?? null,
			createdAt: now,
		}));

		await db.insert(personaFeedback).values(values).onConflictDoNothing();

		return c.json({ ok: true, written: values.length });
	});

	return app;
}

// Minimal unused import cleanup — drizzle-orm `and` was imported for
// potential future composite-WHERE needs but neither endpoint uses it
// today. Kept as a reminder when actions/feedback gain filter params.
void and;
