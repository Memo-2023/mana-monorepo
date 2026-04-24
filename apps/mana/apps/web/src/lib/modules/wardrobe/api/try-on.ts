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

/**
 * Models the Try-On flow can target. Each card on the shared picker
 * maps to one of these. `openai/gpt-image-2` is the existing default
 * (falls back to gpt-image-1 server-side when the user's org isn't
 * verified yet — see picture/routes.ts).
 */
export type TryOnModel =
	| 'openai/gpt-image-2'
	| 'google/gemini-3-pro-image-preview'
	| 'google/gemini-3.1-flash-image-preview';

export const DEFAULT_TRY_ON_MODEL: TryOnModel = 'openai/gpt-image-2';

/** Shared low-level POST to /generate-with-reference. Returns the first
 *  generated image's URL + mediaId + prompt + model — outfit and solo
 *  variants both go through here to keep the HTTP error matrix identical.
 */
async function callGenerateWithReference(opts: {
	prompt: string;
	referenceMediaIds: string[];
	quality: 'low' | 'medium' | 'high';
	size: TryOnSize;
	model: TryOnModel;
}): Promise<{ imageUrl: string; mediaId: string; prompt: string; model: string }> {
	const token = await authStore.getValidToken();
	const res = await fetch(`${getManaApiUrl()}/api/v1/picture/generate-with-reference`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			prompt: opts.prompt,
			referenceMediaIds: opts.referenceMediaIds,
			model: opts.model,
			quality: opts.quality,
			size: opts.size,
			n: 1,
		}),
	});

	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as {
			error?: string;
			detail?: string;
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
		// Surface the server's `detail` so the user sees *why* it failed
		// (OpenAI policy rejection, media-download timeout, etc.) instead
		// of a generic "Try-On fehlgeschlagen". Server always includes
		// detail on 502 branches — see routes.ts generate-with-reference.
		const label = body.error ?? `Try-On fehlgeschlagen (${res.status})`;
		throw new Error(body.detail ? `${label}: ${body.detail}` : label);
	}

	const data = (await res.json()) as {
		images?: Array<{ imageUrl: string; mediaId?: string }>;
		imageUrl?: string;
		mediaId?: string;
		prompt: string;
		model: string;
	};
	const first =
		(data.images && data.images[0]) ??
		(data.imageUrl ? { imageUrl: data.imageUrl, mediaId: data.mediaId } : null);
	if (!first?.imageUrl || !first.mediaId) {
		throw new Error('Keine Bilder zurückgegeben');
	}
	return {
		imageUrl: first.imageUrl,
		mediaId: first.mediaId,
		prompt: data.prompt,
		model: data.model,
	};
}

function dimsForSize(size: TryOnSize): { width: number; height: number } {
	if (size === '1024x1536') return { width: 1024, height: 1536 };
	if (size === '1536x1024') return { width: 1536, height: 1024 };
	return { width: 1024, height: 1024 };
}

export type TryOnSize = '1024x1024' | '1536x1024' | '1024x1536';

export interface RunOutfitTryOnParams {
	outfit: Outfit;
	garments: Garment[]; // resolved LocalWardrobeGarment rows, primary photos must exist
	faceRefMediaId: string;
	/** Optional — omit for accessory-only mode (glasses/jewelry/hat/accessory). */
	bodyRefMediaId?: string | null;
	/** Image model that should produce the try-on. Defaults to
	 *  DEFAULT_TRY_ON_MODEL if the caller doesn't pass one. */
	model?: TryOnModel;
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
		// Portrait is the right framing for accessories — we want a tight
		// head-and-shoulders shot so the Brille/Schmuck/Hut is legible.
		return `Fotorealistisches Portrait von mir mit ${outfit.name}, frontal, studio-Licht, neutraler Hintergrund, Fokus auf dem Accessoire`;
	}
	// Explicitly ask for a full-body frame — gpt-image-1/2 otherwise read
	// "Portrait" as "headshot" and crop to head-and-shoulders, ignoring
	// the body-ref. "Ganzkörperfoto … stehend, von Kopf bis Fuß sichtbar"
	// is the German idiom that reliably biases the model to full-length.
	const occasionHint = outfit.occasion ? ` (Anlass: ${outfit.occasion})` : '';
	return `Fotorealistisches Ganzkörperfoto von mir im Outfit ${outfit.name}${occasionHint}, stehend, von Kopf bis Fuß sichtbar, natürliches Licht, neutraler Hintergrund`;
}

export async function runOutfitTryOn(params: RunOutfitTryOnParams): Promise<RunTryOnResult> {
	const { outfit, garments, faceRefMediaId, bodyRefMediaId, prompt, quality, size, model } = params;

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

	const result = await callGenerateWithReference({
		prompt: effectivePrompt,
		referenceMediaIds,
		quality: quality ?? 'medium',
		size: effectiveSize,
		model: model ?? DEFAULT_TRY_ON_MODEL,
	});

	const now = new Date().toISOString();
	const localImageId = crypto.randomUUID();
	const dims = dimsForSize(effectiveSize);

	// Persist the generated image to the Picture gallery + tag it with
	// the outfit's wardrobeOutfitId so the outfit detail's Try-On strip
	// picks it up via the useOutfitTryOns liveQuery.
	await imagesStore.insert({
		id: localImageId,
		prompt: result.prompt,
		negativePrompt: null,
		model: result.model,
		publicUrl: result.imageUrl,
		storagePath: result.mediaId,
		filename: `wardrobe-tryon-${Date.now()}.png`,
		format: 'png',
		width: dims.width,
		height: dims.height,
		visibility: 'private',
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
		imageUrl: result.imageUrl,
		createdAt: now,
		prompt: result.prompt,
		model: result.model,
	});

	return {
		imageId: localImageId,
		imageUrl: result.imageUrl,
		prompt: result.prompt,
		model: result.model,
	};
}

// ─── Solo-Garment Try-On ─────────────────────────────────────────

export interface RunGarmentTryOnParams {
	garment: Garment;
	faceRefMediaId: string;
	/** Null for accessory categories (glasses/jewelry/hat/accessory) — the
	 *  category check happens here, callers don't need to pre-filter. */
	bodyRefMediaId?: string | null;
	prompt?: string;
	quality?: 'low' | 'medium' | 'high';
	/** Image model that should produce the try-on. Defaults to
	 *  DEFAULT_TRY_ON_MODEL if the caller doesn't pass one. */
	model?: TryOnModel;
}

/** True iff the garment category implies a face-only render. Exposed so
 *  the button can decide whether body-ref is required. */
export function isAccessoryGarment(garment: Garment): boolean {
	return FACE_ONLY_CATEGORIES.has(garment.category as GarmentCategory);
}

function composeGarmentPrompt(garment: Garment, accessoryOnly: boolean): string {
	if (accessoryOnly) {
		// Headshot framing for face-only categories (Brille/Schmuck/Hut).
		return `Fotorealistisches Portrait von mir mit ${garment.name}, frontal, studio-Licht, neutraler Hintergrund, Fokus auf dem Accessoire`;
	}
	// Explicit full-body framing — see composeDefaultPrompt for the
	// rationale. "Portrait" biases to headshot, "Ganzkörperfoto" doesn't.
	return `Fotorealistisches Ganzkörperfoto von mir im/in ${garment.name}, stehend, von Kopf bis Fuß sichtbar, natürliches Licht, neutraler Hintergrund`;
}

/**
 * Single-garment try-on — "nur diese Brille auf mein Gesicht" / "wie
 * sähe dieses Hemd an mir aus". Writes a picture.images row WITHOUT a
 * wardrobeOutfitId back-reference (it's not an outfit) and does NOT
 * update any outfit's lastTryOn. The Picture gallery picks it up like
 * any other generated image.
 *
 * Plan follow-up to docs/plans/wardrobe-module.md M4.
 */
export async function runGarmentTryOn(params: RunGarmentTryOnParams): Promise<RunTryOnResult> {
	const { garment, faceRefMediaId, bodyRefMediaId, prompt, quality, model } = params;

	const garmentMediaId = garment.mediaIds[0];
	if (!garmentMediaId) {
		throw new Error('Dieses Kleidungsstück hat kein Foto.');
	}

	const accessoryOnly = isAccessoryGarment(garment);
	const effectiveSize: TryOnSize = accessoryOnly ? '1024x1024' : '1024x1536';
	const effectivePrompt = prompt?.trim() || composeGarmentPrompt(garment, accessoryOnly);

	const referenceMediaIds: string[] = [faceRefMediaId];
	if (!accessoryOnly && bodyRefMediaId) referenceMediaIds.push(bodyRefMediaId);
	referenceMediaIds.push(garmentMediaId);

	const result = await callGenerateWithReference({
		prompt: effectivePrompt,
		referenceMediaIds,
		quality: quality ?? 'medium',
		size: effectiveSize,
		model: model ?? DEFAULT_TRY_ON_MODEL,
	});

	const now = new Date().toISOString();
	const localImageId = crypto.randomUUID();
	const dims = dimsForSize(effectiveSize);

	await imagesStore.insert({
		id: localImageId,
		prompt: result.prompt,
		negativePrompt: null,
		model: result.model,
		publicUrl: result.imageUrl,
		storagePath: result.mediaId,
		filename: `wardrobe-garment-tryon-${Date.now()}.png`,
		format: 'png',
		width: dims.width,
		height: dims.height,
		visibility: 'private',
		isFavorite: false,
		downloadCount: 0,
		generationMode: 'reference',
		referenceImageIds: referenceMediaIds,
		// Symmetric back-ref to wardrobeOutfitId: a solo try-on belongs
		// to exactly one garment, so the garment detail page can
		// liveQuery `where wardrobeGarmentId === id`. Outfit and
		// garment back-refs are mutually exclusive — this row is a
		// garment try-on, not an outfit one.
		wardrobeOutfitId: null,
		wardrobeGarmentId: garment.id,
		createdAt: now,
		updatedAt: now,
	});

	return {
		imageId: localImageId,
		imageUrl: result.imageUrl,
		prompt: result.prompt,
		model: result.model,
	};
}
