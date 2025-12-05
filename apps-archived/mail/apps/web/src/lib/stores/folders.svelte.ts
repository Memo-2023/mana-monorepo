/**
 * Folders Store - Manages email folders using Svelte 5 runes
 */

import { foldersApi, type Folder } from '$lib/api/folders';

let folders = $state<Folder[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let selectedFolderId = $state<string | null>(null);

export const foldersStore = {
	get folders() {
		return folders;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get selectedFolderId() {
		return selectedFolderId;
	},
	get selectedFolder() {
		return folders.find((f) => f.id === selectedFolderId) || null;
	},

	// Filtered getters
	get systemFolders() {
		return folders.filter((f) => f.isSystem && !f.isHidden);
	},
	get customFolders() {
		return folders.filter((f) => !f.isSystem && !f.isHidden);
	},
	get inboxFolder() {
		return folders.find((f) => f.type === 'inbox');
	},
	get sentFolder() {
		return folders.find((f) => f.type === 'sent');
	},
	get draftsFolder() {
		return folders.find((f) => f.type === 'drafts');
	},
	get trashFolder() {
		return folders.find((f) => f.type === 'trash');
	},
	get spamFolder() {
		return folders.find((f) => f.type === 'spam');
	},

	setSelectedFolder(id: string | null) {
		selectedFolderId = id;
	},

	async fetchFolders(accountId?: string) {
		loading = true;
		error = null;

		const result = await foldersApi.list(accountId);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return;
		}

		folders = result.data?.folders || [];

		// Auto-select inbox
		if (!selectedFolderId) {
			const inbox = folders.find((f) => f.type === 'inbox');
			selectedFolderId = inbox?.id || folders[0]?.id || null;
		}

		loading = false;
	},

	async createFolder(data: Parameters<typeof foldersApi.create>[0]) {
		loading = true;
		error = null;

		const result = await foldersApi.create(data);

		if (result.error) {
			error = result.error.message;
			loading = false;
			return null;
		}

		if (result.data?.folder) {
			folders = [...folders, result.data.folder];
		}

		loading = false;
		return result.data?.folder || null;
	},

	async updateFolder(id: string, data: Parameters<typeof foldersApi.update>[1]) {
		const result = await foldersApi.update(id, data);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		if (result.data?.folder) {
			folders = folders.map((f) => (f.id === id ? result.data!.folder : f));
		}

		return result.data?.folder || null;
	},

	async deleteFolder(id: string) {
		const result = await foldersApi.delete(id);

		if (result.error) {
			error = result.error.message;
			return false;
		}

		folders = folders.filter((f) => f.id !== id);

		if (selectedFolderId === id) {
			const inbox = folders.find((f) => f.type === 'inbox');
			selectedFolderId = inbox?.id || folders[0]?.id || null;
		}

		return true;
	},

	async toggleHide(id: string) {
		const result = await foldersApi.toggleHide(id);

		if (result.error) {
			error = result.error.message;
			return null;
		}

		if (result.data?.folder) {
			folders = folders.map((f) => (f.id === id ? result.data!.folder : f));
		}

		return result.data?.folder || null;
	},

	getFolderById(id: string) {
		return folders.find((f) => f.id === id);
	},

	getFoldersByAccount(accountId: string) {
		return folders.filter((f) => f.accountId === accountId);
	},

	updateUnreadCount(folderId: string, delta: number) {
		folders = folders.map((f) =>
			f.id === folderId ? { ...f, unreadCount: Math.max(0, f.unreadCount + delta) } : f
		);
	},
};
