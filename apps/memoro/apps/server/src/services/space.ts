/**
 * Space management service for Memoro server.
 *
 * All Supabase queries use the service-role client with explicit user_id filters.
 */

import { v4 as uuidv4 } from 'uuid';
import { createServiceClient } from '../lib/supabase';

// ── Spaces ─────────────────────────────────────────────────────────────────────

export async function getSpaces(userId: string): Promise<unknown[]> {
	const supabase = createServiceClient();

	const { data, error } = await supabase
		.from('spaces')
		.select('*, space_members!inner(user_id, role)')
		.eq('space_members.user_id', userId)
		.order('created_at', { ascending: false });

	if (error) throw new Error(`Failed to get spaces: ${error.message}`);
	return data ?? [];
}

export async function createSpace(
	userId: string,
	name: string,
	description?: string
): Promise<unknown> {
	const supabase = createServiceClient();

	if (!name?.trim()) throw new Error('Space name is required');

	const spaceId = uuidv4();

	const { data: space, error: spaceError } = await supabase
		.from('spaces')
		.insert({
			id: spaceId,
			name: name.trim(),
			description: description?.trim() ?? null,
			owner_id: userId,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.select()
		.single();

	if (spaceError || !space) {
		throw new Error(`Failed to create space: ${spaceError?.message ?? 'no data returned'}`);
	}

	// Add owner as member
	const { error: memberError } = await supabase.from('space_members').insert({
		space_id: spaceId,
		user_id: userId,
		role: 'owner',
		joined_at: new Date().toISOString(),
	});

	if (memberError) {
		console.error(`[space] Failed to add owner as member: ${memberError.message}`);
	}

	return space;
}

export async function getSpaceDetails(spaceId: string, userId: string): Promise<unknown> {
	const supabase = createServiceClient();

	// Verify user has access
	const { data: member, error: memberError } = await supabase
		.from('space_members')
		.select('role')
		.eq('space_id', spaceId)
		.eq('user_id', userId)
		.single();

	if (memberError || !member) {
		throw new Error('Access denied: you are not a member of this space');
	}

	const { data: space, error } = await supabase
		.from('spaces')
		.select('*, space_members(user_id, role)')
		.eq('id', spaceId)
		.single();

	if (error || !space) {
		throw new Error(`Space not found: ${error?.message ?? 'no data returned'}`);
	}

	return space;
}

export async function deleteSpace(spaceId: string, userId: string): Promise<{ success: boolean }> {
	const supabase = createServiceClient();

	// Verify ownership
	const { data: space, error: fetchError } = await supabase
		.from('spaces')
		.select('owner_id')
		.eq('id', spaceId)
		.single();

	if (fetchError || !space) throw new Error('Space not found');
	if ((space as { owner_id: string }).owner_id !== userId) {
		throw new Error('Only the space owner can delete this space');
	}

	// Clean up memo_spaces links
	await supabase.from('memo_spaces').delete().eq('space_id', spaceId);

	// Delete space (cascades to space_members, invites)
	const { error } = await supabase.from('spaces').delete().eq('id', spaceId);
	if (error) throw new Error(`Failed to delete space: ${error.message}`);

	return { success: true };
}

export async function leaveSpace(spaceId: string, userId: string): Promise<{ success: boolean }> {
	const supabase = createServiceClient();

	const { data: member, error: memberError } = await supabase
		.from('space_members')
		.select('role')
		.eq('space_id', spaceId)
		.eq('user_id', userId)
		.single();

	if (memberError || !member) throw new Error('You are not a member of this space');

	if ((member as { role: string }).role === 'owner') {
		throw new Error('Space owner cannot leave. Transfer ownership or delete the space.');
	}

	// Remove user's memo links from this space
	const { data: userMemos } = await supabase
		.from('memos')
		.select('id')
		.eq('user_id', userId);

	if (userMemos && userMemos.length > 0) {
		const memoIds = userMemos.map((m: { id: string }) => m.id);
		await supabase.from('memo_spaces').delete().eq('space_id', spaceId).in('memo_id', memoIds);
	}

	const { error } = await supabase
		.from('space_members')
		.delete()
		.eq('space_id', spaceId)
		.eq('user_id', userId);

	if (error) throw new Error(`Failed to leave space: ${error.message}`);
	return { success: true };
}

// ── Memo ↔ Space linking ───────────────────────────────────────────────────────

export async function linkMemoToSpace(
	memoId: string,
	spaceId: string,
	userId: string
): Promise<{ success: boolean; message: string }> {
	const supabase = createServiceClient();

	// Verify memo ownership
	const { data: memo, error: memoError } = await supabase
		.from('memos')
		.select('user_id')
		.eq('id', memoId)
		.eq('user_id', userId)
		.single();

	if (memoError || !memo) throw new Error('Memo not found or access denied');

	// Verify space membership
	const { data: member, error: memberError } = await supabase
		.from('space_members')
		.select('role')
		.eq('space_id', spaceId)
		.eq('user_id', userId)
		.single();

	if (memberError || !member) throw new Error('Not a member of this space');

	// Check for existing link
	const { data: existing } = await supabase
		.from('memo_spaces')
		.select('memo_id')
		.eq('memo_id', memoId)
		.eq('space_id', spaceId)
		.maybeSingle();

	if (existing) return { success: true, message: 'Memo is already linked to this space' };

	const { error } = await supabase.from('memo_spaces').insert({
		memo_id: memoId,
		space_id: spaceId,
		created_at: new Date().toISOString(),
	});

	if (error) throw new Error(`Failed to link memo to space: ${error.message}`);
	return { success: true, message: 'Memo linked to space successfully' };
}

export async function unlinkMemoFromSpace(
	memoId: string,
	spaceId: string,
	userId: string
): Promise<{ success: boolean; message: string }> {
	const supabase = createServiceClient();

	// Verify memo ownership
	const { data: memo, error: memoError } = await supabase
		.from('memos')
		.select('user_id')
		.eq('id', memoId)
		.eq('user_id', userId)
		.single();

	if (memoError || !memo) throw new Error('Memo not found or access denied');

	const { error } = await supabase
		.from('memo_spaces')
		.delete()
		.eq('memo_id', memoId)
		.eq('space_id', spaceId);

	if (error) throw new Error(`Failed to unlink memo from space: ${error.message}`);
	return { success: true, message: 'Memo unlinked from space successfully' };
}

export async function getSpaceMemos(spaceId: string, userId: string): Promise<{ memos: unknown[] }> {
	const supabase = createServiceClient();

	// Verify membership
	const { data: member, error: memberError } = await supabase
		.from('space_members')
		.select('role')
		.eq('space_id', spaceId)
		.eq('user_id', userId)
		.single();

	if (memberError || !member) throw new Error('Not a member of this space');

	const { data: memoSpaces, error: joinError } = await supabase
		.from('memo_spaces')
		.select('memo_id')
		.eq('space_id', spaceId);

	if (joinError) throw new Error(`Failed to get memo links: ${joinError.message}`);
	if (!memoSpaces || memoSpaces.length === 0) return { memos: [] };

	const memoIds = memoSpaces.map((ms: { memo_id: string }) => ms.memo_id);

	const { data: memos, error: memosError } = await supabase
		.from('memos')
		.select('id, title, user_id, source, style, is_pinned, is_archived, is_public, metadata, created_at, updated_at')
		.in('id', memoIds);

	if (memosError) throw new Error(`Failed to get memos: ${memosError.message}`);
	return { memos: memos ?? [] };
}

// ── Invites ────────────────────────────────────────────────────────────────────

export async function getSpaceInvites(spaceId: string, userId: string): Promise<unknown[]> {
	const supabase = createServiceClient();

	// Verify membership
	const { data: member, error: memberError } = await supabase
		.from('space_members')
		.select('role')
		.eq('space_id', spaceId)
		.eq('user_id', userId)
		.single();

	if (memberError || !member) throw new Error('Not a member of this space');

	const { data, error } = await supabase
		.from('space_invites')
		.select('*')
		.eq('space_id', spaceId)
		.order('created_at', { ascending: false });

	if (error) throw new Error(`Failed to get invites: ${error.message}`);
	return data ?? [];
}

export async function createInvite(
	spaceId: string,
	userId: string,
	inviteeEmail: string
): Promise<unknown> {
	const supabase = createServiceClient();

	if (!inviteeEmail?.trim()) throw new Error('Invitee email is required');

	// Verify membership (only members can invite)
	const { data: member, error: memberError } = await supabase
		.from('space_members')
		.select('role')
		.eq('space_id', spaceId)
		.eq('user_id', userId)
		.single();

	if (memberError || !member) throw new Error('Not a member of this space');

	const { data: invite, error } = await supabase
		.from('space_invites')
		.insert({
			id: uuidv4(),
			space_id: spaceId,
			inviter_id: userId,
			invitee_email: inviteeEmail.trim().toLowerCase(),
			status: 'pending',
			created_at: new Date().toISOString(),
		})
		.select()
		.single();

	if (error || !invite) throw new Error(`Failed to create invite: ${error?.message ?? 'no data'}`);
	return invite;
}

export async function acceptInvite(
	inviteId: string,
	userId: string
): Promise<{ success: boolean }> {
	const supabase = createServiceClient();

	const { data: invite, error: fetchError } = await supabase
		.from('space_invites')
		.select('*')
		.eq('id', inviteId)
		.eq('status', 'pending')
		.single();

	if (fetchError || !invite) throw new Error('Invite not found or already processed');

	const inv = invite as { space_id: string; invitee_email: string };

	// Accept invite
	const { error: updateError } = await supabase
		.from('space_invites')
		.update({ status: 'accepted', accepted_at: new Date().toISOString() })
		.eq('id', inviteId);

	if (updateError) throw new Error(`Failed to accept invite: ${updateError.message}`);

	// Add user to space_members
	const { error: memberError } = await supabase.from('space_members').upsert(
		{
			space_id: inv.space_id,
			user_id: userId,
			role: 'member',
			joined_at: new Date().toISOString(),
		},
		{ onConflict: 'space_id,user_id' }
	);

	if (memberError) {
		console.error(`[space] Failed to add member after invite acceptance: ${memberError.message}`);
	}

	return { success: true };
}

export async function declineInvite(
	inviteId: string,
	userId: string
): Promise<{ success: boolean }> {
	const supabase = createServiceClient();

	const { data: invite, error: fetchError } = await supabase
		.from('space_invites')
		.select('id, status')
		.eq('id', inviteId)
		.eq('status', 'pending')
		.single();

	if (fetchError || !invite) throw new Error('Invite not found or already processed');

	const { error } = await supabase
		.from('space_invites')
		.update({ status: 'declined', declined_at: new Date().toISOString() })
		.eq('id', inviteId);

	if (error) throw new Error(`Failed to decline invite: ${error.message}`);
	return { success: true };
}

export async function getPendingInvites(userId: string): Promise<unknown[]> {
	const supabase = createServiceClient();

	// Get user email from profiles to match invites
	const { data: profile } = await supabase
		.from('profiles')
		.select('email')
		.eq('user_id', userId)
		.maybeSingle();

	const email = (profile as { email?: string } | null)?.email;
	if (!email) return [];

	const { data, error } = await supabase
		.from('space_invites')
		.select('*, spaces(id, name, owner_id)')
		.eq('invitee_email', email.toLowerCase())
		.eq('status', 'pending')
		.order('created_at', { ascending: false });

	if (error) throw new Error(`Failed to get pending invites: ${error.message}`);
	return data ?? [];
}
