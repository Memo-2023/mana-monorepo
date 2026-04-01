/**
 * Picture module types for the unified ManaCore app.
 */

import type { BaseRecord } from '@manacore/local-store';

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

export interface LocalPictureTag extends BaseRecord {
	name: string;
	color?: string | null;
}

export interface LocalImageTag extends BaseRecord {
	imageId: string;
	tagId: string;
}

export type ViewMode = 'single' | 'grid3' | 'grid5';

export interface Image {
	id: string;
	prompt: string;
	negativePrompt?: string;
	model?: string;
	style?: string;
	publicUrl?: string;
	storagePath: string;
	filename: string;
	format?: string;
	width?: number;
	height?: number;
	fileSize?: number;
	blurhash?: string;
	isPublic: boolean;
	isFavorite: boolean;
	downloadCount: number;
	rating?: number;
	archivedAt?: string;
	generationId?: string;
	sourceImageId?: string;
	createdAt: string;
	updatedAt: string;
}

export interface Board {
	id: string;
	name: string;
	description?: string;
	thumbnailUrl?: string;
	canvasWidth: number;
	canvasHeight: number;
	backgroundColor: string;
	isPublic: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface BoardWithCount extends Board {
	itemCount: number;
}
