/**
 * Companion Chat Store — Manages conversations, messages, and LLM interaction.
 *
 * Uses the Context Document as system prompt and the Tool Layer for
 * function calling. Currently wired to @mana/local-llm (Gemma, browser-local).
 * Can be upgraded to the LLM orchestrator for multi-tier support.
 */

import { db } from '$lib/data/database';
import { emitDomainEvent } from '$lib/data/events';
import type { LocalConversation, LocalMessage } from '../types';

const CONV_TABLE = 'companionConversations';
const MSG_TABLE = 'companionMessages';

// ── Conversation CRUD ───────────────────────────────

export const chatStore = {
	async createConversation(title?: string): Promise<LocalConversation> {
		const now = new Date().toISOString();
		const conv: LocalConversation = {
			id: crypto.randomUUID(),
			title: title ?? 'Neues Gespraech',
			createdAt: now,
		};
		await db.table<LocalConversation>(CONV_TABLE).add(conv);
		emitDomainEvent('CompanionConversationStarted', 'companion', CONV_TABLE, conv.id, {
			conversationId: conv.id,
			title: conv.title,
		});
		return conv;
	},

	async renameConversation(id: string, title: string): Promise<void> {
		await db.table<LocalConversation>(CONV_TABLE).update(id, {
			title,
		});
	},

	async deleteConversation(id: string): Promise<void> {
		await db.table<LocalConversation>(CONV_TABLE).update(id, {
			deletedAt: new Date().toISOString(),
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
		await db.table<LocalMessage>(MSG_TABLE).add(msg);

		// Touch conversation so the chat list re-sorts with the most
		// recently active conversation at the top.
		await db.table<LocalConversation>(CONV_TABLE).update(conversationId, {
			lastMessageAt: msg.createdAt,
		});

		// Emit event only for actual user/assistant messages, not tool plumbing
		if (role === 'user' || role === 'assistant') {
			emitDomainEvent('CompanionMessageSent', 'companion', MSG_TABLE, msg.id, {
				messageId: msg.id,
				conversationId,
				role,
				contentLength: content.length,
			});
		}

		return msg;
	},

	async updateMessageContent(id: string, content: string): Promise<void> {
		await db.table<LocalMessage>(MSG_TABLE).update(id, { content });
	},

	async getMessages(conversationId: string): Promise<LocalMessage[]> {
		return db
			.table<LocalMessage>(MSG_TABLE)
			.where('conversationId')
			.equals(conversationId)
			.sortBy('createdAt');
	},
};
