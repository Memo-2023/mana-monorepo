/**
 * Emails Store - Manages emails using Svelte 5 runes
 */

import { emailsApi, type Email, type EmailFilters } from '$lib/api/emails';
import { foldersStore } from './folders.svelte';

let emails = $state<Email[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let total = $state(0);
let selectedEmailId = $state<string | null>(null);
let currentFilters = $state<EmailFilters>({});

export const emailsStore = {
	get emails() {
		return emails;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get total() {
		return total;
	},
	get selectedEmailId() {
		return selectedEmailId;
	},
	get selectedEmail() {
		return emails.find((e) => e.id === selectedEmailId) || null;
	},
	get currentFilters() {
		return currentFilters;
	},

	// Filtered getters
	get unreadEmails() {
		return emails.filter((e) => !e.isRead);
	},
	get starredEmails() {
		return emails.filter((e) => e.isStarred);
	},

	setSelectedEmail(id: string | null) {
		selectedEmailId = id;
	},

	async fetchEmails(filters: EmailFilters = {}) {
		loading = true;
		error = null;
		currentFilters = filters;

		const result = await emailsApi.list(filters);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		emails = result.data?.emails || [];
		total = result.data?.total || 0;
		loading = false;
	},

	async loadMore() {
		if (loading) return;

		const offset = emails.length;
		loading = true;

		const result = await emailsApi.list({ ...currentFilters, offset });

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		if (result.data?.emails) {
			emails = [...emails, ...result.data.emails];
		}
		loading = false;
	},

	async search(query: string, accountId?: string) {
		loading = true;
		error = null;

		const result = await emailsApi.search(query, accountId);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return [];
		}

		loading = false;
		return result.data?.emails || [];
	},

	async getEmail(id: string) {
		const result = await emailsApi.get(id);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		// Update email in list if exists
		if (result.data?.email) {
			const index = emails.findIndex((e) => e.id === id);
			if (index >= 0) {
				emails = [...emails.slice(0, index), result.data.email, ...emails.slice(index + 1)];
			}
		}

		return result.data?.email || null;
	},

	async getThread(id: string) {
		const result = await emailsApi.getThread(id);
		return result.data?.emails || [];
	},

	async markAsRead(id: string) {
		const email = emails.find((e) => e.id === id);
		if (!email || email.isRead) return;

		const result = await emailsApi.update(id, { isRead: true });

		if (result.error) {
			error = result.error.message;
			return;
		}

		emails = emails.map((e) => (e.id === id ? { ...e, isRead: true } : e));

		// Update folder unread count
		if (email.folderId) {
			foldersStore.updateUnreadCount(email.folderId, -1);
		}
	},

	async markAsUnread(id: string) {
		const email = emails.find((e) => e.id === id);
		if (!email || !email.isRead) return;

		const result = await emailsApi.update(id, { isRead: false });

		if (result.error) {
			error = result.error.message;
			return;
		}

		emails = emails.map((e) => (e.id === id ? { ...e, isRead: false } : e));

		// Update folder unread count
		if (email.folderId) {
			foldersStore.updateUnreadCount(email.folderId, 1);
		}
	},

	async toggleStar(id: string) {
		const email = emails.find((e) => e.id === id);
		if (!email) return;

		const result = await emailsApi.update(id, { isStarred: !email.isStarred });

		if (result.error) {
			error = result.error.message;
			return;
		}

		emails = emails.map((e) => (e.id === id ? { ...e, isStarred: !e.isStarred } : e));
	},

	async moveToFolder(id: string, targetFolderId: string) {
		const email = emails.find((e) => e.id === id);
		if (!email) return;

		const result = await emailsApi.move(id, targetFolderId);

		if (result.error) {
			error = result.error.message;
			return;
		}

		// Update folder counts
		if (email.folderId && !email.isRead) {
			foldersStore.updateUnreadCount(email.folderId, -1);
			foldersStore.updateUnreadCount(targetFolderId, 1);
		}

		// Remove from current list if viewing a specific folder
		if (currentFilters.folderId) {
			emails = emails.filter((e) => e.id !== id);
		} else {
			emails = emails.map((e) => (e.id === id ? { ...e, folderId: targetFolderId } : e));
		}
	},

	async deleteEmail(id: string) {
		const email = emails.find((e) => e.id === id);
		if (!email) return;

		const result = await emailsApi.delete(id);

		if (result.error) {
			error = result.error.message;
			return;
		}

		// Update folder counts
		if (email.folderId && !email.isRead) {
			foldersStore.updateUnreadCount(email.folderId, -1);
		}

		emails = emails.filter((e) => e.id !== id);

		if (selectedEmailId === id) {
			selectedEmailId = null;
		}
	},

	// Batch operations
	async batchMarkAsRead(ids: string[]) {
		const result = await emailsApi.batch({ operation: 'markRead', emailIds: ids });

		if (result.error) {
			error = result.error.message;
			return;
		}

		emails = emails.map((e) => (ids.includes(e.id) ? { ...e, isRead: true } : e));
	},

	async batchMarkAsUnread(ids: string[]) {
		const result = await emailsApi.batch({ operation: 'markUnread', emailIds: ids });

		if (result.error) {
			error = result.error.message;
			return;
		}

		emails = emails.map((e) => (ids.includes(e.id) ? { ...e, isRead: false } : e));
	},

	async batchDelete(ids: string[]) {
		const result = await emailsApi.batch({ operation: 'delete', emailIds: ids });

		if (result.error) {
			error = result.error.message;
			return;
		}

		emails = emails.filter((e) => !ids.includes(e.id));

		if (selectedEmailId && ids.includes(selectedEmailId)) {
			selectedEmailId = null;
		}
	},

	async batchMove(ids: string[], targetFolderId: string) {
		const result = await emailsApi.batch({
			operation: 'move',
			emailIds: ids,
			targetFolderId,
		});

		if (result.error) {
			error = result.error.message;
			return;
		}

		if (currentFilters.folderId) {
			emails = emails.filter((e) => !ids.includes(e.id));
		}
	},

	// AI Features
	async summarize(id: string) {
		const result = await emailsApi.summarize(id);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		// Update email with summary
		if (result.data) {
			emails = emails.map((e) => (e.id === id ? { ...e, aiSummary: result.data!.summary } : e));
		}

		return result.data;
	},

	async suggestReplies(id: string) {
		const result = await emailsApi.suggestReplies(id);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		// Update email with suggestions
		if (result.data) {
			emails = emails.map((e) =>
				e.id === id ? { ...e, aiSuggestedReplies: result.data!.replies } : e
			);
		}

		return result.data;
	},

	async categorize(id: string) {
		const result = await emailsApi.categorize(id);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		// Update email with category
		if (result.data) {
			emails = emails.map((e) =>
				e.id === id
					? { ...e, aiCategory: result.data!.category, aiPriority: result.data!.priority }
					: e
			);
		}

		return result.data;
	},
};
