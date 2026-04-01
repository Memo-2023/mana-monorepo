/**
 * Invite routes for Memoro server.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { acceptInvite, declineInvite, getPendingInvites } from '../services/space';
import { validateBody } from '../lib/validate';
import { inviteActionBody } from '../schemas';

export const inviteRoutes = new Hono<{ Variables: AuthVariables }>();

// GET /pending — list pending invites for current user
inviteRoutes.get('/pending', async (c) => {
	const userId = c.get('userId') as string;
	try {
		const invites = await getPendingInvites(userId);
		return c.json({ success: true, invites });
	} catch (err) {
		console.error('[invites] Get pending error:', err);
		return c.json({ success: false, error: 'Failed to get pending invites' }, 500);
	}
});

// POST /accept — accept an invite
inviteRoutes.post('/accept', async (c) => {
	const userId = c.get('userId') as string;
	const v = await validateBody(c, inviteActionBody);
	if (!v.success) return v.response;

	try {
		await acceptInvite(v.data.inviteId, userId);
		return c.json({ success: true });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('not found') || msg.includes('already processed')) {
			return c.json({ success: false, error: msg }, 404);
		}
		return c.json({ success: false, error: 'Failed to accept invite' }, 500);
	}
});

// POST /decline — decline an invite
inviteRoutes.post('/decline', async (c) => {
	const userId = c.get('userId') as string;
	const v = await validateBody(c, inviteActionBody);
	if (!v.success) return v.response;

	try {
		await declineInvite(v.data.inviteId, userId);
		return c.json({ success: true });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('not found') || msg.includes('already processed')) {
			return c.json({ success: false, error: msg }, 404);
		}
		return c.json({ success: false, error: 'Failed to decline invite' }, 500);
	}
});
