/**
 * Space routes for Memoro server.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { createServiceClient } from '../lib/supabase';
import {
	getSpaces,
	createSpace,
	getSpaceDetails,
	deleteSpace,
	leaveSpace,
	linkMemoToSpace,
	unlinkMemoFromSpace,
	getSpaceMemos,
	getSpaceInvites,
	createInvite,
} from '../services/space';

export const spaceRoutes = new Hono<{ Variables: AuthVariables }>();

// GET / — list user's spaces
spaceRoutes.get('/', async (c) => {
	const userId = c.get('userId') as string;
	try {
		const spaces = await getSpaces(userId);
		return c.json({ spaces });
	} catch (err) {
		console.error('[spaces] Get spaces error:', err);
		return c.json({ error: 'Failed to get spaces' }, 500);
	}
});

// POST / — create space
spaceRoutes.post('/', async (c) => {
	const userId = c.get('userId') as string;
	const body = await c.req.json<{ name: string; description?: string }>();

	if (!body.name?.trim()) return c.json({ error: 'name is required' }, 400);

	try {
		const space = await createSpace(userId, body.name, body.description);
		return c.json({ space }, 201);
	} catch (err) {
		console.error('[spaces] Create error:', err);
		return c.json({ error: 'Failed to create space' }, 500);
	}
});

// GET /:id — space details
spaceRoutes.get('/:id', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		const space = await getSpaceDetails(spaceId, userId);
		return c.json({ space });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Access denied') || msg.includes('not a member')) {
			return c.json({ error: msg }, 403);
		}
		if (msg.includes('not found')) return c.json({ error: msg }, 404);
		return c.json({ error: 'Failed to get space details' }, 500);
	}
});

// DELETE /:id — delete space (owner only)
spaceRoutes.delete('/:id', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		const result = await deleteSpace(spaceId, userId);
		return c.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('owner')) return c.json({ error: msg }, 403);
		if (msg.includes('not found')) return c.json({ error: msg }, 404);
		return c.json({ error: 'Failed to delete space' }, 500);
	}
});

// POST /:id/leave — leave space (non-owner)
spaceRoutes.post('/:id/leave', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		const result = await leaveSpace(spaceId, userId);
		return c.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('not a member')) return c.json({ error: msg }, 403);
		if (msg.includes('owner')) return c.json({ error: msg }, 400);
		return c.json({ error: 'Failed to leave space' }, 500);
	}
});

// POST /:id/memos/link — link memo to space
spaceRoutes.post('/:id/memos/link', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');
	const body = await c.req.json<{ memoId: string }>();

	if (!body.memoId) return c.json({ error: 'memoId is required' }, 400);

	try {
		const result = await linkMemoToSpace(body.memoId, spaceId, userId);
		return c.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('access denied') || msg.includes('Not a member')) {
			return c.json({ error: msg }, 403);
		}
		if (msg.includes('not found')) return c.json({ error: msg }, 404);
		return c.json({ error: 'Failed to link memo to space' }, 500);
	}
});

// POST /:id/memos/unlink — unlink memo from space
spaceRoutes.post('/:id/memos/unlink', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');
	const body = await c.req.json<{ memoId: string }>();

	if (!body.memoId) return c.json({ error: 'memoId is required' }, 400);

	try {
		const result = await unlinkMemoFromSpace(body.memoId, spaceId, userId);
		return c.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('access denied')) return c.json({ error: msg }, 403);
		if (msg.includes('not found')) return c.json({ error: msg }, 404);
		return c.json({ error: 'Failed to unlink memo from space' }, 500);
	}
});

// GET /:id/memos — list space memos
spaceRoutes.get('/:id/memos', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		const result = await getSpaceMemos(spaceId, userId);
		return c.json(result);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Not a member')) return c.json({ error: msg }, 403);
		return c.json({ error: 'Failed to get space memos' }, 500);
	}
});

// GET /:id/invites — list space invites
spaceRoutes.get('/:id/invites', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		const invites = await getSpaceInvites(spaceId, userId);
		return c.json({ invites });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Not a member')) return c.json({ error: msg }, 403);
		return c.json({ error: 'Failed to get invites' }, 500);
	}
});

// POST /:id/invite — send invite
spaceRoutes.post('/:id/invite', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');
	const body = await c.req.json<{ email: string }>();

	if (!body.email?.trim()) return c.json({ error: 'email is required' }, 400);

	try {
		const invite = await createInvite(spaceId, userId, body.email);
		return c.json({ invite }, 201);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Not a member')) return c.json({ error: msg }, 403);
		return c.json({ error: 'Failed to create invite' }, 500);
	}
});

// POST /invites/:inviteId/resend — resend invite
spaceRoutes.post('/invites/:inviteId/resend', async (c) => {
	const inviteId = c.req.param('inviteId');
	// In a full implementation, this would resend the invite email via mana-notify
	// For now, return success as the invite record already exists
	console.log(`[spaces] Resend invite ${inviteId} (email notification not implemented here)`);
	return c.json({ success: true, inviteId });
});

// DELETE /invites/:inviteId — cancel invite
spaceRoutes.delete('/invites/:inviteId', async (c) => {
	const userId = c.get('userId') as string;
	const inviteId = c.req.param('inviteId');
	const supabase = createServiceClient();

	// Verify inviter owns this invite
	const { data: invite, error } = await supabase
		.from('space_invites')
		.select('id, inviter_id, space_id')
		.eq('id', inviteId)
		.single();

	if (error || !invite) return c.json({ error: 'Invite not found' }, 404);

	const inv = invite as { inviter_id: string; space_id: string };

	// Allow invite owner or space owner to cancel
	const { data: spaceMember } = await supabase
		.from('space_members')
		.select('role')
		.eq('space_id', inv.space_id)
		.eq('user_id', userId)
		.single();

	const isOwner = (spaceMember as { role: string } | null)?.role === 'owner';

	if (inv.inviter_id !== userId && !isOwner) {
		return c.json({ error: 'Not authorized to cancel this invite' }, 403);
	}

	const { error: deleteError } = await supabase
		.from('space_invites')
		.delete()
		.eq('id', inviteId);

	if (deleteError) return c.json({ error: 'Failed to cancel invite' }, 500);
	return c.json({ success: true });
});
