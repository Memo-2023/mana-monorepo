/**
 * Credits routes for Memoro server.
 */

import { Hono } from 'hono';
import { validateCredits, consumeCredits, COSTS } from '../lib/credits';
import { getBalance } from '@manacore/shared-hono';

export const creditRoutes = new Hono();

// GET /pricing — public, returns cost constants
creditRoutes.get('/pricing', (c) => {
	return c.json({ costs: COSTS });
});

// GET /balance — authenticated, returns user's credit balance
creditRoutes.get('/balance', async (c) => {
	const userId = c.get('userId') as string;
	try {
		const balance = await getBalance(userId);
		return c.json({ credits: balance.balance, totalEarned: balance.totalEarned, totalSpent: balance.totalSpent });
	} catch (err) {
		console.error('[credits] Balance error:', err);
		return c.json({ error: 'Failed to fetch balance' }, 500);
	}
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
