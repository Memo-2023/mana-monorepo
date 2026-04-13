/**
 * Messages Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store handles adding/deleting messages in IndexedDB.
 *
 * Phase 5 encryption: messageText is encrypted at rest. Streaming
 * updateText() re-encrypts on every chunk — that means a 1 KB
 * assistant reply produces ~50 wrap operations during the stream.
 * Web Crypto AES-GCM is fast enough that this is sub-millisecond
 * each, but we wrap the diff via encryptRecord() so the call site
 * stays declarative.
 */

import { messageTable, conversationTable } from '../collections';
import { toMessage } from '../queries';
import { ChatEvents } from '@mana/shared-utils/analytics';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import type { LocalMessage } from '../types';

export const messagesStore = {
	/** Add a user message to a conversation. */
	async addUserMessage(conversationId: string, text: string) {
		const newLocal: LocalMessage = {
			id: crypto.randomUUID(),
			conversationId,
			sender: 'user',
			messageText: text,
		};
		// Plaintext snapshot for the optimistic UI return value.
		const plaintextSnapshot = toMessage(newLocal);
		await encryptRecord('messages', newLocal);
		await messageTable.add(newLocal);
		// Touch the conversation's updatedAt
		await conversationTable.update(conversationId, {
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('ChatMessageSent', 'chat', 'messages', newLocal.id, {
			messageId: newLocal.id,
			conversationId,
		});
		ChatEvents.messageSent();
		return plaintextSnapshot;
	},

	/** Add an assistant message to a conversation. */
	async addAssistantMessage(conversationId: string, text: string) {
		const newLocal: LocalMessage = {
			id: crypto.randomUUID(),
			conversationId,
			sender: 'assistant',
			messageText: text,
		};
		const plaintextSnapshot = toMessage(newLocal);
		await encryptRecord('messages', newLocal);
		await messageTable.add(newLocal);
		await conversationTable.update(conversationId, {
			updatedAt: new Date().toISOString(),
		});
		return plaintextSnapshot;
	},

	/** Update a message's text (e.g., during streaming). */
	async updateText(id: string, text: string) {
		const diff: Partial<LocalMessage> = {
			messageText: text,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('messages', diff);
		await messageTable.update(id, diff);
	},

	/** Soft-delete a message. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await messageTable.update(id, { deletedAt: now, updatedAt: now });
	},
};
