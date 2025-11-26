/**
 * Real-time Updates Utility
 * Handles Supabase real-time subscriptions for memo updates
 */

import { supabase } from '$lib/supabaseClient';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Memo } from '$lib/types/memo.types';

export type MemoChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface MemoChangeEvent {
	type: MemoChangeType;
	memo: Memo;
	old?: Memo;
}

export type MemoChangeCallback = (event: MemoChangeEvent) => void;

/**
 * Subscribe to real-time updates for a specific memo
 */
export function subscribeMemoUpdates(
	memoId: string,
	callback: MemoChangeCallback
): RealtimeChannel {
	const channel = supabase
		.channel(`memo:${memoId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'memos',
				filter: `id=eq.${memoId}`
			},
			(payload: RealtimePostgresChangesPayload<Memo>) => {
				handleMemoChange(payload, callback);
			}
		)
		.subscribe();

	return channel;
}

/**
 * Subscribe to real-time updates for all user memos
 */
export function subscribeUserMemos(
	userId: string,
	callback: MemoChangeCallback
): RealtimeChannel {
	const channel = supabase
		.channel(`user-memos:${userId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'memos',
				filter: `user_id=eq.${userId}`
			},
			(payload: RealtimePostgresChangesPayload<Memo>) => {
				handleMemoChange(payload, callback);
			}
		)
		.subscribe();

	return channel;
}

/**
 * Subscribe to real-time updates for space memos
 */
export function subscribeSpaceMemos(
	spaceId: string,
	callback: MemoChangeCallback
): RealtimeChannel {
	const channel = supabase
		.channel(`space-memos:${spaceId}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'space_memos',
				filter: `space_id=eq.${spaceId}`
			},
			async (payload) => {
				// When a memo is added/removed from a space, fetch the full memo
				if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
					const memoId = (payload.new as any).memo_id;
					const { data: memo } = await supabase.from('memos').select('*').eq('id', memoId).single();

					if (memo) {
						callback({
							type: payload.eventType,
							memo: memo as Memo
						});
					}
				} else if (payload.eventType === 'DELETE') {
					const memoId = (payload.old as any).memo_id;
					callback({
						type: 'DELETE',
						memo: { id: memoId } as Memo
					});
				}
			}
		)
		.subscribe();

	return channel;
}

/**
 * Unsubscribe from a channel
 */
export async function unsubscribe(channel: RealtimeChannel): Promise<void> {
	await supabase.removeChannel(channel);
}

/**
 * Handle memo change payload and convert to event
 */
function handleMemoChange(
	payload: RealtimePostgresChangesPayload<Memo>,
	callback: MemoChangeCallback
): void {
	const event: MemoChangeEvent = {
		type: payload.eventType as MemoChangeType,
		memo: payload.new as Memo,
		old: payload.old as Memo | undefined
	};

	callback(event);
}

/**
 * Svelte 5 effect for real-time memo updates
 * Usage: $effect(() => { const cleanup = useMemoRealtime(memoId, callback); return cleanup; })
 */
export function useMemoRealtime(
	memoId: string | null,
	callback: MemoChangeCallback
): () => void {
	if (!memoId) {
		return () => {};
	}

	const channel = subscribeMemoUpdates(memoId, callback);

	return () => {
		unsubscribe(channel);
	};
}

/**
 * Svelte 5 effect for real-time user memos
 */
export function useUserMemosRealtime(
	userId: string | null,
	callback: MemoChangeCallback
): () => void {
	if (!userId) {
		return () => {};
	}

	const channel = subscribeUserMemos(userId, callback);

	return () => {
		unsubscribe(channel);
	};
}

/**
 * Svelte 5 effect for real-time space memos
 */
export function useSpaceMemosRealtime(
	spaceId: string | null,
	callback: MemoChangeCallback
): () => void {
	if (!spaceId) {
		return () => {};
	}

	const channel = subscribeSpaceMemos(spaceId, callback);

	return () => {
		unsubscribe(channel);
	};
}
