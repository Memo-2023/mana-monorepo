/**
 * Conversations Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { conversationTable, messageTable } from '../collections';
import { toConversation } from '../queries';
import type { LocalConversation } from '../types';

export const conversationsStore = {
	/** Create a new conversation. */
	async create(data: {
		modelId?: string;
		templateId?: string;
		spaceId?: string;
		mode?: 'free' | 'guided' | 'template';
		documentMode?: boolean;
		title?: string;
	}) {
		const newLocal: LocalConversation = {
			id: crypto.randomUUID(),
			title: data.title ?? null,
			modelId: data.modelId ?? null,
			templateId: data.templateId ?? null,
			spaceId: data.spaceId ?? null,
			conversationMode: data.mode ?? 'free',
			documentMode: data.documentMode ?? false,
			isArchived: false,
			isPinned: false,
		};
		await conversationTable.add(newLocal);
		return toConversation(newLocal);
	},

	/** Update a conversation's fields. */
	async update(id: string, updates: Partial<LocalConversation>) {
		await conversationTable.update(id, {
			...updates,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Update conversation title. */
	async updateTitle(id: string, title: string) {
		await conversationTable.update(id, {
			title,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Archive a conversation. */
	async archive(id: string) {
		await conversationTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Unarchive a conversation. */
	async unarchive(id: string) {
		await conversationTable.update(id, {
			isArchived: false,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Pin a conversation. */
	async pin(id: string) {
		await conversationTable.update(id, {
			isPinned: true,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Unpin a conversation. */
	async unpin(id: string) {
		await conversationTable.update(id, {
			isPinned: false,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a conversation and its messages. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await conversationTable.update(id, { deletedAt: now, updatedAt: now });
		// Soft-delete all messages for this conversation
		const msgs = await messageTable.where('conversationId').equals(id).toArray();
		for (const msg of msgs) {
			await messageTable.update(msg.id, { deletedAt: now, updatedAt: now });
		}
	},
};
