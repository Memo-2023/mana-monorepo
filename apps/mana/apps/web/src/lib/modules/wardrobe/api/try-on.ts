/**
 * Try-On client. Composes a reference-based image-edit call against
 * the M3 endpoint `/api/v1/picture/generate-with-reference` using the
 * active space's face-ref + body-ref meImages plus every garment in
 * the outfit, then persists the result into `picture.images` with the
 * outfit's `wardrobeOutfitId` back-reference and updates the outfit's
 * `lastTryOn` snapshot.
 *
 * The caller resolves the primaries reactively (via useImageByPrimary)
 * and hands us the raw mediaIds — keeps this pure and testable.
 *
 * Plan: docs/plans/wardrobe-module.md M4.
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';
import { imagesStore } from '$lib/modules/picture/stores/images.svelte';
import { wardrobeOutfitsStore } from '../stores/outfits.svelte';
import { FACE_ONLY_CATEGORIES } from '../types';
import type { Garment, GarmentCategory, Outfit } from '../types';

export type TryOnSize = '1024x1024' | '1536x1024' | '1024x1536';

export interface RunOutfitTryOnParams {
	outfit: Outfit;
	garments: Garment[]; // resolved LocalWardrobeGarment rows, primary photos must exist
	faceRefMediaId: string;
	/** Optional — omit for accessory-only mode (glasses/jewelry/hat/accessory). */
	bodyRefMediaId?: string | null;
	/** Optional override; default is composed from the outfit meta. */
	prompt?: string;
	/** `medium` balances FLUX-ish detail against credit cost (10c). */
	quality?: 'low' | 'medium' | 'high';
	size?: TryOnSize;
}

export interface RunTryOnResult {
	imageId: string; // picture.images.id (local UUID)
	imageUrl: string; // mana-media URL
	prompt: string;
	model: string;
}

/**
 * True iff every garment in the outfit is in a face-only category —
 * then the try-on renders just the face without a fullbody reference
 * (better for brille/schmuck/hut zoom).
 */
export function isAccessoryOnlyOutfit(garments: Garment[]): boolean {
	if (garments.length === 0) return false;
	return garments.every((g) => FACE_ONLY_CATEGORIES.has(g.category as GarmentCategory));
}

function composeDefaultPrompt(outfit: Outfit, accessoryOnly: boolean): string {
	if (accessoryOnly) {
		return `Fotorealistisches Portrait von mir mit ${outfit.name}, frontal, studio-Licht, neutraler Hintergrund, Fokus auf dem Accessoire`;
	}
	const occasionHint = outfit.occasion ? ` (Anlass: ${outfit.occasion})` : '';
	return `Fotorealistisches Portrait von mir im Outfit ${outfit.name}${occasionHint}, natürliches Licht, neutraler Hintergrund`;
}

export async function runOutfitTryOn(params: RunOutfitTryOnParams): Promise<RunTryOnResult> {
	const { outfit, garments, faceRefMediaId, bodyRefMediaId, prompt, quality, size } = params;

	const garmentMediaIds = garments
		.map((g) => g.mediaIds[0])
		.filter((id): id is string => Boolean(id));
	if (garmentMediaIds.length === 0) {
		throw new Error('Outfit hat keine Kleidungsstücke mit Foto.');
	}

	const accessoryOnly = isAccessoryOnlyOutfit(garments);
	const effectiveSize: TryOnSize = size ?? (accessoryOnly ? '1024x1024' : '1024x1536');
	const effectivePrompt = prompt?.trim() || composeDefaultPrompt(outfit, accessoryOnly);

	// Reference order: face first, then body (if present), then garments.
	// gpt-image-2 weights early refs slightly more for identity — keeping
	// face at [0] makes the person recognizable before the garments
	// negotiate for attention.
	const referenceMediaIds: string[] = [faceRefMediaId];
	if (!accessoryOnly && bodyRefMediaId) {
		referenceMediaIds.push(bodyRefMediaId);
	}
	for (const id of garmentMediaIds) {
		if (referenceMediaIds.length >= 8) break; // server caps at 8
		referenceMediaIds.push(id);
	}

	const token = await authStore.getValidToken();
	const res = await fetch(`${getManaApiUrl()}/api/v1/picture/generate-with-reference`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			prompt: effectivePrompt,
			referenceMediaIds,
			model: 'openai/gpt-image-2',
			quality: quality ?? 'medium',
			size: effectiveSize,
			n: 1,
		}),
	});

	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as {
			error?: string;
			required?: number;
			missing?: string[];
		};
		if (res.status === 402) {
			throw new Error(`Nicht genug Credits (${body.required ?? '?'} erforderlich)`);
		}
		if (res.status === 404) {
			throw new Error(
				'Ein oder mehrere Referenzbilder sind im Server-Ownership-Check durchgefallen — vermutlich sind Face/Body noch nicht in diesem Space hochgeladen.'
			);
		}
		throw new Error(body.error ?? `Try-On fehlgeschlagen (${res.status})`);
	}

	const data = (await res.json()) as {
		images?: Array<{ imageUrl: string; mediaId?: string; thumbnailUrl?: string }>;
		imageUrl?: string;
		mediaId?: string;
		thumbnailUrl?: string;
		prompt: string;
		model: string;
		referenceMediaIds?: string[];
	};
	const first =
		(data.images && data.images[0]) ??
		(data.imageUrl
			? { imageUrl: data.imageUrl, mediaId: data.mediaId, thumbnailUrl: data.thumbnailUrl }
			: null);
	if (!first) throw new Error('Keine Bilder zurückgegeben');

	const now = new Date().toISOString();
	const localImageId = crypto.randomUUID();

	// Persist the generated image to the Picture gallery + tag it with
	// the outfit's wardrobeOutfitId so the outfit detail's Try-On strip
	// picks it up via the useOutfitTryOns liveQuery.
	await imagesStore.insert({
		id: localImageId,
		prompt: data.prompt,
		negativePrompt: null,
		model: data.model,
		publicUrl: first.imageUrl,
		storagePath: first.mediaId ?? first.imageUrl,
		filename: `wardrobe-tryon-${Date.now()}.png`,
		format: 'png',
		width: effectiveSize === '1024x1536' ? 1024 : effectiveSize === '1536x1024' ? 1536 : 1024,
		height: effectiveSize === '1024x1536' ? 1536 : effectiveSize === '1536x1024' ? 1024 : 1024,
		isPublic: false,
		isFavorite: false,
		downloadCount: 0,
		generationMode: 'reference',
		referenceImageIds: referenceMediaIds,
		wardrobeOutfitId: outfit.id,
		createdAt: now,
		updatedAt: now,
	});

	// Pin the snapshot on the outfit so OutfitCard + DetailOutfitView
	// render the cover instantly without waiting for a full picture.images
	// live-query round-trip.
	await wardrobeOutfitsStore.setLastTryOn(outfit.id, {
		imageId: localImageId,
		imageUrl: first.imageUrl,
		createdAt: now,
		prompt: data.prompt,
		model: data.model,
	});

	return {
		imageId: localImageId,
		imageUrl: first.imageUrl,
		prompt: data.prompt,
		model: data.model,
	};
}
