/**
 * Picture — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * Images metadata, boards, board items, and tags are stored locally.
 * Image generation, upload, and explore remain server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestBoards, guestBoardItems, guestTags } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalImage extends BaseRecord {
	prompt: string;
	negativePrompt?: string | null;
	model?: string | null;
	style?: string | null;
	publicUrl?: string | null;
	storagePath: string;
	filename: string;
	format?: string | null;
	width?: number | null;
	height?: number | null;
	fileSize?: number | null;
	blurhash?: string | null;
	isPublic: boolean;
	isFavorite: boolean;
	downloadCount: number;
	rating?: number | null;
	archivedAt?: string | null;
	generationId?: string | null;
	sourceImageId?: string | null;
}

export interface LocalBoard extends BaseRecord {
	name: string;
	description?: string | null;
	thumbnailUrl?: string | null;
	canvasWidth: number;
	canvasHeight: number;
	backgroundColor: string;
	isPublic: boolean;
}

export interface LocalBoardItem extends BaseRecord {
	boardId: string;
	itemType: 'image' | 'text';
	imageId?: string | null;
	textContent?: string | null;
	fontSize?: number | null;
	color?: string | null;
	positionX: number;
	positionY: number;
	scaleX: number;
	scaleY: number;
	rotation: number;
	zIndex: number;
	opacity: number;
	width?: number | null;
	height?: number | null;
	properties: Record<string, unknown>;
}

export interface LocalTag extends BaseRecord {
	name: string;
	color?: string | null;
}

export interface LocalImageTag extends BaseRecord {
	imageId: string;
	tagId: string;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const pictureStore = createLocalStore({
	appId: 'picture',
	collections: [
		{
			name: 'images',
			indexes: ['isFavorite', 'isPublic', 'archivedAt', 'prompt'],
		},
		{
			name: 'boards',
			indexes: ['isPublic'],
			guestSeed: guestBoards,
		},
		{
			name: 'boardItems',
			indexes: ['boardId', 'itemType', 'zIndex', '[boardId+zIndex]'],
			guestSeed: guestBoardItems,
		},
		{
			name: 'tags',
			indexes: ['name'],
			guestSeed: guestTags,
		},
		{
			name: 'imageTags',
			indexes: ['imageId', 'tagId', '[imageId+tagId]'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const imageCollection = pictureStore.collection<LocalImage>('images');
export const boardCollection = pictureStore.collection<LocalBoard>('boards');
export const boardItemCollection = pictureStore.collection<LocalBoardItem>('boardItems');
export const tagCollection = pictureStore.collection<LocalTag>('tags');
export const imageTagCollection = pictureStore.collection<LocalImageTag>('imageTags');
