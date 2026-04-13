/**
 * Companion Queries — Reactive reads for conversations and messages.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import type { LocalConversation, LocalMessage } from './types';

export function useConversations() {
	return useLiveQueryWithDefault<LocalConversation[]>(async () => {
		try {
			const all = await db.table<LocalConversation>('companionConversations').toArray();
			return all.filter((c) => !c.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
		} catch {
			return [];
		}
	}, []);
}

export function useMessages(conversationId: string) {
	return useLiveQueryWithDefault<LocalMessage[]>(async () => {
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
