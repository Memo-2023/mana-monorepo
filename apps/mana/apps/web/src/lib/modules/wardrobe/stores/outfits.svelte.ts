/**
 * Outfits store — mutation-only service.
 *
 * Outfits reference garments by id (plaintext array on the row). Try-On
 * results are stored in `picture.images` with `wardrobeOutfitId` back-
 * reference — the `lastTryOn` snapshot here is just a convenience pointer
 * so the outfit card can render the latest preview without a join query.
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
import { wardrobeOutfitsTable } from '../collections';
import { toOutfit } from '../types';
import type {
	LocalWardrobeOutfit,
	Outfit,
	OutfitOccasion,
	OutfitSeason,
	OutfitTryOn,
} from '../types';

export interface CreateOutfitInput {
	name: string;
	garmentIds: string[];
	description?: string | null;
	occasion?: OutfitOccasion | null;
	season?: OutfitSeason[];
	tags?: string[];
	isFavorite?: boolean;
}

export const wardrobeOutfitsStore = {
	async createOutfit(input: CreateOutfitInput): Promise<Outfit> {
		if (input.garmentIds.length === 0) {
			throw new Error('Outfit needs at least one garment');
		}
		const newLocal: LocalWardrobeOutfit = {
			id: crypto.randomUUID(),
			name: input.name,
			description: input.description ?? null,
			garmentIds: input.garmentIds,
			occasion: input.occasion ?? null,
			season: input.season,
			tags: input.tags ?? [],
			isFavorite: input.isFavorite ?? false,
			visibility: defaultVisibilityFor(getActiveSpace()?.type),
		};
		const snapshot = toOutfit({ ...newLocal });
		await encryptRecord('wardrobeOutfits', newLocal);
		await wardrobeOutfitsTable.add(newLocal);
		emitDomainEvent('WardrobeOutfitCreated', 'wardrobe', 'wardrobeOutfits', newLocal.id, {
			outfitId: newLocal.id,
			garmentCount: input.garmentIds.length,
		});
		return snapshot;
	},

	async updateOutfit(
		id: string,
		patch: Partial<
			Pick<
				LocalWardrobeOutfit,
				'name' | 'description' | 'garmentIds' | 'occasion' | 'season' | 'tags'
			>
		>
	): Promise<void> {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('wardrobeOutfits', wrapped);
		await wardrobeOutfitsTable.update(id, wrapped as never);
	},

	async toggleFavorite(id: string): Promise<void> {
		const existing = await wardrobeOutfitsTable.get(id);
		if (!existing) return;
		await wardrobeOutfitsTable.update(id, {
			isFavorite: !existing.isFavorite,
		});
	},

	async markWornToday(id: string): Promise<void> {
		const today = new Date().toISOString().slice(0, 10);
		await wardrobeOutfitsTable.update(id, {
			lastWornAt: today,
		});
	},

	/**
	 * Pinning the most recent try-on. The `imageId` points at a
	 * `picture.images` row written by the M4 runTryOn helper; this
	 * method is called right after that row lands so the outfit card
	 * can surface the latest preview.
	 */
	async setLastTryOn(id: string, tryOn: OutfitTryOn): Promise<void> {
		await wardrobeOutfitsTable.update(id, {
			lastTryOn: tryOn,
		});
		emitDomainEvent('WardrobeOutfitTryOn', 'wardrobe', 'wardrobeOutfits', id, {
			outfitId: id,
			imageId: tryOn.imageId,
		});
	},

	async archiveOutfit(id: string, archived: boolean): Promise<void> {
		await wardrobeOutfitsTable.update(id, {
			isArchived: archived,
		});
	},

	async deleteOutfit(id: string): Promise<void> {
		const nowIso = new Date().toISOString();
		await wardrobeOutfitsTable.update(id, {
			deletedAt: nowIso,
		});
		emitDomainEvent('WardrobeOutfitDeleted', 'wardrobe', 'wardrobeOutfits', id, {
			outfitId: id,
		});
	},

	/**
	 * Flip an outfit's visibility. Enables the style-portfolio use
	 * case — mark curated outfits 'public' so they appear in the
	 * wardrobe.outfits embed on the owner's website.
	 */
	async setVisibility(id: string, next: VisibilityLevel): Promise<void> {
		const existing = await wardrobeOutfitsTable.get(id);
		if (!existing) throw new Error(`Outfit ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'space';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalWardrobeOutfit> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId(),
		};
		if (next === 'unlisted' && !existing.unlistedToken) {
			patch.unlistedToken = generateUnlistedToken();
		} else if (next !== 'unlisted' && existing.unlistedToken) {
			patch.unlistedToken = undefined;
		}
		await wardrobeOutfitsTable.update(id, patch as never);

		emitDomainEvent('VisibilityChanged', 'wardrobe', 'wardrobeOutfits', id, {
			recordId: id,
			collection: 'wardrobeOutfits',
			before,
			after: next,
		});
	},
};
