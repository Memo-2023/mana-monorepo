/**
 * Comic module — read-side queries.
 *
 * Stories are space-scoped: switching the active space swaps the
 * visible pool automatically via `scopedForModule`. Panel history
 * lives in `picture.images` filtered by `comicStoryId` — kept on the
 * picture side rather than here (decision #1 in the plan: one table
 * in this module, panels are picture rows).
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalImage, Image } from '$lib/modules/picture/types';
import { toImage } from '$lib/modules/picture/queries';
import { toStory, type ComicStory, type ComicStyle, type LocalComicStory } from './types';

/** All non-archived, non-deleted stories in the active space, newest first. */
export function useAllStories() {
	return useLiveQueryWithDefault<ComicStory[]>(async () => {
		const locals = await scopedForModule<LocalComicStory, string>(
			'comic',
			'comicStories'
		).toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('comicStories', visible);
		return decrypted.map(toStory);
	}, [] as ComicStory[]);
}

/** Stories filtered by style — used by the style-tabs view in M5 list tool. */
export function useStoriesByStyle(style: ComicStyle) {
	return useLiveQueryWithDefault<ComicStory[]>(async () => {
		const locals = await scopedForModule<LocalComicStory, string>('comic', 'comicStories')
			.and((row) => row.style === style)
			.toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('comicStories', visible);
		return decrypted.map(toStory);
	}, [] as ComicStory[]);
}

/** A single story by id, live-updating. Null while loading / missing. */
export function useStory(id: string | null) {
	return useLiveQueryWithDefault<ComicStory | null>(async () => {
		if (!id) return null;
		const locals = await scopedForModule<LocalComicStory, string>('comic', 'comicStories')
			.and((row) => row.id === id)
			.toArray();
		const [local] = locals;
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('comicStories', [local]);
		return toStory(decrypted);
	}, null);
}

/**
 * Every panel rendered for a story, newest first. Pulls from
 * `picture.images` filtered by `comicStoryId`. Typically the Detail-
 * View uses `story.panelImageIds` directly for ordered rendering; this
 * query is for gallery-style "all renders across regenerations" views
 * where users want to see panels that were dropped from the story's
 * ordered list but not deleted.
 */
export function useStoryPanels(storyId: string | null) {
	return useLiveQueryWithDefault<Image[]>(async () => {
		if (!storyId) return [];
		const locals = await scopedForModule<LocalImage, string>('picture', 'images')
			.and((row) => row.comicStoryId === storyId)
			.toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('images', visible);
		return decrypted.map(toImage);
	}, [] as Image[]);
}

/**
 * Stories that were seeded by a given module entry (M4 AI-Storyboard
 * back-reference). Matches when *any* panel in the story has a
 * `panelMeta[id].sourceInput` pointing at the given {module, entryId}.
 * Used for the "Comics zu diesem Journal-Eintrag" cross-reference
 * widget that renders on module detail pages.
 */
export function useStoriesByInput(
	module: 'journal' | 'notes' | 'library' | 'writing' | 'calendar' | null,
	entryId: string | null
) {
	return useLiveQueryWithDefault<ComicStory[]>(async () => {
		if (!module || !entryId) return [];
		const locals = await scopedForModule<LocalComicStory, string>(
			'comic',
			'comicStories'
		).toArray();
		const visible = locals.filter((row) => !row.deletedAt && !row.isArchived);
		const decrypted = await decryptRecords('comicStories', visible);
		const stories = decrypted.map(toStory);
		return stories.filter((s) => {
			const metas = Object.values(s.panelMeta);
			return metas.some(
				(meta) => meta.sourceInput?.module === module && meta.sourceInput.entryId === entryId
			);
		});
	}, [] as ComicStory[]);
}
