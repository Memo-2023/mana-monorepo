/**
 * Conversations Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store only handles writes to IndexedDB via the unified database.
 */

import { conversationTable, messageTable } from '../collections';
import { toConversation } from '../queries';
import { createArchiveOps } from '@mana/shared-stores';
import { ChatEvents } from '@mana/shared-utils/analytics';
import type { LocalConversation } from '../types';

/** Archive/soft-delete ops for conversations. */
export const conversationArchive = createArchiveOps({
	table: () => conversationTable,
});

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
		ChatEvents.conversationCreated();
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

	// Archive ops (delegated to shared factory)
	archive: (id: string) => conversationArchive.archive(id),
	unarchive: (id: string) => conversationArchive.unarchive(id),

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
		// Cascade soft-delete to messages
		const msgs = await messageTable.where('conversationId').equals(id).toArray();
		for (const msg of msgs) {
			await messageTable.update(msg.id, { deletedAt: now, updatedAt: now });
		}
		ChatEvents.conversationDeleted();
	},
};
