/**
 * Companion Chat Store — Manages conversations, messages, and LLM interaction.
 *
 * Uses the Context Document as system prompt and the Tool Layer for
 * function calling. Currently wired to @mana/local-llm (Gemma, browser-local).
 * Can be upgraded to the LLM orchestrator for multi-tier support.
 */

import { conversationTable, messageTable } from '../collections';
import type { LocalConversation, LocalMessage } from '../types';

// ── Conversation CRUD ───────────────────────────────

export const chatStore = {
	async createConversation(title?: string): Promise<LocalConversation> {
		const now = new Date().toISOString();
		const conv: LocalConversation = {
			id: crypto.randomUUID(),
			title: title ?? 'Neues Gespraech',
			createdAt: now,
			updatedAt: now,
		};
		await conversationTable.add(conv);
		return conv;
	},

	async renameConversation(id: string, title: string): Promise<void> {
		await conversationTable.update(id, {
			title,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteConversation(id: string): Promise<void> {
		await conversationTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	// ── Messages ──────────────────────────────────────

	async addMessage(
		conversationId: string,
		role: LocalMessage['role'],
		content: string,
		extra?: {
			toolCall?: LocalMessage['toolCall'];
			toolResult?: LocalMessage['toolResult'];
		}
	): Promise<LocalMessage> {
		const msg: LocalMessage = {
			id: crypto.randomUUID(),
			conversationId,
			role,
			content,
			toolCall: extra?.toolCall,
			toolResult: extra?.toolResult,
			createdAt: new Date().toISOString(),
		};
		await messageTable.add(msg);

		// Touch conversation updatedAt
		await conversationTable.update(conversationId, {
			updatedAt: msg.createdAt,
		});

		return msg;
	},

	async updateMessageContent(id: string, content: string): Promise<void> {
		await messageTable.update(id, { content });
	},

	async getMessages(conversationId: string): Promise<LocalMessage[]> {
		return messageTable.where('conversationId').equals(conversationId).sortBy('createdAt');
	},
};
