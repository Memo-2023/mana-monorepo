/**
 * Space routes for Memoro server.
 */

import { Hono } from 'hono';
import type { AuthVariables } from '@manacore/shared-hono';
import { createServiceClient } from '../lib/supabase';
import { validateBody, validateQuery } from '../lib/validate';
import { createSpaceBody, linkMemoBody, inviteBody, paginationQuery } from '../schemas';
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

// GET / — list user's spaces (with pagination)
spaceRoutes.get('/', async (c) => {
	const userId = c.get('userId') as string;
	const q = validateQuery(c, paginationQuery);
	if (!q.success) return q.response;
	const { limit, offset } = q.data;

	try {
		const allSpaces = await getSpaces(userId);
		const total = allSpaces.length;
		const spaces = allSpaces.slice(offset, offset + limit);
		return c.json({ success: true, spaces, total, limit, offset });
	} catch (err) {
		console.error('[spaces] Get spaces error:', err);
		return c.json({ success: false, error: 'Failed to get spaces' }, 500);
	}
});

// POST / — create space
spaceRoutes.post('/', async (c) => {
	const userId = c.get('userId') as string;
	const v = await validateBody(c, createSpaceBody);
	if (!v.success) return v.response;
	const { name, description } = v.data;

	try {
		const space = await createSpace(userId, name, description);
		return c.json({ success: true, space }, 201);
	} catch (err) {
		console.error('[spaces] Create error:', err);
		return c.json({ success: false, error: 'Failed to create space' }, 500);
	}
});

// GET /:id — space details
spaceRoutes.get('/:id', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		const space = await getSpaceDetails(spaceId, userId);
		return c.json({ success: true, space });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Access denied') || msg.includes('not a member')) {
			return c.json({ success: false, error: msg }, 403);
		}
		if (msg.includes('not found')) return c.json({ success: false, error: msg }, 404);
		return c.json({ success: false, error: 'Failed to get space details' }, 500);
	}
});

// DELETE /:id — delete space (owner only)
spaceRoutes.delete('/:id', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		await deleteSpace(spaceId, userId);
		return c.json({ success: true });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('owner')) return c.json({ success: false, error: msg }, 403);
		if (msg.includes('not found')) return c.json({ success: false, error: msg }, 404);
		return c.json({ success: false, error: 'Failed to delete space' }, 500);
	}
});

// POST /:id/leave — leave space (non-owner)
spaceRoutes.post('/:id/leave', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		await leaveSpace(spaceId, userId);
		return c.json({ success: true });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('not a member')) return c.json({ success: false, error: msg }, 403);
		if (msg.includes('owner')) return c.json({ success: false, error: msg }, 400);
		return c.json({ success: false, error: 'Failed to leave space' }, 500);
	}
});

// POST /:id/memos/link — link memo to space
spaceRoutes.post('/:id/memos/link', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');
	const v = await validateBody(c, linkMemoBody);
	if (!v.success) return v.response;

	try {
		await linkMemoToSpace(v.data.memoId, spaceId, userId);
		return c.json({ success: true });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('access denied') || msg.includes('Not a member')) {
			return c.json({ success: false, error: msg }, 403);
		}
		if (msg.includes('not found')) return c.json({ success: false, error: msg }, 404);
		return c.json({ success: false, error: 'Failed to link memo to space' }, 500);
	}
});

// POST /:id/memos/unlink — unlink memo from space
spaceRoutes.post('/:id/memos/unlink', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');
	const v = await validateBody(c, linkMemoBody);
	if (!v.success) return v.response;

	try {
		await unlinkMemoFromSpace(v.data.memoId, spaceId, userId);
		return c.json({ success: true });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('access denied')) return c.json({ success: false, error: msg }, 403);
		if (msg.includes('not found')) return c.json({ success: false, error: msg }, 404);
		return c.json({ success: false, error: 'Failed to unlink memo from space' }, 500);
	}
});

// GET /:id/memos — list space memos (with pagination)
spaceRoutes.get('/:id/memos', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');
	const q = validateQuery(c, paginationQuery);
	if (!q.success) return q.response;
	const { limit, offset } = q.data;

	try {
		const result = await getSpaceMemos(spaceId, userId);
		const allMemos = result.memos ?? result;
		const memos = Array.isArray(allMemos) ? allMemos : [];
		const total = memos.length;
		const paginated = memos.slice(offset, offset + limit);
		return c.json({ success: true, memos: paginated, total, limit, offset });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Not a member')) return c.json({ success: false, error: msg }, 403);
		return c.json({ success: false, error: 'Failed to get space memos' }, 500);
	}
});

// GET /:id/invites — list space invites
spaceRoutes.get('/:id/invites', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');

	try {
		const invites = await getSpaceInvites(spaceId, userId);
		return c.json({ success: true, invites });
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Not a member')) return c.json({ success: false, error: msg }, 403);
		return c.json({ success: false, error: 'Failed to get invites' }, 500);
	}
});

// POST /:id/invite — send invite
spaceRoutes.post('/:id/invite', async (c) => {
	const userId = c.get('userId') as string;
	const spaceId = c.req.param('id');
	const v = await validateBody(c, inviteBody);
	if (!v.success) return v.response;

	try {
		const invite = await createInvite(spaceId, userId, v.data.email);
		return c.json({ success: true, invite }, 201);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		if (msg.includes('Not a member')) return c.json({ success: false, error: msg }, 403);
		return c.json({ success: false, error: 'Failed to create invite' }, 500);
	}
});

// POST /invites/:inviteId/resend — resend invite
spaceRoutes.post('/invites/:inviteId/resend', async (c) => {
	const inviteId = c.req.param('inviteId');
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

	if (error || !invite) return c.json({ success: false, error: 'Invite not found' }, 404);

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
		return c.json({ success: false, error: 'Not authorized to cancel this invite' }, 403);
	}

	const { error: deleteError } = await supabase.from('space_invites').delete().eq('id', inviteId);

	if (deleteError) return c.json({ success: false, error: 'Failed to cancel invite' }, 500);
	return c.json({ success: true });
});
