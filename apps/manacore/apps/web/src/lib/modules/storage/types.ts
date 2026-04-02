/**
 * Storage module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

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

export interface LocalFileTag extends BaseRecord {
	fileId: string;
	tagId: string;
}
