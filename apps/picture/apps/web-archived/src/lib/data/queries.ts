/**
 * Reactive Queries & Pure Helpers for Picture
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import {
	imageCollection,
	boardCollection,
	boardItemCollection,
	imageTagCollection,
	type LocalImage,
	type LocalBoard,
	type LocalBoardItem,
} from './local-store';
import type { Image } from '$lib/api/images';
import type { Board, BoardWithCount } from '$lib/api/boards';

// ─── Type Converters ──────────────────────────────────────

/** Convert LocalImage (IndexedDB) to the Image type used by components. */
export function toImage(local: LocalImage): Image {
	return {
		id: local.id,
		userId: 'local',
		prompt: local.prompt,
		negativePrompt: local.negativePrompt ?? undefined,
		model: local.model ?? undefined,
		style: local.style ?? undefined,
		publicUrl: local.publicUrl ?? undefined,
		storagePath: local.storagePath,
		filename: local.filename,
		format: local.format ?? undefined,
		width: local.width ?? undefined,
		height: local.height ?? undefined,
		fileSize: local.fileSize ?? undefined,
		blurhash: local.blurhash ?? undefined,
		isPublic: local.isPublic,
		isFavorite: local.isFavorite,
		downloadCount: local.downloadCount,
		rating: local.rating ?? undefined,
		archivedAt: local.archivedAt ?? undefined,
		generationId: local.generationId ?? undefined,
		sourceImageId: local.sourceImageId ?? undefined,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Convert LocalBoard (IndexedDB) to Board type. */
export function toBoard(local: LocalBoard): Board {
	return {
		id: local.id,
		userId: 'local',
		name: local.name,
		description: local.description ?? undefined,
		thumbnailUrl: local.thumbnailUrl ?? undefined,
		canvasWidth: local.canvasWidth,
		canvasHeight: local.canvasHeight,
		backgroundColor: local.backgroundColor,
		isPublic: local.isPublic,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Query Hooks (call during component init) ────────

/** All non-archived images, sorted by createdAt desc. Auto-updates on any change. */
export function useAllImages() {
	return useLiveQueryWithDefault(async () => {
		const locals = await imageCollection.getAll();
		return locals
			.filter((img) => !img.archivedAt)
			.map(toImage)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}, [] as Image[]);
}

/** All archived images, sorted by createdAt desc. Auto-updates on any change. */
export function useArchivedImages() {
	return useLiveQueryWithDefault(async () => {
		const locals = await imageCollection.getAll();
		return locals
			.filter((img) => !!img.archivedAt)
			.map(toImage)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	}, [] as Image[]);
}

/** All boards with item counts, sorted by updatedAt desc. Auto-updates on any change. */
export function useAllBoards() {
	return useLiveQueryWithDefault(async () => {
		const locals = await boardCollection.getAll();
		const allItems = await boardItemCollection.getAll();

		// Count items per board
		const itemCounts = new Map<string, number>();
		for (const item of allItems) {
			itemCounts.set(item.boardId, (itemCounts.get(item.boardId) || 0) + 1);
		}

		return locals
			.map(
				(local): BoardWithCount => ({
					...toBoard(local),
					itemCount: itemCounts.get(local.id) || 0,
				})
			)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [] as BoardWithCount[]);
}

/** All image-tag associations. Auto-updates on any change. */
export function useAllImageTags() {
	return useLiveQueryWithDefault(
		async () => {
			return await imageTagCollection.getAll();
		},
		[] as { id: string; imageId: string; tagId: string }[]
	);
}

// ─── Pure Helper Functions (for $derived) ─────────────────

/** Filter images by favorites only. */
export function getFavoriteImages(images: Image[]): Image[] {
	return images.filter((img) => img.isFavorite);
}

/** Filter images by tag IDs using image-tag associations. */
export function getImagesByTags(
	images: Image[],
	imageTags: { imageId: string; tagId: string }[],
	selectedTagIds: string[]
): Image[] {
	if (selectedTagIds.length === 0) return images;
	const imageIdsWithTags = new Set(
		imageTags.filter((it) => selectedTagIds.includes(it.tagId)).map((it) => it.imageId)
	);
	return images.filter((img) => imageIdsWithTags.has(img.id));
}

/** Find an image by ID. */
export function findImageById(images: Image[], id: string): Image | undefined {
	return images.find((img) => img.id === id);
}

/** Find a board by ID. */
export function findBoardById(boards: BoardWithCount[], id: string): BoardWithCount | undefined {
	return boards.find((b) => b.id === id);
}
