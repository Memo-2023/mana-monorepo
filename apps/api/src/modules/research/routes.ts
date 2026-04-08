/**
 * Research module — HTTP routes.
 *
 *   POST /api/v1/research/start         — fire-and-forget, returns
 *                                         { researchResultId } immediately.
 *                                         The pipeline runs in the
 *                                         background and emits progress
 *                                         events via the in-process pubsub.
 *   GET  /api/v1/research/:id/stream    — SSE for live progress. Sends an
 *                                         initial `snapshot` event with the
 *                                         current DB state, then forwards
 *                                         pubsub events until `done`/`error`.
 *   POST /api/v1/research/start-sync    — synchronous variant, blocks
 *                                         until the pipeline finishes.
 *                                         Kept for end-to-end testing.
 *   GET  /api/v1/research/:id           — fetch a research_results row.
 *   GET  /api/v1/research/:id/sources   — fetch all sources for a run.
 */

import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { z } from 'zod';
import { and, asc, eq } from 'drizzle-orm';
import { db, researchResults, sources } from './schema';
import { runPipeline, type ProgressEvent } from './orchestrator';
import { publish, subscribe, closeChannel } from './pubsub';
import { errorResponse, listResponse, validationError } from '../../lib/responses';
import type { AuthVariables } from '@mana/shared-hono';
import { validateCredits, consumeCredits } from '@mana/shared-hono/credits';
import type { ResearchDepth } from './schema';

const routes = new Hono<{ Variables: AuthVariables }>();

const StartSchema = z.object({
	questionId: z.string().min(1).max(200),
	title: z.string().min(3).max(500),
	description: z.string().max(4000).optional(),
	depth: z.enum(['quick', 'standard', 'deep']),
});

/**
 * Credit cost per research depth. Loosely calibrated against the chat
 * module: a single local Ollama call costs 0.1 credits there, so a
 * `quick` run (one search + one synthesis pass on Ollama) at 1 credit is
 * roughly 10× a single chat completion. `deep` is 15× because it does
 * 6 sub-queries × 8 hits + bulk extraction + a long synthesis pass.
 */
const RESEARCH_COST: Record<ResearchDepth, number> = {
	quick: 1,
	standard: 5,
	deep: 15,
};

const RESEARCH_OPERATION = 'AI_RESEARCH';

// ─── POST /start ────────────────────────────────────────────
// Fire-and-forget: returns immediately, pipeline runs in background and
// emits progress through pubsub. Subscribe via GET /:id/stream.

routes.post('/start', async (c) => {
	const userId = c.get('userId');
	const parsed = StartSchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return validationError(c, parsed.error.issues);
	}

	// Reserve credits up-front. We don't deduct yet — credits are consumed
	// only when the pipeline reaches `done`. Failed runs cost nothing,
	// which keeps the UX forgiving for transient errors.
	const cost = RESEARCH_COST[parsed.data.depth];
	const validation = await validateCredits(userId, RESEARCH_OPERATION, cost);
	if (!validation.hasCredits) {
		return errorResponse(c, 'Insufficient credits', 402, {
			code: 'INSUFFICIENT_CREDITS',
			details: {
				required: cost,
				available: validation.availableCredits,
			},
		});
	}

	const [row] = await db
		.insert(researchResults)
		.values({
			userId,
			questionId: parsed.data.questionId,
			depth: parsed.data.depth,
			status: 'planning',
		})
		.returning();

	void runPipelineWithPubsub(row.id, userId, parsed.data);

	return c.json({ researchResultId: row.id, cost }, 202);
});

/**
 * Wraps runPipeline so every event is published to the in-process pubsub,
 * credits are consumed only on success, and the channel is closed once a
 * terminal event has gone out.
 */
async function runPipelineWithPubsub(
	researchResultId: string,
	userId: string,
	input: z.infer<typeof StartSchema>
): Promise<void> {
	let succeeded = false;
	const emit = (event: ProgressEvent) => {
		if (event.type === 'done') succeeded = true;
		publish(researchResultId, event);
	};

	try {
		await runPipeline(
			{
				researchResultId,
				questionTitle: input.title,
				questionDescription: input.description,
				depth: input.depth,
			},
			emit
		);

		// Best-effort consume — log on failure but don't block the user.
		// The DB row is already in `done` state at this point.
		if (succeeded) {
			const cost = RESEARCH_COST[input.depth];
			const ok = await consumeCredits(
				userId,
				RESEARCH_OPERATION,
				cost,
				`Research (${input.depth}): ${input.title.slice(0, 80)}`,
				{ researchResultId, depth: input.depth }
			);
			if (!ok) {
				console.warn(
					`[research:${researchResultId}] consumeCredits failed — pipeline already finished, leaving as-is`
				);
			}
		}
	} finally {
		// Give SSE consumers a tick to flush the terminal event before we
		// drop the channel.
		setTimeout(() => closeChannel(researchResultId), 1000);
	}
}

// ─── GET /:id/stream ────────────────────────────────────────
// SSE: emit current DB snapshot first (so late subscribers don't miss the
// run if they connect after `done`), then forward pubsub events until the
// pipeline reaches a terminal state or the client disconnects.

routes.get('/:id/stream', async (c) => {
	const userId = c.get('userId');
	const id = c.req.param('id');

	const [row] = await db
		.select()
		.from(researchResults)
		.where(and(eq(researchResults.id, id), eq(researchResults.userId, userId)))
		.limit(1);

	if (!row) return errorResponse(c, 'not found', 404, { code: 'NOT_FOUND' });

	return streamSSE(c, async (stream) => {
		let closed = false;
		const queue: ProgressEvent[] = [];
		let resolveNext: (() => void) | null = null;

		const wake = () => {
			if (resolveNext) {
				const r = resolveNext;
				resolveNext = null;
				r();
			}
		};

		const unsubscribe = subscribe(id, (event) => {
			queue.push(event);
			wake();
		});

		stream.onAbort(() => {
			closed = true;
			unsubscribe();
			wake();
		});

		// 1. Initial snapshot — so a client that reconnects mid-run (or
		//    after a finished run) immediately sees state.
		await stream.writeSSE({
			event: 'snapshot',
			data: JSON.stringify(row),
		});

		// If the run is already terminal, just close.
		if (row.status === 'done' || row.status === 'error') {
			unsubscribe();
			return;
		}

		// 2. Drain the live event queue until terminal.
		while (!closed) {
			while (queue.length > 0) {
				const event = queue.shift()!;
				await stream.writeSSE({
					event: event.type,
					data: JSON.stringify(event),
				});
				if (event.type === 'done' || event.type === 'error') {
					closed = true;
					break;
				}
			}
			if (closed) break;
			await new Promise<void>((resolve) => {
				resolveNext = resolve;
			});
		}

		unsubscribe();
	});
});

// ─── POST /start-sync ───────────────────────────────────────
// Synchronous variant, blocks until the pipeline finishes. Useful for
// end-to-end smoke tests against real mana-search + mana-llm.

routes.post('/start-sync', async (c) => {
	const userId = c.get('userId');
	const parsed = StartSchema.safeParse(await c.req.json().catch(() => null));
	if (!parsed.success) {
		return validationError(c, parsed.error.issues);
	}

	const [row] = await db
		.insert(researchResults)
		.values({
			userId,
			questionId: parsed.data.questionId,
			depth: parsed.data.depth,
			status: 'planning',
		})
		.returning();

	await runPipeline({
		researchResultId: row.id,
		questionTitle: parsed.data.title,
		questionDescription: parsed.data.description,
		depth: parsed.data.depth,
	});

	const [finished] = await db
		.select()
		.from(researchResults)
		.where(eq(researchResults.id, row.id))
		.limit(1);

	return c.json(finished);
});

// ─── GET /:id ───────────────────────────────────────────────

routes.get('/:id', async (c) => {
	const userId = c.get('userId');
	const id = c.req.param('id');

	const [row] = await db
		.select()
		.from(researchResults)
		.where(and(eq(researchResults.id, id), eq(researchResults.userId, userId)))
		.limit(1);

	if (!row) return errorResponse(c, 'not found', 404, { code: 'NOT_FOUND' });
	return c.json(row);
});

// ─── GET /:id/sources ───────────────────────────────────────

routes.get('/:id/sources', async (c) => {
	const userId = c.get('userId');
	const id = c.req.param('id');

	// Ownership check via the parent research_results row.
	const [parent] = await db
		.select({ id: researchResults.id })
		.from(researchResults)
		.where(and(eq(researchResults.id, id), eq(researchResults.userId, userId)))
		.limit(1);

	if (!parent) return errorResponse(c, 'not found', 404, { code: 'NOT_FOUND' });

	const rows = await db
		.select()
		.from(sources)
		.where(eq(sources.researchResultId, id))
		.orderBy(asc(sources.rank));

	return listResponse(c, rows);
});

export { routes as researchRoutes };
