/**
 * Picture module types for the unified Mana app.
 */

import type { BaseRecord } from '@mana/local-store';
import type { VisibilityLevel } from '@mana/shared-privacy';

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
	/**
	 * @deprecated Use `visibility` instead. Kept for the soft-migration
	 * window — will be dropped in the hard follow-up once no reader
	 * references it. See docs/plans/visibility-system.md §M3.
	 */
	isPublic?: boolean;
	visibility?: VisibilityLevel;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
	unlistedToken?: string;
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
	/**
	 * Back-reference to `wardrobeGarments.id` when this image was produced
	 * by the solo-garment try-on flow (M4.1). Symmetric to
	 * wardrobeOutfitId — pictures are at most one of the two. Lets the
	 * garment detail view list its own try-ons without scanning by
	 * `referenceImageIds` containment.
	 */
	wardrobeGarmentId?: string | null;
	/**
	 * Back-reference to `comicStories.id` when this image was produced as
	 * a comic panel (docs/plans/comic-module.md). The canonical reading
	 * order lives on the story in `panelImageIds`; this field lets the
	 * Picture-gallery show a "Panel von Comic X" chip without having to
	 * load every story to check which one owns the image. Plaintext FK.
	 */
	comicStoryId?: string | null;
	/**
	 * Zero-based reading position inside the owning story at write time.
	 * Denormalised copy of `panelImageIds.indexOf(imageId)` — used for
	 * the gallery's "Panel 3" label. Goes stale if the story is
	 * reordered (M3+); the Detail-View re-reads from `panelImageIds` so
	 * the canonical order is never wrong even if this drifts.
	 */
	comicPanelIndex?: number | null;
}

export interface LocalBoard extends BaseRecord {
	name: string;
	description?: string | null;
	thumbnailUrl?: string | null;
	canvasWidth: number;
	canvasHeight: number;
	backgroundColor: string;
	/**
	 * @deprecated Use `visibility` instead. Kept during the M3 soft
	 * migration — dropped in the hard follow-up.
	 */
	isPublic?: boolean;
	visibility?: VisibilityLevel;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
	unlistedToken?: string;
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
	visibility: VisibilityLevel;
	isFavorite: boolean;
	downloadCount: number;
	rating?: number;
	isArchived?: boolean;
	generationId?: string;
	sourceImageId?: string;
	referenceImageIds?: string[];
	generationMode?: ImageGenerationMode;
	wardrobeOutfitId?: string;
	wardrobeGarmentId?: string;
	comicStoryId?: string;
	comicPanelIndex?: number;
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
	visibility: VisibilityLevel;
	createdAt: string;
	updatedAt: string;
}

export interface BoardWithCount extends Board {
	itemCount: number;
}
