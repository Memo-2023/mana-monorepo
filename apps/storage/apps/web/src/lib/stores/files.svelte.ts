/**
 * Files Store - Manages files and folders state
 */

import { filesApi, foldersApi } from '$lib/api/client';
import type { StorageFile, StorageFolder } from '$lib/api/client';
import { trackEvent, StorageEvents } from '@manacore/shared-utils/analytics';

let files = $state<StorageFile[]>([]);
let folders = $state<StorageFolder[]>([]);
let currentFolder = $state<StorageFolder | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let viewMode = $state<'grid' | 'list'>('grid');

export const filesStore = {
	get files() {
		return files;
	},
	get folders() {
		return folders;
	},
	get currentFolder() {
		return currentFolder;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get viewMode() {
		return viewMode;
	},

	setViewMode(mode: 'grid' | 'list') {
		viewMode = mode;
		StorageEvents.viewModeChanged(mode);
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('storage-view-mode', mode);
		}
	},

	initViewMode() {
		if (typeof localStorage !== 'undefined') {
			const saved = localStorage.getItem('storage-view-mode');
			if (saved === 'grid' || saved === 'list') {
				viewMode = saved;
			}
		}
	},

	async loadFolder(folderId?: string) {
		loading = true;
		error = null;

		try {
			if (folderId) {
				const result = await foldersApi.get(folderId);
				if (result.error) {
					error = result.error;
					return;
				}
				if (result.data) {
					currentFolder = result.data.folder;
					files = result.data.files;
					folders = result.data.subfolders;
				}
			} else {
				// Load root
				currentFolder = null;
				const [filesResult, foldersResult] = await Promise.all([
					filesApi.list(),
					foldersApi.list(),
				]);

				if (filesResult.error) {
					error = filesResult.error;
					return;
				}
				if (foldersResult.error) {
					error = foldersResult.error;
					return;
				}

				files = filesResult.data || [];
				folders = foldersResult.data || [];
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	},

	async uploadFile(file: File) {
		const result = await filesApi.upload(file, currentFolder?.id);
		if (result.data) {
			files = [...files, result.data];
			trackEvent('file_uploaded', { size: Math.round(file.size / 1024) });
		}
		return result;
	},

	async createFolder(name: string, color?: string) {
		const result = await foldersApi.create(name, currentFolder?.id, color);
		if (result.data) {
			folders = [...folders, result.data];
			trackEvent('folder_created');
		}
		return result;
	},

	async deleteFile(id: string) {
		const result = await filesApi.delete(id);
		if (!result.error) {
			files = files.filter((f) => f.id !== id);
			StorageEvents.fileDeleted();
		}
		return result;
	},

	async deleteFolder(id: string) {
		const result = await foldersApi.delete(id);
		if (!result.error) {
			folders = folders.filter((f) => f.id !== id);
			StorageEvents.folderDeleted();
		}
		return result;
	},

	async toggleFileFavorite(id: string) {
		const result = await filesApi.toggleFavorite(id);
		if (result.data) {
			files = files.map((f) => (f.id === id ? result.data! : f));
			StorageEvents.fileFavorited(result.data.isFavorite);
		}
		return result;
	},

	async toggleFolderFavorite(id: string) {
		const result = await foldersApi.toggleFavorite(id);
		if (result.data) {
			folders = folders.map((f) => (f.id === id ? result.data! : f));
			StorageEvents.folderFavorited(result.data.isFavorite);
		}
		return result;
	},

	async renameFile(id: string, name: string) {
		const result = await filesApi.rename(id, name);
		if (result.data) {
			files = files.map((f) => (f.id === id ? result.data! : f));
		}
		return result;
	},

	async renameFolder(id: string, name: string) {
		const result = await foldersApi.rename(id, name);
		if (result.data) {
			folders = folders.map((f) => (f.id === id ? result.data! : f));
		}
		return result;
	},

	async moveFile(id: string, targetFolderId: string) {
		const result = await filesApi.move(id, targetFolderId);
		if (!result.error) {
			files = files.filter((f) => f.id !== id);
		}
		return result;
	},

	async moveFolder(id: string, targetFolderId: string) {
		const result = await foldersApi.move(id, targetFolderId);
		if (!result.error) {
			folders = folders.filter((f) => f.id !== id);
		}
		return result;
	},

	async downloadFile(id: string, filename: string) {
		const blob = await filesApi.download(id);
		if (blob) {
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			StorageEvents.fileDownloaded();
			return true;
		}
		return false;
	},
};
