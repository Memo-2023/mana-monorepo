/**
 * Reactive queries & pure helpers for Chat — uses Dexie liveQuery on the unified DB.
 *
 * Phase 5 encryption: messageText, conversation title, and template
 * fields (name/description/systemPrompt/initialQuestion) are encrypted
 * at rest. liveQueries decrypt the configured fields before mapping
 * to the public types so consumers see plaintext.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
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
		contextSpaceId: local.contextSpaceId ?? undefined,
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
	return useScopedLiveQuery(async () => {
		const visible = (
			await scopedForModule<LocalConversation, string>('chat', 'conversations').toArray()
		).filter((c) => !c.deletedAt && !c.isArchived);
		const decrypted = await decryptRecords('conversations', visible);
		return sortConversations(decrypted.map(toConversation));
	}, [] as Conversation[]);
}

/** All archived conversations, sorted by updatedAt desc. */
export function useArchivedConversations() {
	return useScopedLiveQuery(async () => {
		const visible = (
			await scopedForModule<LocalConversation, string>('chat', 'conversations').toArray()
		).filter((c) => !c.deletedAt && c.isArchived);
		const decrypted = await decryptRecords('conversations', visible);
		return decrypted
			.map(toConversation)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [] as Conversation[]);
}

/** All templates, sorted by name. */
export function useAllTemplates() {
	return useScopedLiveQuery(async () => {
		const visible = (
			await scopedForModule<LocalTemplate, string>('chat', 'chatTemplates').toArray()
		).filter((t) => !t.deletedAt);
		const decrypted = await decryptRecords('chatTemplates', visible);
		return decrypted.map(toTemplate).sort((a, b) => a.name.localeCompare(b.name));
	}, [] as Template[]);
}

/** Messages for a specific conversation, sorted by createdAt asc. */
export function useConversationMessages(conversationId: string) {
	return useScopedLiveQuery(async () => {
		const visible = (
			await db
				.table<LocalMessage>('messages')
				.where('conversationId')
				.equals(conversationId)
				.toArray()
		).filter((m) => !m.deletedAt);
		const decrypted = await decryptRecords('messages', visible);
		return decrypted
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
export function filterByContextSpace(
	conversations: Conversation[],
	contextSpaceId: string
): Conversation[] {
	return conversations.filter((c) => c.contextSpaceId === contextSpaceId);
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
