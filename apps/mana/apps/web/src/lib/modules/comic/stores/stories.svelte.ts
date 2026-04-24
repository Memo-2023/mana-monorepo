/**
 * Comic stories store — mutation-only service.
 *
 * A story holds an ordered `panelImageIds: string[]` plus a
 * `panelMeta` record keyed by panel id. Panel mutations (append,
 * reorder, remove, updateMeta) are the M2+ shape; M1 covers the
 * shell: create/update/archive/delete/setVisibility.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import {
	defaultVisibilityFor,
	generateUnlistedToken,
	type VisibilityLevel,
} from '@mana/shared-privacy';
import { comicStoriesTable } from '../collections';
import { toStory } from '../types';
import type { ComicPanelMeta, ComicStory, ComicStyle, LocalComicStory } from '../types';

export interface CreateStoryInput {
	title: string;
	style: ComicStyle;
	characterMediaIds: string[];
	description?: string | null;
	storyContext?: string | null;
	tags?: string[];
	isFavorite?: boolean;
}

export const comicStoriesStore = {
	async createStory(input: CreateStoryInput): Promise<ComicStory> {
		if (input.characterMediaIds.length === 0) {
			throw new Error('Story needs at least one character reference image');
		}
		const newLocal: LocalComicStory = {
			id: crypto.randomUUID(),
			title: input.title,
			description: input.description ?? null,
			style: input.style,
			characterMediaIds: input.characterMediaIds,
			storyContext: input.storyContext ?? null,
			panelImageIds: [],
			panelMeta: {},
			tags: input.tags ?? [],
			isFavorite: input.isFavorite ?? false,
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
		};
		const snapshot = toStory({ ...newLocal });
		await encryptRecord('comicStories', newLocal);
		await comicStoriesTable.add(newLocal);
		emitDomainEvent('ComicStoryCreated', 'comic', 'comicStories', newLocal.id, {
			storyId: newLocal.id,
			style: input.style,
		});
		return snapshot;
	},

	async updateStory(
		id: string,
		patch: Partial<
			Pick<LocalComicStory, 'title' | 'description' | 'storyContext' | 'tags' | 'characterMediaIds'>
		>
	): Promise<void> {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('comicStories', wrapped);
		await comicStoriesTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleFavorite(id: string): Promise<void> {
		const existing = await comicStoriesTable.get(id);
		if (!existing) return;
		await comicStoriesTable.update(id, {
			isFavorite: !existing.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async archiveStory(id: string, archived: boolean): Promise<void> {
		await comicStoriesTable.update(id, {
			isArchived: archived,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteStory(id: string): Promise<void> {
		const nowIso = new Date().toISOString();
		await comicStoriesTable.update(id, {
			deletedAt: nowIso,
			updatedAt: nowIso,
		});
		emitDomainEvent('ComicStoryDeleted', 'comic', 'comicStories', id, {
			storyId: id,
		});
	},

	/**
	 * Flip a story's visibility. Comics are a natural share-surface
	 * (4-panel jokes, work-anecdotes) — marking a story `public` makes
	 * it eligible for `/embed/comic/:id` in M5.
	 */
	async setVisibility(id: string, next: VisibilityLevel): Promise<void> {
		const existing = await comicStoriesTable.get(id);
		if (!existing) throw new Error(`Comic story ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalComicStory> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId(),
			updatedAt: now,
		};
		if (next === 'unlisted' && !existing.unlistedToken) {
			patch.unlistedToken = generateUnlistedToken();
		} else if (next !== 'unlisted' && existing.unlistedToken) {
			patch.unlistedToken = undefined;
		}
		await comicStoriesTable.update(id, patch);

		emitDomainEvent('VisibilityChanged', 'comic', 'comicStories', id, {
			recordId: id,
			collection: 'comicStories',
			before,
			after: next,
		});
	},

	/**
	 * Append a freshly generated panel to the end of the story. Called
	 * by `runPanelGenerate` (M2) right after `picture.images` lands the
	 * new row. `meta` carries the prompt used + optional caption /
	 * dialogue / sourceInput.
	 *
	 * Re-encrypts the whole panelMeta Record because it's one JSON
	 * blob in the registry — we can't partially update individual keys
	 * without decrypting first.
	 */
	async appendPanel(storyId: string, panelImageId: string, meta: ComicPanelMeta): Promise<void> {
		const existing = await comicStoriesTable.get(storyId);
		if (!existing) throw new Error(`Comic story ${storyId} not found`);
		const nextIds = [...(existing.panelImageIds ?? []), panelImageId];
		const nextMeta = { ...(existing.panelMeta ?? {}), [panelImageId]: meta };
		const patch = {
			panelImageIds: nextIds,
			panelMeta: nextMeta,
		} as Record<string, unknown>;
		await encryptRecord('comicStories', patch);
		await comicStoriesTable.update(storyId, {
			...patch,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('ComicPanelAppended', 'comic', 'comicStories', storyId, {
			storyId,
			panelImageId,
			panelIndex: nextIds.length - 1,
		});
	},
};
