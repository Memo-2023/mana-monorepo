/**
 * Reactive Queries & Pure Helpers for Storage
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	fileCollection,
	folderCollection,
	tagCollection,
	fileTagCollection,
	type LocalFile,
	type LocalFolder,
	type LocalTag,
	type LocalFileTag,
} from './local-store';
import type { StorageFile, StorageFolder, Tag } from '$lib/api/client';

// ─── Type Converters ──────────────────────────────────────

/** Convert LocalFile (IndexedDB) to StorageFile type. */
export function toFile(local: LocalFile): StorageFile {
	return {
		id: local.id,
		userId: 'local',
		name: local.name,
		originalName: local.originalName,
		mimeType: local.mimeType,
		size: local.size,
		storagePath: local.storagePath,
		storageKey: local.storageKey,
		parentFolderId: local.parentFolderId ?? null,
		currentVersion: local.currentVersion,
		isFavorite: local.isFavorite,
		isDeleted: local.isDeleted,
		deletedAt: null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert LocalFolder (IndexedDB) to StorageFolder type. */
export function toFolder(local: LocalFolder): StorageFolder {
	return {
		id: local.id,
		userId: 'local',
		name: local.name,
		description: local.description ?? null,
		color: local.color ?? null,
		parentFolderId: local.parentFolderId ?? null,
		path: local.path,
		depth: local.depth,
		isFavorite: local.isFavorite,
		isDeleted: local.isDeleted,
		deletedAt: null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert LocalTag (IndexedDB) to Tag type. */
export function toTag(local: LocalTag): Tag {
	return {
		id: local.id,
		userId: 'local',
		name: local.name,
		color: local.color ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ────────

/** All non-deleted files, sorted by name. Auto-updates on any change. */
export function useAllFiles() {
	return useLiveQueryWithDefault(async () => {
		const locals = await fileCollection.getAll();
		return locals
			.filter((f) => !f.isDeleted)
			.map(toFile)
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [] as StorageFile[]);
}

/** All non-deleted folders, sorted by name. Auto-updates on any change. */
export function useAllFolders() {
	return useLiveQueryWithDefault(async () => {
		const locals = await folderCollection.getAll();
		return locals
			.filter((f) => !f.isDeleted)
			.map(toFolder)
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [] as StorageFolder[]);
}

/** All tags, sorted by name. Auto-updates on any change. */
export function useAllStorageTags() {
	return useLiveQueryWithDefault(async () => {
		const locals = await tagCollection.getAll();
		return locals.map(toTag).sort((a, b) => a.name.localeCompare(b.name));
	}, [] as Tag[]);
}

// ─── Pure Helper Functions (for $derived) ─────────────────

/** Get files in a specific folder (null = root). */
export function getFilesInFolder(files: StorageFile[], folderId: string | null): StorageFile[] {
	return files.filter((f) => (f.parentFolderId ?? null) === folderId);
}

/** Get subfolders of a specific folder (null = root). */
export function getFoldersInFolder(
	folders: StorageFolder[],
	parentFolderId: string | null
): StorageFolder[] {
	return folders.filter((f) => (f.parentFolderId ?? null) === parentFolderId);
}

/** Get favorite files. */
export function getFavoriteFiles(files: StorageFile[]): StorageFile[] {
	return files.filter((f) => f.isFavorite);
}

/** Get favorite folders. */
export function getFavoriteFolders(folders: StorageFolder[]): StorageFolder[] {
	return folders.filter((f) => f.isFavorite);
}

/** Find a folder by ID. */
export function findFolderById(folders: StorageFolder[], id: string): StorageFolder | undefined {
	return folders.find((f) => f.id === id);
}
