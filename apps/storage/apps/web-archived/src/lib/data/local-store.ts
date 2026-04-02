/**
 * Storage — Local-First Data Layer
 *
 * File/folder metadata, tags, and favorites stored locally.
 * Actual file upload/download, shares, and versions remain server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestFolders, guestTags } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalFile extends BaseRecord {
	name: string;
	originalName: string;
	mimeType: string;
	size: number;
	storagePath: string;
	storageKey: string;
	parentFolderId?: string | null;
	currentVersion: number;
	isFavorite: boolean;
	isDeleted: boolean;
	checksum?: string | null;
	thumbnailPath?: string | null;
}

export interface LocalFolder extends BaseRecord {
	name: string;
	description?: string | null;
	color?: string | null;
	parentFolderId?: string | null;
	path: string;
	depth: number;
	isFavorite: boolean;
	isDeleted: boolean;
}

export interface LocalTag extends BaseRecord {
	name: string;
	color?: string | null;
}

export interface LocalFileTag extends BaseRecord {
	fileId: string;
	tagId: string;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const storageStore = createLocalStore({
	appId: 'storage',
	collections: [
		{
			name: 'files',
			indexes: ['parentFolderId', 'mimeType', 'isFavorite', 'isDeleted', 'name'],
		},
		{
			name: 'folders',
			indexes: ['parentFolderId', 'path', 'depth', 'isFavorite', 'isDeleted'],
			guestSeed: guestFolders,
		},
		{
			name: 'tags',
			indexes: ['name'],
			guestSeed: guestTags,
		},
		{
			name: 'fileTags',
			indexes: ['fileId', 'tagId', '[fileId+tagId]'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const fileCollection = storageStore.collection<LocalFile>('files');
export const folderCollection = storageStore.collection<LocalFolder>('folders');
export const tagCollection = storageStore.collection<LocalTag>('tags');
export const fileTagCollection = storageStore.collection<LocalFileTag>('fileTags');
