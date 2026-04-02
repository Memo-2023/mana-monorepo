/**
 * Messages Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store handles adding/deleting messages in IndexedDB.
 */

import { messageTable, conversationTable } from '../collections';
import { toMessage } from '../queries';
import { ChatEvents } from '@manacore/shared-utils/analytics';
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
		await messageTable.add(newLocal);
		// Touch the conversation's updatedAt
		await conversationTable.update(conversationId, {
			updatedAt: new Date().toISOString(),
		});
		ChatEvents.messageSent();
		return toMessage(newLocal);
	},

	/** Add an assistant message to a conversation. */
	async addAssistantMessage(conversationId: string, text: string) {
		const newLocal: LocalMessage = {
			id: crypto.randomUUID(),
			conversationId,
			sender: 'assistant',
			messageText: text,
		};
		await messageTable.add(newLocal);
		await conversationTable.update(conversationId, {
			updatedAt: new Date().toISOString(),
		});
		return toMessage(newLocal);
	},

	/** Update a message's text (e.g., during streaming). */
	async updateText(id: string, text: string) {
		await messageTable.update(id, {
			messageText: text,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a message. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await messageTable.update(id, { deletedAt: now, updatedAt: now });
	},
};
