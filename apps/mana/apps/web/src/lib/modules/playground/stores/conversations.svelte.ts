/**
 * Conversations Store — Mutations for playground conversations + messages.
 *
 * Reads come from liveQuery hooks in queries.ts.
 */

import { playgroundConversationTable, playgroundMessageTable } from '../collections';
import { toConversation, toMessage } from '../queries';
import type { LocalPlaygroundConversation, LocalPlaygroundMessage } from '../types';
import { encryptRecord } from '$lib/data/crypto';

export const conversationsStore = {
	async create(data: {
		model: string;
		systemPrompt: string;
		temperature: number;
		snippetId?: string;
		comparisonModels?: string[];
	}) {
		const now = new Date().toISOString();
		const newLocal: LocalPlaygroundConversation = {
			id: crypto.randomUUID(),
			title: null,
			model: data.model,
			systemPrompt: data.systemPrompt,
			temperature: data.temperature,
			snippetId: data.snippetId ?? null,
			isPinned: false,
			comparisonModels: data.comparisonModels ?? null,
			createdAt: now,
		};
		const snapshot = toConversation(newLocal);
		await encryptRecord('playgroundConversations', newLocal);
		await playgroundConversationTable.add(newLocal);
		return snapshot;
	},

	async updateTitle(id: string, title: string) {
		const diff: Partial<LocalPlaygroundConversation> = {
			title,
		};
		await encryptRecord('playgroundConversations', diff);
		await playgroundConversationTable.update(id, diff);
	},

	async touch(id: string) {
		await playgroundConversationTable.update(id, {});
	},

	async remove(id: string) {
		const now = new Date().toISOString();
		await playgroundConversationTable.update(id, { deletedAt: now });
	},

	async addMessage(
		conversationId: string,
		data: {
			role: 'user' | 'assistant';
			content: string;
			model?: string;
			promptTokens?: number;
			completionTokens?: number;
			comparisonGroupId?: string;
			order: number;
		}
	) {
		const now = new Date().toISOString();
		const newLocal: LocalPlaygroundMessage = {
			id: crypto.randomUUID(),
			conversationId,
			role: data.role,
			content: data.content,
			model: data.model ?? null,
			promptTokens: data.promptTokens ?? null,
			completionTokens: data.completionTokens ?? null,
			comparisonGroupId: data.comparisonGroupId ?? null,
			order: data.order,
			createdAt: now,
		};
		const snapshot = toMessage(newLocal);
		await encryptRecord('playgroundMessages', newLocal);
		await playgroundMessageTable.add(newLocal);
		return snapshot;
	},
};
