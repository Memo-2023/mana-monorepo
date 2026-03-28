/**
 * Files Store — Mutation-Only (Local-First reads via queries.ts)
 *
 * Reads are handled by useLiveQuery hooks in queries.ts.
 * This store handles writes, selection state, view mode, and
 * server-side operations (upload, download, share) that remain API-based.
 */

import { filesApi, foldersApi } from '$lib/api/client';
import type { StorageFile, StorageFolder } from '$lib/api/client';
import { trackEvent, StorageEvents } from '@manacore/shared-utils/analytics';
import {
	fileCollection,
	folderCollection,
	type LocalFile,
	type LocalFolder,
} from '$lib/data/local-store';
import { toFile, toFolder } from '$lib/data/queries';

let loading = $state(false);
let error = $state<string | null>(null);
let viewMode = $state<'grid' | 'list'>('grid');
let selectedFileIds = $state<Set<string>>(new Set());
let selectedFolderIds = $state<Set<string>>(new Set());
let currentFolderId = $state<string | null>(null);

export const filesStore = {
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get viewMode() {
		return viewMode;
	},
	get selectedFileIds() {
		return selectedFileIds;
	},
	get selectedFolderIds() {
		return selectedFolderIds;
	},
	get selectionCount() {
		return selectedFileIds.size + selectedFolderIds.size;
	},
	get currentFolderId() {
		return currentFolderId;
	},

	toggleFileSelection(id: string) {
		const next = new Set(selectedFileIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedFileIds = next;
	},

	toggleFolderSelection(id: string) {
		const next = new Set(selectedFolderIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedFolderIds = next;
	},

	selectAllFromLists(files: StorageFile[], folders: StorageFolder[]) {
		selectedFileIds = new Set(files.map((f) => f.id));
		selectedFolderIds = new Set(folders.map((f) => f.id));
	},

	clearSelection() {
		selectedFileIds = new Set();
		selectedFolderIds = new Set();
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

	setCurrentFolder(folderId: string | null) {
		currentFolderId = folderId;
		selectedFileIds = new Set();
		selectedFolderIds = new Set();
	},

	// ─── Server-side operations (remain API-based) ────────

	async uploadFile(file: File, parentFolderId?: string | null) {
		const result = await filesApi.upload(file, parentFolderId ?? currentFolderId ?? undefined);
		if (result.data) {
			// Also insert into local store for liveQuery reactivity
			const localFile: LocalFile = {
				id: result.data.id,
				name: result.data.name,
				originalName: result.data.originalName,
				mimeType: result.data.mimeType,
				size: result.data.size,
				storagePath: result.data.storagePath,
				storageKey: result.data.storageKey,
				parentFolderId: result.data.parentFolderId,
				currentVersion: result.data.currentVersion,
				isFavorite: result.data.isFavorite,
				isDeleted: result.data.isDeleted,
			};
			await fileCollection.insert(localFile);
			trackEvent('file_uploaded', { size: Math.round(file.size / 1024) });
		}
		return result;
	},

	async createFolder(name: string, color?: string) {
		const result = await foldersApi.create(name, currentFolderId ?? undefined, color);
		if (result.data) {
			// Also insert into local store for liveQuery reactivity
			const localFolder: LocalFolder = {
				id: result.data.id,
				name: result.data.name,
				description: result.data.description,
				color: result.data.color,
				parentFolderId: result.data.parentFolderId,
				path: result.data.path,
				depth: result.data.depth,
				isFavorite: result.data.isFavorite,
				isDeleted: result.data.isDeleted,
			};
			await folderCollection.insert(localFolder);
			trackEvent('folder_created');
		}
		return result;
	},

	async deleteFile(id: string) {
		const result = await filesApi.delete(id);
		if (!result.error) {
			await fileCollection.update(id, { isDeleted: true });
			StorageEvents.fileDeleted();
		}
		return result;
	},

	async deleteFolder(id: string) {
		const result = await foldersApi.delete(id);
		if (!result.error) {
			await folderCollection.update(id, { isDeleted: true });
			StorageEvents.folderDeleted();
		}
		return result;
	},

	async deleteSelected(files: StorageFile[], folders: StorageFolder[]) {
		const fileIds = [...selectedFileIds];
		const folderIds = [...selectedFolderIds];

		const results = await Promise.all([
			...fileIds.map((id) => filesApi.delete(id)),
			...folderIds.map((id) => foldersApi.delete(id)),
		]);

		const hasErrors = results.some((r) => r.error);
		if (!hasErrors) {
			for (const id of fileIds) {
				await fileCollection.update(id, { isDeleted: true });
			}
			for (const id of folderIds) {
				await folderCollection.update(id, { isDeleted: true });
			}
		}

		selectedFileIds = new Set();
		selectedFolderIds = new Set();
		return { deleted: fileIds.length + folderIds.length, hasErrors };
	},

	async toggleFileFavorite(id: string) {
		const result = await filesApi.toggleFavorite(id);
		if (result.data) {
			await fileCollection.update(id, { isFavorite: result.data.isFavorite });
			StorageEvents.fileFavorited(result.data.isFavorite);
		}
		return result;
	},

	async toggleFolderFavorite(id: string) {
		const result = await foldersApi.toggleFavorite(id);
		if (result.data) {
			await folderCollection.update(id, { isFavorite: result.data.isFavorite });
			StorageEvents.folderFavorited(result.data.isFavorite);
		}
		return result;
	},

	async renameFile(id: string, name: string) {
		const result = await filesApi.rename(id, name);
		if (result.data) {
			await fileCollection.update(id, { name: result.data.name });
		}
		return result;
	},

	async renameFolder(id: string, name: string) {
		const result = await foldersApi.rename(id, name);
		if (result.data) {
			await folderCollection.update(id, { name: result.data.name });
		}
		return result;
	},

	async moveFile(id: string, targetFolderId: string) {
		const result = await filesApi.move(id, targetFolderId);
		if (!result.error) {
			await fileCollection.update(id, { parentFolderId: targetFolderId });
		}
		return result;
	},

	async moveFolder(id: string, targetFolderId: string) {
		const result = await foldersApi.move(id, targetFolderId);
		if (!result.error) {
			await folderCollection.update(id, { parentFolderId: targetFolderId });
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
