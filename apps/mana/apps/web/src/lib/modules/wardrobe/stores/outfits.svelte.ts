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
		await wardrobeOutfitsTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleFavorite(id: string): Promise<void> {
		const existing = await wardrobeOutfitsTable.get(id);
		if (!existing) return;
		await wardrobeOutfitsTable.update(id, {
			isFavorite: !existing.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async markWornToday(id: string): Promise<void> {
		const today = new Date().toISOString().slice(0, 10);
		await wardrobeOutfitsTable.update(id, {
			lastWornAt: today,
			updatedAt: new Date().toISOString(),
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
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('WardrobeOutfitTryOn', 'wardrobe', 'wardrobeOutfits', id, {
			outfitId: id,
			imageId: tryOn.imageId,
		});
	},

	async archiveOutfit(id: string, archived: boolean): Promise<void> {
		await wardrobeOutfitsTable.update(id, {
			isArchived: archived,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteOutfit(id: string): Promise<void> {
		const nowIso = new Date().toISOString();
		await wardrobeOutfitsTable.update(id, {
			deletedAt: nowIso,
			updatedAt: nowIso,
		});
		emitDomainEvent('WardrobeOutfitDeleted', 'wardrobe', 'wardrobeOutfits', id, {
			outfitId: id,
		});
	},
};
