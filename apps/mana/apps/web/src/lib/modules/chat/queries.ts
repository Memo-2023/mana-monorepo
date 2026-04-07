/**
 * Reactive queries & pure helpers for Chat — uses Dexie liveQuery on the unified DB.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import type {
	LocalConversation,
	LocalMessage,
	LocalTemplate,
	Conversation,
	Message,
	Template,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toConversation(local: LocalConversation): Conversation {
	return {
		id: local.id,
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

// ─── Live Queries ──────────────────────────────────────────

/** All non-archived conversations, sorted by pinned first then updatedAt desc. */
export function useAllConversations() {
	return liveQuery(async () => {
		const locals = await db.table<LocalConversation>('conversations').toArray();
		return sortConversations(
			locals.filter((c) => !c.deletedAt && !c.isArchived).map(toConversation)
		);
	});
}

/** All archived conversations, sorted by updatedAt desc. */
export function useArchivedConversations() {
	return liveQuery(async () => {
		const locals = await db.table<LocalConversation>('conversations').toArray();
		return locals
			.filter((c) => !c.deletedAt && c.isArchived)
			.map(toConversation)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	});
}

/** All templates, sorted by name. */
export function useAllTemplates() {
	return liveQuery(async () => {
		const locals = await db.table<LocalTemplate>('chatTemplates').toArray();
		return locals
			.filter((t) => !t.deletedAt)
			.map(toTemplate)
			.sort((a, b) => a.name.localeCompare(b.name));
	});
}

/** Messages for a specific conversation, sorted by createdAt asc. */
export function useConversationMessages(conversationId: string) {
	return liveQuery(async () => {
		const locals = await db
			.table<LocalMessage>('messages')
			.where('conversationId')
			.equals(conversationId)
			.toArray();
		return locals
			.filter((m) => !m.deletedAt)
			.map(toMessage)
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	});
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
