/**
 * Conversations Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in data/queries.ts.
 * This store only provides write operations (archive, pin, delete, etc.).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { conversationCollection, type LocalConversation } from '$lib/data/local-store';
import { toConversation } from '$lib/data/queries';
import { toastStore } from '@manacore/shared-ui';
import type { Conversation } from '@chat/types';

let error = $state<string | null>(null);

export const conversationsStore = {
	get error() {
		return error;
	},

	/**
	 * Update a conversation's fields in local-store
	 */
	async updateConversation(conversationId: string, updates: Partial<LocalConversation>) {
		error = null;
		try {
			await conversationCollection.update(conversationId, updates);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Konversation konnte nicht aktualisiert werden';
			console.error('Failed to update conversation:', e);
		}
	},

	/**
	 * Update conversation title
	 */
	async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
		error = null;
		try {
			await conversationCollection.update(conversationId, { title });
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Titel konnte nicht aktualisiert werden';
			return false;
		}
	},

	/**
	 * Archive a conversation
	 */
	async archiveConversation(conversationId: string): Promise<boolean> {
		error = null;
		try {
			await conversationCollection.update(conversationId, { isArchived: true });
			toastStore.success('Konversation archiviert');
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Konversation konnte nicht archiviert werden';
			toastStore.error('Konversation konnte nicht archiviert werden');
			return false;
		}
	},

	/**
	 * Unarchive a conversation
	 */
	async unarchiveConversation(conversationId: string): Promise<boolean> {
		error = null;
		try {
			await conversationCollection.update(conversationId, { isArchived: false });
			toastStore.success('Konversation wiederhergestellt');
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Konversation konnte nicht wiederhergestellt werden';
			toastStore.error('Konversation konnte nicht wiederhergestellt werden');
			return false;
		}
	},

	/**
	 * Delete a conversation
	 */
	async deleteConversation(conversationId: string): Promise<boolean> {
		error = null;
		try {
			await conversationCollection.delete(conversationId);
			toastStore.success('Konversation gelöscht');
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Konversation konnte nicht gelöscht werden';
			toastStore.error('Konversation konnte nicht gelöscht werden');
			return false;
		}
	},

	/**
	 * Pin a conversation
	 */
	async pinConversation(conversationId: string): Promise<boolean> {
		error = null;
		try {
			await conversationCollection.update(conversationId, { isPinned: true });
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Konversation konnte nicht angepinnt werden';
			toastStore.error('Konversation konnte nicht angepinnt werden');
			return false;
		}
	},

	/**
	 * Unpin a conversation
	 */
	async unpinConversation(conversationId: string): Promise<boolean> {
		error = null;
		try {
			await conversationCollection.update(conversationId, { isPinned: false });
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Konversation konnte nicht losgelöst werden';
			toastStore.error('Konversation konnte nicht losgelöst werden');
			return false;
		}
	},

	/**
	 * Reset error state
	 */
	reset() {
		error = null;
	},
};
