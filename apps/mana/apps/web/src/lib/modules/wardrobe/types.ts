/**
 * Wardrobe module types — two tables:
 *
 *   - `wardrobeGarments`: individual clothing items / accessories, space-
 *     scoped via the standard Spaces stamping. Brand spaces hold Merch,
 *     clubs hold Trikots, families hold kid + parent wardrobes, etc.
 *   - `wardrobeOutfits`: named compositions of garment refs. A try-on
 *     snapshot points at a picture.images row (the generated image is
 *     just another entry in the Picture module's gallery).
 *
 * Try-on results themselves live in `picture.images` with an additional
 * `wardrobeOutfitId` back-reference — see apps/mana/apps/web/src/lib/
 * modules/picture/types.ts. No third table in this module.
 *
 * Plan: docs/plans/wardrobe-module.md.
 */

import type { BaseRecord } from '@mana/local-store';
import { deriveUpdatedAt } from '$lib/data/sync';
import type { VisibilityLevel } from '@mana/shared-privacy';

// ─── Garment ──────────────────────────────────────────────────────

/**
 * Closed enum of clothing/accessory categories. Drives the category
 * filter tabs in the UI and the try-on preset (`accessory`, `glasses`,
 * `jewelry`, `hat` go face-ref only — the others use face + fullbody).
 */
export type GarmentCategory =
	| 'top' // Hemd, T-Shirt, Bluse, Pullover
	| 'bottom' // Hose, Rock, Shorts
	| 'dress' // Kleid, Anzug-Einteiler
	| 'outerwear' // Jacke, Mantel
	| 'shoes'
	| 'accessory' // Schal, Gürtel, Tuch
	| 'glasses'
	| 'jewelry'
	| 'hat'
	| 'bag'
	| 'other';

/**
 * Accessory categories that skip the fullbody reference in try-on.
 * `accessoryOnly=true` in the M4 runTryOn helper flips to face-only
 * and a square prompt preset.
 */
export const FACE_ONLY_CATEGORIES: ReadonlySet<GarmentCategory> = new Set([
	'glasses',
	'jewelry',
	'hat',
	'accessory',
]);

export interface LocalWardrobeGarment extends BaseRecord {
	id: string;
	name: string;
	category: GarmentCategory;
	/**
	 * mana-media ids, at least one. `mediaIds[0]` is the primary photo
	 * used by try-on and tile thumbnails; additional ids are alternate
	 * views (back, detail) rendered on the detail page in M7.
	 */
	mediaIds: string[];
	brand?: string | null;
	color?: string | null; // freeform — "navy", "hellgrau", "#2a4d6e"
	size?: string | null; // freeform — "M", "42", "US 10"
	material?: string | null;
	tags: string[];
	notes?: string | null;
	purchasedAt?: string | null; // ISO date (YYYY-MM-DD)
	priceCents?: number | null;
	currency?: string | null; // ISO 4217
	isArchived?: boolean;
	/** Incremented by the "heute getragen"-Button; null if never tracked. */
	wearCount?: number;
	lastWornAt?: string | null;
}

export interface Garment {
	id: string;
	name: string;
	category: GarmentCategory;
	mediaIds: string[];
	brand?: string;
	color?: string;
	size?: string;
	material?: string;
	tags: string[];
	notes?: string;
	purchasedAt?: string;
	priceCents?: number;
	currency?: string;
	isArchived?: boolean;
	wearCount?: number;
	lastWornAt?: string;
	createdAt: string;
	updatedAt: string;
}

export function toGarment(local: LocalWardrobeGarment): Garment {
	return {
		id: local.id,
		name: local.name,
		category: local.category,
		mediaIds: local.mediaIds ?? [],
		brand: local.brand ?? undefined,
		color: local.color ?? undefined,
		size: local.size ?? undefined,
		material: local.material ?? undefined,
		tags: local.tags ?? [],
		notes: local.notes ?? undefined,
		purchasedAt: local.purchasedAt ?? undefined,
		priceCents: local.priceCents ?? undefined,
		currency: local.currency ?? undefined,
		isArchived: local.isArchived ?? undefined,
		wearCount: local.wearCount ?? undefined,
		lastWornAt: local.lastWornAt ?? undefined,
		createdAt: local.createdAt ?? '',
		updatedAt: deriveUpdatedAt(local),
	};
}

/** Primary photo of a garment; `null` if the row somehow has no ids. */
export function garmentPrimaryMediaId(garment: Pick<Garment, 'mediaIds'>): string | null {
	return garment.mediaIds[0] ?? null;
}

// ─── Outfit ───────────────────────────────────────────────────────

/**
 * Snapshot of the most recent try-on for an outfit. The full history
 * lives in `picture.images` filtered by `wardrobeOutfitId === outfit.id`
 * — this pointer exists so the outfit detail view can render the latest
 * preview without re-querying.
 *
 * `imageUrl` is cached here (mana-media URL from the picture.images row)
 * so OutfitCard's thumbnail renders without a second Dexie round-trip.
 * The source of truth remains picture.images; if the user deletes that
 * row the pointer goes stale but the card just falls back to the
 * garment-collage render — no error.
 */
export interface OutfitTryOn {
	imageId: string; // picture.images.id (UUID)
	imageUrl: string; // mana-media URL, cached for cheap card rendering
	createdAt: string; // ISO
	prompt: string;
	model: string;
}

/** Closed enum of occasions the outfit is appropriate for. Freeform
 *  remains possible via tags; the enum keeps the primary filter small. */
export type OutfitOccasion =
	| 'casual'
	| 'work'
	| 'formal'
	| 'workout'
	| 'date'
	| 'travel'
	| 'event'
	| 'sleep'
	| 'other';

export type OutfitSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface LocalWardrobeOutfit extends BaseRecord {
	id: string;
	name: string;
	description?: string | null;
	/** References into `wardrobeGarments`. Must be in the same space. */
	garmentIds: string[];
	occasion?: OutfitOccasion | null;
	season?: OutfitSeason[];
	tags: string[];
	isFavorite?: boolean;
	isArchived?: boolean;
	lastTryOn?: OutfitTryOn | null;
	lastWornAt?: string | null;
	visibility?: VisibilityLevel;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
	unlistedToken?: string;
}

export interface Outfit {
	id: string;
	name: string;
	description?: string;
	garmentIds: string[];
	occasion?: OutfitOccasion;
	season?: OutfitSeason[];
	tags: string[];
	isFavorite?: boolean;
	isArchived?: boolean;
	lastTryOn?: OutfitTryOn;
	lastWornAt?: string;
	visibility: VisibilityLevel;
	createdAt: string;
	updatedAt: string;
}

export function toOutfit(local: LocalWardrobeOutfit): Outfit {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? undefined,
		garmentIds: local.garmentIds ?? [],
		occasion: local.occasion ?? undefined,
		season: local.season,
		tags: local.tags ?? [],
		isFavorite: local.isFavorite,
		isArchived: local.isArchived,
		lastTryOn: local.lastTryOn ?? undefined,
		lastWornAt: local.lastWornAt ?? undefined,
		visibility: local.visibility ?? 'space',
		createdAt: local.createdAt ?? '',
		updatedAt: deriveUpdatedAt(local),
	};
}
