/**
 * Credits routes for Memoro server.
 */

import { Hono } from 'hono';
import { validateCredits, consumeCredits, COSTS } from '../lib/credits';

export const creditRoutes = new Hono();

// GET /pricing — public, returns cost constants
creditRoutes.get('/pricing', (c) => {
	return c.json({ costs: COSTS });
});

// POST /check — validate credits (requires auth via parent router)
creditRoutes.post('/check', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{ operation: string; amount: number }>();

	if (!body.operation || body.amount == null) {
		return c.json({ error: 'operation and amount are required' }, 400);
	}

	try {
		const result = await validateCredits(userId, body.operation, body.amount);
		return c.json(result);
	} catch (err) {
		console.error('[credits] Validate error:', err);
		return c.json({ error: 'Failed to validate credits' }, 500);
	}
});

// POST /consume — consume credits (requires auth via parent router)
creditRoutes.post('/consume', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{
		operation: string;
		amount: number;
		description: string;
		metadata?: Record<string, unknown>;
	}>();

	if (!body.operation || body.amount == null || !body.description) {
		return c.json({ error: 'operation, amount, and description are required' }, 400);
	}

	try {
		const success = await consumeCredits(
			userId,
			body.operation,
			body.amount,
			body.description,
			body.metadata
		);
		return c.json({ success });
	} catch (err) {
		console.error('[credits] Consume error:', err);
		return c.json({ error: 'Failed to consume credits' }, 500);
	}
});
