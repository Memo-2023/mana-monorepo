/**
 * Playground module — reactive queries for snippets.
 *
 * `name` and `systemPrompt` are encrypted at rest, so the live query
 * decrypts the visible set before mapping to the public DTO. Same
 * pattern as notes / dreams / places.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalPlaygroundSnippet,
	PlaygroundSnippet,
	LocalPlaygroundConversation,
	PlaygroundConversation,
	LocalPlaygroundMessage,
	PlaygroundConversationMessage,
} from './types';

export function toSnippet(local: LocalPlaygroundSnippet): PlaygroundSnippet {
	return {
		id: local.id,
		name: local.name,
		systemPrompt: local.systemPrompt,
		model: local.model,
		temperature: local.temperature,
		isPinned: local.isPinned ?? false,
		order: local.order ?? 0,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function useAllSnippets() {
	return useScopedLiveQuery(async () => {
		const locals = await db
			.table<LocalPlaygroundSnippet>('playgroundSnippets')
			.orderBy('order')
			.toArray();
		const visible = locals.filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords<LocalPlaygroundSnippet>('playgroundSnippets', visible);
		// Pinned first, then by manual order — same convention as notes.
		const sorted = decrypted.sort((a, b) => {
			const ap = a.isPinned ? 1 : 0;
			const bp = b.isPinned ? 1 : 0;
			if (ap !== bp) return bp - ap;
			return (a.order ?? 0) - (b.order ?? 0);
		});
		return sorted.map(toSnippet);
	}, [] as PlaygroundSnippet[]);
}

// ─── Conversations ──────────────────────────────────────

export function toConversation(local: LocalPlaygroundConversation): PlaygroundConversation {
	return {
		id: local.id,
		title: local.title,
		model: local.model,
		systemPrompt: local.systemPrompt,
		temperature: local.temperature,
		snippetId: local.snippetId,
		isPinned: local.isPinned ?? false,
		comparisonModels: local.comparisonModels ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toMessage(local: LocalPlaygroundMessage): PlaygroundConversationMessage {
	return {
		id: local.id,
		conversationId: local.conversationId,
		role: local.role,
		content: local.content,
		model: local.model,
		promptTokens: local.promptTokens,
		completionTokens: local.completionTokens,
		comparisonGroupId: local.comparisonGroupId,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

export function useAllConversations() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalPlaygroundConversation, string>(
			'playground',
			'playgroundConversations'
		).toArray();
		const visible = locals.filter((c) => !c.deletedAt);
		const decrypted = await decryptRecords<LocalPlaygroundConversation>(
			'playgroundConversations',
			visible
		);
		return decrypted.map(toConversation).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	}, [] as PlaygroundConversation[]);
}

export function useConversationMessages(conversationId: () => string | null) {
	return useScopedLiveQuery(async () => {
		const cid = conversationId();
		if (!cid) return [];
		const locals = await db
			.table<LocalPlaygroundMessage>('playgroundMessages')
			.where('conversationId')
			.equals(cid)
			.sortBy('order');
		const visible = locals.filter((m) => !m.deletedAt);
		const decrypted = await decryptRecords<LocalPlaygroundMessage>('playgroundMessages', visible);
		return decrypted.map(toMessage);
	}, [] as PlaygroundConversationMessage[]);
}
