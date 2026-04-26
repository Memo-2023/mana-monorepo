/**
 * Comic-Characters store — mutation-only service.
 *
 * A character holds an unbounded `variantMediaIds: string[]` of
 * generated picture.images-rows plus a `pinnedVariantId` that
 * picks one as the canonical look. Variant generation itself
 * lives in `api/generate-character.ts` (Mc2.1) — this store only
 * mutates the row.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { comicCharactersTable } from '../collections';
import { toCharacter } from '../types';
import type { ComicCharacter, ComicStyle, LocalComicCharacter } from '../types';

export interface CreateCharacterInput {
	name: string;
	style: ComicStyle;
	sourceFaceMediaId: string;
	sourceBodyMediaId?: string | null;
	description?: string | null;
	addPrompt?: string | null;
	tags?: string[];
}

export const comicCharactersStore = {
	/**
	 * Create a fresh character row WITHOUT any variants yet — the
	 * builder calls this first to obtain an id, then runs N variant
	 * generations and pushes each through `appendVariant`. The user
	 * pins one once they're happy.
	 */
	async createCharacter(input: CreateCharacterInput): Promise<ComicCharacter> {
		const trimmedName = input.name.trim();
		if (!trimmedName) {
			throw new Error('Character braucht einen Namen');
		}
		if (!input.sourceFaceMediaId) {
			throw new Error('Character braucht ein Face-Bild als Quelle');
		}
		// Spread incoming arrays to break any Svelte 5 $state proxies
		// the form might pass through. Same defense as comicStoriesStore.
		const newLocal: LocalComicCharacter = {
			id: crypto.randomUUID(),
			name: trimmedName,
			description: input.description ?? null,
			style: input.style,
			addPrompt: input.addPrompt ?? null,
			sourceFaceMediaId: input.sourceFaceMediaId,
			sourceBodyMediaId: input.sourceBodyMediaId ?? null,
			variantMediaIds: [],
			pinnedVariantId: null,
			tags: input.tags ? [...input.tags] : [],
			isFavorite: false,
		};
		const snapshot = toCharacter({ ...newLocal });
		await encryptRecord('comicCharacters', newLocal);
		await comicCharactersTable.add(newLocal);
		emitDomainEvent('ComicCharacterCreated', 'comic', 'comicCharacters', newLocal.id, {
			characterId: newLocal.id,
			style: input.style,
		});
		return snapshot;
	},

	/**
	 * Append a freshly generated variant to the character's variant
	 * list. Called by the builder after each gpt-image-2 / Nano Banana
	 * call lands a picture.images row. The first variant auto-pins
	 * (build-in-progress fallback) so the character has a cover even
	 * before the user explicitly chooses.
	 */
	async appendVariant(characterId: string, variantMediaId: string): Promise<void> {
		const existing = await comicCharactersTable.get(characterId);
		if (!existing) throw new Error(`Character ${characterId} not found`);
		const nextIds = [...(existing.variantMediaIds ?? []), variantMediaId];
		const patch: Partial<LocalComicCharacter> = {
			variantMediaIds: nextIds,
		};
		// Auto-pin the first variant so the cover isn't blank during
		// build. User can re-pin afterwards.
		if (!existing.pinnedVariantId) {
			patch.pinnedVariantId = variantMediaId;
		}
		await comicCharactersTable.update(characterId, patch);
		emitDomainEvent('ComicCharacterVariantAdded', 'comic', 'comicCharacters', characterId, {
			characterId,
			variantMediaId,
			variantIndex: nextIds.length - 1,
		});
	},

	/** Pin a different variant as the canonical look. Stories generated
	 *  AFTER the re-pin get the new variant; existing stories are
	 *  unchanged because they snapshot the mediaId at story-create. */
	async pinVariant(characterId: string, variantMediaId: string): Promise<void> {
		const existing = await comicCharactersTable.get(characterId);
		if (!existing) throw new Error(`Character ${characterId} not found`);
		if (!(existing.variantMediaIds ?? []).includes(variantMediaId)) {
			throw new Error(`Variant ${variantMediaId} not in this character`);
		}
		await comicCharactersTable.update(characterId, {
			pinnedVariantId: variantMediaId,
		});
		emitDomainEvent('ComicCharacterVariantPinned', 'comic', 'comicCharacters', characterId, {
			characterId,
			variantMediaId,
		});
	},

	/** Remove a variant from the character's pool. Doesn't touch the
	 *  underlying picture.images-row (user can keep the render in their
	 *  Picture gallery). If the removed variant was pinned, falls back
	 *  to the first remaining variant; if none remain, pin = null. */
	async removeVariant(characterId: string, variantMediaId: string): Promise<void> {
		const existing = await comicCharactersTable.get(characterId);
		if (!existing) return;
		const nextIds = (existing.variantMediaIds ?? []).filter((id) => id !== variantMediaId);
		const patch: Partial<LocalComicCharacter> = {
			variantMediaIds: nextIds,
		};
		if (existing.pinnedVariantId === variantMediaId) {
			patch.pinnedVariantId = nextIds[0] ?? null;
		}
		await comicCharactersTable.update(characterId, patch);
	},

	async updateCharacter(
		id: string,
		patch: Partial<Pick<LocalComicCharacter, 'name' | 'description' | 'addPrompt' | 'tags'>>
	): Promise<void> {
		const wrapped: Partial<LocalComicCharacter> = { ...patch };
		if (Array.isArray(wrapped.tags)) {
			wrapped.tags = [...wrapped.tags];
		}
		await encryptRecord('comicCharacters', wrapped);
		await comicCharactersTable.update(id, wrapped);
	},

	async toggleFavorite(id: string): Promise<void> {
		const existing = await comicCharactersTable.get(id);
		if (!existing) return;
		await comicCharactersTable.update(id, {
			isFavorite: !existing.isFavorite,
		});
	},

	async archiveCharacter(id: string, archived: boolean): Promise<void> {
		await comicCharactersTable.update(id, {
			isArchived: archived,
		});
	},

	async deleteCharacter(id: string): Promise<void> {
		const nowIso = new Date().toISOString();
		await comicCharactersTable.update(id, {
			deletedAt: nowIso,
		});
		emitDomainEvent('ComicCharacterDeleted', 'comic', 'comicCharacters', id, {
			characterId: id,
		});
	},
};
