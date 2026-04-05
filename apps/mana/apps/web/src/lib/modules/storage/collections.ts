/**
 * Storage module — collection accessors and guest seed data.
 *
 * Uses table names from the unified DB: files, storageFolders, storageTags, fileTags.
 */

import { db } from '$lib/data/database';
import type { LocalFile, LocalFolder, LocalFileTag } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const fileTable = db.table<LocalFile>('files');
export const storageFolderTable = db.table<LocalFolder>('storageFolders');
export const fileTagTable = db.table<LocalFileTag>('fileTags');

// ─── Guest Seed ────────────────────────────────────────────

export const STORAGE_GUEST_SEED = {
	storageFolders: [
		{
			id: 'folder-documents',
			name: 'Dokumente',
			description: 'Wichtige Dokumente',
			color: '#3b82f6',
			path: '/folder-documents',
			depth: 0,
			isFavorite: false,
			isDeleted: false,
		},
		{
			id: 'folder-photos',
			name: 'Fotos',
			description: 'Fotosammlung',
			color: '#22c55e',
			path: '/folder-photos',
			depth: 0,
			isFavorite: true,
			isDeleted: false,
		},
		{
			id: 'folder-music',
			name: 'Musik',
			description: 'Audio-Dateien',
			color: '#a855f7',
			path: '/folder-music',
			depth: 0,
			isFavorite: false,
			isDeleted: false,
		},
	],
};
