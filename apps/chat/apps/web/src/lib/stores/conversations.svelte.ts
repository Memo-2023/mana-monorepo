/**
 * Conversations Store - Manages conversation list using Svelte 5 runes
 */

import { conversationService } from '$lib/services/conversation';
import { toastStore } from './toast.svelte';
import type { Conversation } from '@chat/types';

// State
let conversations = $state<Conversation[]>([]);
let archivedConversations = $state<Conversation[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const conversationsStore = {
	// Getters
	get conversations() {
		return conversations;
	},
	get archivedConversations() {
		return archivedConversations;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},

	/**
	 * Load conversations (userId is derived from JWT on backend)
	 */
	async loadConversations(spaceId?: string) {
		isLoading = true;
		error = null;

		try {
			conversations = await conversationService.getConversations(spaceId);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Konversationen konnten nicht geladen werden';
			error = message;
			toastStore.error(message);
			conversations = [];
		} finally {
			isLoading = false;
		}
	},

	/**
	 * Load archived conversations
	 */
	async loadArchivedConversations() {
		isLoading = true;
		error = null;

		try {
			archivedConversations = await conversationService.getArchivedConversations();
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Archivierte Konversationen konnten nicht geladen werden';
			error = message;
			toastStore.error(message);
			archivedConversations = [];
		} finally {
			isLoading = false;
		}
	},

	/**
	 * Add a new conversation to the list
	 */
	addConversation(conversation: Conversation) {
		conversations = [conversation, ...conversations];
	},

	/**
	 * Update a conversation in the list
	 */
	updateConversation(conversationId: string, updates: Partial<Conversation>) {
		conversations = conversations.map((c) => (c.id === conversationId ? { ...c, ...updates } : c));
	},

	/**
	 * Update conversation title via API and update local state
	 */
	async updateConversationTitle(conversationId: string, title: string): Promise<boolean> {
		const success = await conversationService.updateTitle(conversationId, title);
		if (success) {
			this.updateConversation(conversationId, { title });
		}
		return success;
	},

	/**
	 * Archive a conversation
	 */
	async archiveConversation(conversationId: string) {
		const success = await conversationService.archiveConversation(conversationId);

		if (success) {
			const conversation = conversations.find((c) => c.id === conversationId);
			if (conversation) {
				conversations = conversations.filter((c) => c.id !== conversationId);
				archivedConversations = [{ ...conversation, isArchived: true }, ...archivedConversations];
			}
		}

		return success;
	},

	/**
	 * Unarchive a conversation
	 */
	async unarchiveConversation(conversationId: string) {
		const success = await conversationService.unarchiveConversation(conversationId);

		if (success) {
			const conversation = archivedConversations.find((c) => c.id === conversationId);
			if (conversation) {
				archivedConversations = archivedConversations.filter((c) => c.id !== conversationId);
				conversations = [{ ...conversation, isArchived: false }, ...conversations];
			}
		}

		return success;
	},

	/**
	 * Delete a conversation
	 */
	async deleteConversation(conversationId: string) {
		const success = await conversationService.deleteConversation(conversationId);

		if (success) {
			conversations = conversations.filter((c) => c.id !== conversationId);
			archivedConversations = archivedConversations.filter((c) => c.id !== conversationId);
		}

		return success;
	},

	/**
	 * Pin a conversation (moves it to top of list)
	 */
	async pinConversation(conversationId: string) {
		const success = await conversationService.pinConversation(conversationId);

		if (success) {
			conversations = conversations.map((c) =>
				c.id === conversationId ? { ...c, isPinned: true } : c
			);
			// Re-sort: pinned first, then by updatedAt
			conversations = [...conversations].sort((a, b) => {
				if (a.isPinned && !b.isPinned) return -1;
				if (!a.isPinned && b.isPinned) return 1;
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			});
		}

		return success;
	},

	/**
	 * Unpin a conversation
	 */
	async unpinConversation(conversationId: string) {
		const success = await conversationService.unpinConversation(conversationId);

		if (success) {
			conversations = conversations.map((c) =>
				c.id === conversationId ? { ...c, isPinned: false } : c
			);
			// Re-sort: pinned first, then by updatedAt
			conversations = [...conversations].sort((a, b) => {
				if (a.isPinned && !b.isPinned) return -1;
				if (!a.isPinned && b.isPinned) return 1;
				return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
			});
		}

		return success;
	},

	/**
	 * Clear all data
	 */
	reset() {
		conversations = [];
		archivedConversations = [];
		error = null;
	},
};
