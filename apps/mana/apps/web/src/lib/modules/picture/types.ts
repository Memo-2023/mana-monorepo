/**
 * Picture module types for the unified Mana app.
 */

import type { BaseRecord } from '@mana/local-store';

/**
 * How the image was created. 'text' is the classic prompt-only
 * generation via /picture/generate; 'reference' is a multi-image edit
 * via /picture/generate-with-reference (plan M3) — the latter carries
 * `referenceImageIds` pointing at the meImages that fed the edit.
 */
export type ImageGenerationMode = 'text' | 'reference';

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
	isArchived?: boolean;
	generationId?: string | null;
	sourceImageId?: string | null;
	/** mana-media ids of the me-images that fed a reference-edit. */
	referenceImageIds?: string[] | null;
	generationMode?: ImageGenerationMode | null;
	/**
	 * Back-reference to `wardrobeOutfits.id` when this image was produced
	 * by the Wardrobe try-on flow (plan docs/plans/wardrobe-module.md).
	 * Lets the outfit detail view query all historical try-ons without
	 * an extra table. Plaintext — it's an FK.
	 */
	wardrobeOutfitId?: string | null;
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
	isArchived?: boolean;
	generationId?: string;
	sourceImageId?: string;
	referenceImageIds?: string[];
	generationMode?: ImageGenerationMode;
	wardrobeOutfitId?: string;
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
