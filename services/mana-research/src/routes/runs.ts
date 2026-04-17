/**
 * /v1/runs — user's saved eval runs + per-result rating.
 */

import { Hono } from 'hono';
import { z } from 'zod';
import type { HonoEnv } from '../lib/hono-env';
import { BadRequestError, NotFoundError } from '../lib/errors';
import type { RunStorage } from '../storage/runs';

const rateSchema = z.object({
	rating: z.number().int().min(1).max(5),
	notes: z.string().max(2000).optional(),
});

export function createRunsRoutes(storage: RunStorage) {
	return new Hono<HonoEnv>()
		.get('/', async (c) => {
			const user = c.get('user');
			const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
			const offset = parseInt(c.req.query('offset') || '0', 10);
			const runs = await storage.listRuns(user.userId, limit, offset);
			return c.json({ runs });
		})
		.get('/:id', async (c) => {
			const user = c.get('user');
			const id = c.req.param('id');
			const out = await storage.getRunWithResults(id, user.userId);
			if (!out) throw new NotFoundError('Run not found');
			return c.json(out);
		})
		.post('/:runId/results/:resultId/rate', async (c) => {
			const user = c.get('user');
			const body = rateSchema.parse(await c.req.json());
			const ok = await storage.rateResult(
				c.req.param('resultId'),
				user.userId,
				body.rating,
				body.notes
			);
			if (!ok) throw new BadRequestError('Cannot rate this result');
			return c.json({ success: true });
		});
}
