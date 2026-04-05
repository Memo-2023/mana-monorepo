/**
 * Files Store — Mutation-Only (Local-First reads via queries.ts)
 *
 * Reads are handled by liveQuery hooks in queries.ts.
 * This store handles writes, selection state, and view mode.
 * Server-side operations (upload, download, share) are not available in the unified app.
 */

import { fileTable, storageFolderTable } from '../collections';
import { toFile, toFolder } from '../queries';
import type { StorageFile, StorageFolder } from '../queries';
import type { LocalFile, LocalFolder } from '../types';
import { StorageEvents } from '@mana/shared-utils/analytics';

let viewMode = $state<'grid' | 'list'>('grid');
let selectedFileIds = $state<Set<string>>(new Set());
let selectedFolderIds = $state<Set<string>>(new Set());
let currentFolderId = $state<string | null>(null);

export const filesStore = {
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

	// ─── Local-First write operations ────────────────────────

	async createFolder(name: string, color?: string) {
		const now = new Date().toISOString();
		const parentId = currentFolderId;

		// Build path
		let path = `/${crypto.randomUUID().slice(0, 8)}`;
		let depth = 0;
		if (parentId) {
			const parent = await storageFolderTable.get(parentId);
			if (parent) {
				path = `${parent.path}/${name.toLowerCase().replace(/\s+/g, '-')}`;
				depth = parent.depth + 1;
			}
		}

		const newFolder: LocalFolder = {
			id: crypto.randomUUID(),
			name,
			description: null,
			color: color ?? null,
			parentFolderId: parentId,
			path,
			depth,
			isFavorite: false,
			isDeleted: false,
		};

		await storageFolderTable.add(newFolder);
		return toFolder(newFolder);
	},

	async renameFile(id: string, name: string) {
		await fileTable.update(id, {
			name,
			updatedAt: new Date().toISOString(),
		});
	},

	async renameFolder(id: string, name: string) {
		await storageFolderTable.update(id, {
			name,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleFileFavorite(id: string) {
		const file = await fileTable.get(id);
		if (file) {
			const newFav = !file.isFavorite;
			await fileTable.update(id, {
				isFavorite: newFav,
				updatedAt: new Date().toISOString(),
			});
			StorageEvents.fileFavorited(newFav);
			return newFav;
		}
		return false;
	},

	async toggleFolderFavorite(id: string) {
		const folder = await storageFolderTable.get(id);
		if (folder) {
			const newFav = !folder.isFavorite;
			await storageFolderTable.update(id, {
				isFavorite: newFav,
				updatedAt: new Date().toISOString(),
			});
			StorageEvents.folderFavorited(newFav);
			return newFav;
		}
		return false;
	},

	async deleteFile(id: string) {
		await fileTable.update(id, {
			isDeleted: true,
			updatedAt: new Date().toISOString(),
		});
		StorageEvents.fileDeleted();
	},

	async deleteFolder(id: string) {
		await storageFolderTable.update(id, {
			isDeleted: true,
			updatedAt: new Date().toISOString(),
		});
		StorageEvents.folderDeleted();
	},

	async restoreFile(id: string) {
		await fileTable.update(id, {
			isDeleted: false,
			updatedAt: new Date().toISOString(),
		});
	},

	async restoreFolder(id: string) {
		await storageFolderTable.update(id, {
			isDeleted: false,
			updatedAt: new Date().toISOString(),
		});
	},

	async permanentDeleteFile(id: string) {
		await fileTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async permanentDeleteFolder(id: string) {
		await storageFolderTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async moveFile(id: string, targetFolderId: string) {
		await fileTable.update(id, {
			parentFolderId: targetFolderId,
			updatedAt: new Date().toISOString(),
		});
	},

	async moveFolder(id: string, targetFolderId: string) {
		await storageFolderTable.update(id, {
			parentFolderId: targetFolderId,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteSelected() {
		const now = new Date().toISOString();
		for (const id of selectedFileIds) {
			await fileTable.update(id, { isDeleted: true, updatedAt: now });
		}
		for (const id of selectedFolderIds) {
			await storageFolderTable.update(id, { isDeleted: true, updatedAt: now });
		}
		const count = selectedFileIds.size + selectedFolderIds.size;
		selectedFileIds = new Set();
		selectedFolderIds = new Set();
		return count;
	},
};
