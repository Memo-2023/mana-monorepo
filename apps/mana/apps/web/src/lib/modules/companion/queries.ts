/**
 * Companion Queries — Reactive reads for conversations and messages.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { conversationTable, messageTable } from './collections';
import type { LocalConversation, LocalMessage } from './types';

export function useConversations() {
	return useLiveQueryWithDefault<LocalConversation[]>(async () => {
		const all = await conversationTable.toArray();
		return all.filter((c) => !c.deletedAt).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}, []);
}

export function useMessages(conversationId: string) {
	return useLiveQueryWithDefault<LocalMessage[]>(async () => {
		if (!conversationId) return [];
		const msgs = await messageTable
			.where('conversationId')
			.equals(conversationId)
			.sortBy('createdAt');
		return msgs;
	}, []);
}
