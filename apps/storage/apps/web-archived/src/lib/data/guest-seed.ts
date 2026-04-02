/**
 * Guest seed data for the Storage app.
 *
 * Provides demo folders and tags for the onboarding experience.
 */

import type { LocalFolder, LocalTag } from './local-store';

export const guestFolders: LocalFolder[] = [
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
];

export const guestTags: LocalTag[] = [
	{
		id: 'tag-important',
		name: 'Wichtig',
		color: '#ef4444',
	},
	{
		id: 'tag-work',
		name: 'Arbeit',
		color: '#3b82f6',
	},
	{
		id: 'tag-personal',
		name: 'Privat',
		color: '#22c55e',
	},
];
