/**
 * Invite routes for Memoro server.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { acceptInvite, declineInvite, getPendingInvites } from '../services/space';

export const inviteRoutes = new Hono<{ Variables: AuthVariables }>();

// GET /pending — list pending invites for current user
inviteRoutes.get('/pending', async (c) => {
	const userId = c.get('userId') as string;
	try {
		const invites = await getPendingInvites(userId);
		return c.json({ invites });
	} catch (err) {
		console.error('[invites] Get pending error:', err);
		return c.json({ error: 'Failed to get pending invites' }, 500);
	}
});

// POST /accept — accept an invite
inviteRoutes.post('/accept', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{ inviteId: string }>();

	if (!body.inviteId) return c.json({ error: 'inviteId is required' }, 400);

	try {
		const result = await acceptInvite(body.inviteId, userId);
		return c.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('not found') || msg.includes('already processed')) {
			return c.json({ error: msg }, 404);
		}
		return c.json({ error: 'Failed to accept invite' }, 500);
	}
});

// POST /decline — decline an invite
inviteRoutes.post('/decline', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{ inviteId: string }>();

	if (!body.inviteId) return c.json({ error: 'inviteId is required' }, 400);

	try {
		const result = await declineInvite(body.inviteId, userId);
		return c.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('not found') || msg.includes('already processed')) {
			return c.json({ error: msg }, 404);
		}
		return c.json({ error: 'Failed to decline invite' }, 500);
	}
});
