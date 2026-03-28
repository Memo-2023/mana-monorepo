/**
 * Reactive Queries & Pure Helpers for Chat
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	conversationCollection,
	templateCollection,
	messageCollection,
	type LocalConversation,
	type LocalTemplate,
	type LocalMessage,
} from './local-store';
import type { Conversation, Template, Message } from '@chat/types';

// ─── Type Converters ───────────────────────────────────────

export function toConversation(local: LocalConversation): Conversation {
	return {
		id: local.id,
		userId: local.userId ?? 'guest',
		modelId: local.modelId ?? '',
		templateId: local.templateId ?? undefined,
		spaceId: local.spaceId ?? undefined,
		conversationMode: local.conversationMode,
		documentMode: local.documentMode,
		title: local.title ?? undefined,
		isArchived: local.isArchived,
		isPinned: local.isPinned,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toTemplate(local: LocalTemplate): Template {
	return {
		id: local.id,
		userId: local.userId ?? 'guest',
		name: local.name,
		description: local.description || null,
		systemPrompt: local.systemPrompt,
		initialQuestion: local.initialQuestion ?? null,
		modelId: local.modelId ?? null,
		color: local.color,
		isDefault: local.isDefault,
		documentMode: local.documentMode,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toMessage(local: LocalMessage): Message {
	return {
		id: local.id,
		conversationId: local.conversationId,
		sender: local.sender,
		messageText: local.messageText,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? undefined,
	};
}

// ─── Live Query Hooks (call during component init) ─────────

/** All non-archived conversations, sorted by pinned first then updatedAt desc. */
export function useAllConversations() {
	return useLiveQueryWithDefault(async () => {
		const locals = await conversationCollection.getAll({ isArchived: false });
		return sortConversations(locals.map(toConversation));
	}, [] as Conversation[]);
}

/** All archived conversations, sorted by updatedAt desc. */
export function useArchivedConversations() {
	return useLiveQueryWithDefault(async () => {
		const locals = await conversationCollection.getAll({ isArchived: true });
		return locals
			.map(toConversation)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [] as Conversation[]);
}

/** All templates, sorted by name. */
export function useAllTemplates() {
	return useLiveQueryWithDefault(async () => {
		const locals = await templateCollection.getAll();
		return locals.map(toTemplate).sort((a, b) => a.name.localeCompare(b.name));
	}, [] as Template[]);
}

/** Messages for a specific conversation, sorted by createdAt asc. */
export function useConversationMessages(conversationId: string) {
	return useLiveQueryWithDefault(async () => {
		const locals = await messageCollection.getAll({ conversationId });
		return locals
			.map(toMessage)
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	}, [] as Message[]);
}

// ─── Pure Sort / Filter Functions (for $derived) ───────────

/** Sort conversations: pinned first, then by updatedAt descending. */
export function sortConversations(list: Conversation[]): Conversation[] {
	return [...list].sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1;
		if (!a.isPinned && b.isPinned) return 1;
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	});
}

/** Filter conversations by space. */
export function filterBySpace(conversations: Conversation[], spaceId: string): Conversation[] {
	return conversations.filter((c) => c.spaceId === spaceId);
}

/** Filter conversations by search query on title. */
export function filterBySearch(conversations: Conversation[], query: string): Conversation[] {
	if (!query.trim()) return conversations;
	const lower = query.toLowerCase();
	return conversations.filter((c) => c.title?.toLowerCase().includes(lower));
}

/** Split conversations into pinned and unpinned. */
export function splitPinned(conversations: Conversation[]) {
	return {
		pinned: conversations.filter((c) => c.isPinned),
		unpinned: conversations.filter((c) => !c.isPinned),
	};
}
