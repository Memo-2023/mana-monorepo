/**
 * Wardrobe module — read-side queries.
 *
 * All queries go through `scopedForModule` so switching the active
 * space swaps the visible pool automatically (Brand-merch vs personal
 * wardrobe vs family-wardrobe). Try-on history lives in `picture.images`
 * filtered by `wardrobeOutfitId` — see useOutfitTryOns below.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalImage, Image } from '$lib/modules/picture/types';
import { toImage } from '$lib/modules/picture/queries';
import {
	toGarment,
	toOutfit,
	type Garment,
	type GarmentCategory,
	type LocalWardrobeGarment,
	type LocalWardrobeOutfit,
	type Outfit,
	type OutfitOccasion,
} from './types';

// ─── Garments ─────────────────────────────────────────────────────

/** All non-archived, non-deleted garments in the active space. */
export function useAllGarments() {
	return useLiveQueryWithDefault<Garment[]>(async () => {
		const locals = await scopedForModule<LocalWardrobeGarment, string>(
			'wardrobe',
			'wardrobeGarments'
		).toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('wardrobeGarments', visible);
		return decrypted.map(toGarment);
	}, [] as Garment[]);
}

/** Garments filtered by category — used by the Category-Tabs view. */
export function useGarmentsByCategory(category: GarmentCategory) {
	return useLiveQueryWithDefault<Garment[]>(async () => {
		const locals = await scopedForModule<LocalWardrobeGarment, string>(
			'wardrobe',
			'wardrobeGarments'
		)
			.and((row) => row.category === category)
			.toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('wardrobeGarments', visible);
		return decrypted.map(toGarment);
	}, [] as Garment[]);
}

/** A single garment by id, live-updating. Null while loading / missing. */
export function useGarment(id: string | null) {
	return useLiveQueryWithDefault<Garment | null>(async () => {
		if (!id) return null;
		const locals = await scopedForModule<LocalWardrobeGarment, string>(
			'wardrobe',
			'wardrobeGarments'
		)
			.and((row) => row.id === id)
			.toArray();
		const [local] = locals;
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('wardrobeGarments', [local]);
		return toGarment(decrypted);
	}, null);
}

// ─── Outfits ──────────────────────────────────────────────────────

/** All non-archived outfits in the active space. */
export function useAllOutfits() {
	return useLiveQueryWithDefault<Outfit[]>(async () => {
		const locals = await scopedForModule<LocalWardrobeOutfit, string>(
			'wardrobe',
			'wardrobeOutfits'
		).toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('wardrobeOutfits', visible);
		return decrypted.map(toOutfit);
	}, [] as Outfit[]);
}

export function useOutfitsByOccasion(occasion: OutfitOccasion) {
	return useLiveQueryWithDefault<Outfit[]>(async () => {
		const locals = await scopedForModule<LocalWardrobeOutfit, string>('wardrobe', 'wardrobeOutfits')
			.and((row) => row.occasion === occasion)
			.toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('wardrobeOutfits', visible);
		return decrypted.map(toOutfit);
	}, [] as Outfit[]);
}

export function useOutfit(id: string | null) {
	return useLiveQueryWithDefault<Outfit | null>(async () => {
		if (!id) return null;
		const locals = await scopedForModule<LocalWardrobeOutfit, string>('wardrobe', 'wardrobeOutfits')
			.and((row) => row.id === id)
			.toArray();
		const [local] = locals;
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('wardrobeOutfits', [local]);
		return toOutfit(decrypted);
	}, null);
}

/**
 * Every try-on ever rendered for an outfit, newest first. Pulls from
 * `picture.images` (filtered by `wardrobeOutfitId`) because that's where
 * generations physically land — see plan decision #1 (kein drittes Table
 * für Try-Ons). The outfit detail view renders these as a horizontal
 * strip under the current composition.
 */
export function useOutfitTryOns(outfitId: string | null) {
	return useLiveQueryWithDefault<Image[]>(async () => {
		if (!outfitId) return [];
		const locals = await scopedForModule<LocalImage, string>('picture', 'images')
			.and((row) => row.wardrobeOutfitId === outfitId)
			.toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && !row.isArchived)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('images', visible);
		return decrypted.map(toImage);
	}, [] as Image[]);
}
