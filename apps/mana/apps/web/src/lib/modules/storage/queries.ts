/**
 * Reactive queries & pure helpers for Storage — uses Dexie liveQuery on the unified DB.
 *
 * Uses table names: files, storageFolders, storageTags, fileTags.
 */

import { liveQuery } from 'dexie';
import { db } from '$lib/data/database';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalFile, LocalFolder, LocalFileTag } from './types';

// ─── Shared Types (inline to avoid @storage/shared dependency) ───

export interface StorageFile {
	id: string;
	name: string;
	originalName: string;
	mimeType: string;
	size: number;
	storagePath: string;
	storageKey: string;
	parentFolderId: string | null;
	currentVersion: number;
	isFavorite: boolean;
	isDeleted: boolean;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface StorageFolder {
	id: string;
	name: string;
	description: string | null;
	color: string | null;
	parentFolderId: string | null;
	path: string;
	depth: number;
	isFavorite: boolean;
	isDeleted: boolean;
	deletedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface StorageTag {
	id: string;
	name: string;
	color: string | null;
	createdAt: string;
}

// ─── Type Converters ───────────────────────────────────────

export function toFile(local: LocalFile): StorageFile {
	return {
		id: local.id,
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

export function toFolder(local: LocalFolder): StorageFolder {
	return {
		id: local.id,
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

export function toTag(local: {
	id: string;
	name: string;
	color?: string | null;
	createdAt?: string;
}): StorageTag {
	return {
		id: local.id,
		name: local.name,
		color: local.color ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/** All non-deleted files, sorted by name. Auto-updates on any change. */
export function useAllFiles() {
	return liveQuery(async () => {
		const locals = await db.table<LocalFile>('files').toArray();
		const visible = locals.filter((f) => !f.isDeleted && !f.deletedAt);
		// name + originalName are encrypted on disk; sort needs plaintext.
		const decrypted = await decryptRecords('files', visible);
		return decrypted.map(toFile).sort((a, b) => a.name.localeCompare(b.name));
	});
}

/** All non-deleted folders, sorted by name. Auto-updates on any change. */
export function useAllFolders() {
	return liveQuery(async () => {
		const locals = await db.table<LocalFolder>('storageFolders').toArray();
		return locals
			.filter((f) => !f.isDeleted && !f.deletedAt)
			.map(toFolder)
			.sort((a, b) => a.name.localeCompare(b.name));
	});
}

// Tags: use shared global tags from @mana/shared-stores
export { useAllTags as useAllStorageTags } from '@mana/shared-stores';

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

/** Get deleted files. */
export function getDeletedFiles(files: StorageFile[]): StorageFile[] {
	return files.filter((f) => f.isDeleted);
}

/** Get deleted folders. */
export function getDeletedFolders(folders: StorageFolder[]): StorageFolder[] {
	return folders.filter((f) => f.isDeleted);
}

/** Search files and folders by name query. */
export function searchItems(
	files: StorageFile[],
	folders: StorageFolder[],
	query: string
): { files: StorageFile[]; folders: StorageFolder[] } {
	const q = query.toLowerCase();
	return {
		files: files.filter((f) => f.name.toLowerCase().includes(q)),
		folders: folders.filter((f) => f.name.toLowerCase().includes(q)),
	};
}

/** Format file size for display. */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(1024));
	return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
