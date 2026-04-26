/**
 * Companion Queries — Reactive reads for conversations and messages.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type { LocalConversation, LocalMessage } from './types';

export function useConversations() {
	return useScopedLiveQuery<LocalConversation[]>(async () => {
		try {
			const all = await scopedForModule<LocalConversation, string>(
				'companion',
				'companionConversations'
			).toArray();
			return all
				.filter((c) => !c.deletedAt)
				.sort((a, b) =>
					(b.lastMessageAt ?? b.createdAt).localeCompare(a.lastMessageAt ?? a.createdAt)
				);
		} catch {
			return [];
		}
	}, []);
}

export function useMessages(conversationId: string) {
	return useScopedLiveQuery<LocalMessage[]>(async () => {
		if (!conversationId) return [];
		try {
			return await db
				.table<LocalMessage>('companionMessages')
				.where('conversationId')
				.equals(conversationId)
				.sortBy('createdAt');
		} catch {
			return [];
		}
	}, []);
}
