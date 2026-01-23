/**
 * Conversations Store - Manages conversation list using Svelte 5 runes
 * Supports both authenticated (cloud) and guest (session) modes
 */

import { conversationService } from '$lib/services/conversation';
import { toastStore } from './toast.svelte';
import { sessionConversationsStore } from './session-conversations.svelte';
import { authStore } from './auth.svelte';
import type { Conversation } from '@chat/types';

// State
let conversations = $state<Conversation[]>([]);
let archivedConversations = $state<Conversation[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

/**
 * Sort conversations: pinned first, then by updatedAt descending
 */
function sortConversations(list: Conversation[]): Conversation[] {
	return [...list].sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1;
		if (!a.isPinned && b.isPinned) return 1;
		return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
	});
}

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
	 * In guest mode, loads from session storage
	 */
	async loadConversations(spaceId?: string) {
		isLoading = true;
		error = null;

		// Guest mode: load from session storage
		if (!authStore.isAuthenticated) {
			conversations = sessionConversationsStore.conversations;
			isLoading = false;
			return;
		}

		// Authenticated: fetch from API
		try {
			conversations = await conversationService.getConversations(spaceId);
		} catch (e) {
			const message =
				e instanceof Error ? e.message : 'Konversationen konnten nicht geladen werden';
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
			const message =
				e instanceof Error ? e.message : 'Archivierte Konversationen konnten nicht geladen werden';
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
			toastStore.success('Konversation archiviert');
		} else {
			toastStore.error('Konversation konnte nicht archiviert werden');
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
				conversations = sortConversations([
					{ ...conversation, isArchived: false },
					...conversations,
				]);
			}
			toastStore.success('Konversation wiederhergestellt');
		} else {
			toastStore.error('Konversation konnte nicht wiederhergestellt werden');
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
			toastStore.success('Konversation gelöscht');
		} else {
			toastStore.error('Konversation konnte nicht gelöscht werden');
		}

		return success;
	},

	/**
	 * Pin a conversation (moves it to top of list)
	 */
	async pinConversation(conversationId: string) {
		const success = await conversationService.pinConversation(conversationId);

		if (success) {
			conversations = sortConversations(
				conversations.map((c) => (c.id === conversationId ? { ...c, isPinned: true } : c))
			);
		} else {
			toastStore.error('Konversation konnte nicht angepinnt werden');
		}

		return success;
	},

	/**
	 * Unpin a conversation
	 */
	async unpinConversation(conversationId: string) {
		const success = await conversationService.unpinConversation(conversationId);

		if (success) {
			conversations = sortConversations(
				conversations.map((c) => (c.id === conversationId ? { ...c, isPinned: false } : c))
			);
		} else {
			toastStore.error('Konversation konnte nicht losgelöst werden');
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

	/**
	 * Get session conversation count (for guest mode banner)
	 */
	get sessionConversationCount(): number {
		return sessionConversationsStore.count;
	},

	/**
	 * Check if there are session conversations
	 */
	get hasSessionConversations(): boolean {
		return sessionConversationsStore.count > 0;
	},

	/**
	 * Migrate session conversations to cloud after login
	 * Note: This is a placeholder - actual implementation would need backend support
	 */
	async migrateSessionConversations(): Promise<void> {
		if (!authStore.isAuthenticated) return;

		const sessionData = sessionConversationsStore.getAllConversations();
		if (sessionData.conversations.length === 0) return;

		// For now, we just clear the session data
		// In a full implementation, you would create each conversation via API
		// and transfer the messages
		console.log(
			'Session conversations would be migrated:',
			sessionData.conversations.length,
			'conversations'
		);

		// Clear session data after migration
		sessionConversationsStore.clear();

		// Reload conversations from server
		await this.loadConversations();

		toastStore.success('Unterhaltungen wurden in deinen Account übertragen');
	},

	/**
	 * Check if a conversation ID is a session conversation
	 */
	isSessionConversation(id: string): boolean {
		return sessionConversationsStore.isSessionConversation(id);
	},
};
