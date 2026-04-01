/**
 * Credits routes for Memoro server.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { validateCredits, consumeCredits, COSTS } from '../lib/credits';
import { getBalance } from '@manacore/shared-hono';
import { validateBody } from '../lib/validate';
import { checkCreditsBody, consumeCreditsBody } from '../schemas';

export const creditRoutes = new Hono<{ Variables: AuthVariables }>();

// GET /pricing — public, returns cost constants
creditRoutes.get('/pricing', (c) => {
	return c.json({ success: true, costs: COSTS });
});

// GET /balance — authenticated, returns user's credit balance
creditRoutes.get('/balance', async (c) => {
	const userId = c.get('userId') as string;
	try {
		const balance = await getBalance(userId);
		return c.json({
			success: true,
			credits: balance.balance,
			totalEarned: balance.totalEarned,
			totalSpent: balance.totalSpent,
		});
	} catch (err) {
		console.error('[credits] Balance error:', err);
		return c.json({ success: false, error: 'Failed to fetch balance' }, 500);
	}
});

// POST /check — validate credits
creditRoutes.post('/check', async (c) => {
	const userId = c.get('userId') as string;
	const v = await validateBody(c, checkCreditsBody);
	if (!v.success) return v.response;

	try {
		const result = await validateCredits(userId, v.data.operation, v.data.amount);
		return c.json({ success: true, ...result });
	} catch (err) {
		console.error('[credits] Validate error:', err);
		return c.json({ success: false, error: 'Failed to validate credits' }, 500);
	}
});

// POST /consume — consume credits
creditRoutes.post('/consume', async (c) => {
	const userId = c.get('userId') as string;
	const v = await validateBody(c, consumeCreditsBody);
	if (!v.success) return v.response;

	try {
		const result = await consumeCredits(
			userId,
			v.data.operation,
			v.data.amount,
			v.data.description,
			v.data.metadata
		);
		return c.json({ success: true, consumed: result });
	} catch (err) {
		console.error('[credits] Consume error:', err);
		return c.json({ success: false, error: 'Failed to consume credits' }, 500);
	}
});
