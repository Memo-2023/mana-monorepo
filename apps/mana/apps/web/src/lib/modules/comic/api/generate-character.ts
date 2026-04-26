/**
 * Character-variant generation. Renders N stylised portraits of the
 * user from face/body meImages with the chosen ComicStyle prefix,
 * persists each into `picture.images` with a `comicCharacterId`
 * back-ref, and appends each to the character's `variantMediaIds`.
 *
 * The endpoint and the HTTP shape are identical to panel-generation
 * (`api/generate-panel.ts`); only the prompt-template differs (panel
 * = "what happens in this panel", character = "portrait of the same
 * person, identity anchor"). One call with `n=4` returns all four
 * variants in a single batch — that's the gpt-image-2 multi-image
 * response shape (`{images: [{imageUrl, mediaId}, ...]}`).
 *
 * Plan: docs/plans/comic-module.md §11 (Mc2).
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';
import { imagesStore } from '$lib/modules/picture/stores/images.svelte';
import { comicCharactersStore } from '../stores/characters.svelte';
import { STYLE_PREFIXES } from '../styles';
import { DEFAULT_PANEL_MODEL, type PanelModel } from './generate-panel';
import type { ComicCharacter, ComicStyle } from '../types';

export type CharacterSize = '1024x1024' | '1024x1536';

export interface RunCharacterGenerateParams {
	character: ComicCharacter;
	/** How many variants to render in one batch — 1-4 (gpt-image-2's
	 *  hard server cap). Default 4: the picker shows enough options
	 *  for a real choice without burning credits on speculative noise. */
	count?: number;
	quality?: 'low' | 'medium' | 'high';
	size?: CharacterSize;
	model?: PanelModel;
}

export interface RunCharacterGenerateResult {
	variantMediaIds: string[];
	imageUrls: string[];
	prompt: string;
	model: string;
}

function dimsForSize(size: CharacterSize): { width: number; height: number } {
	if (size === '1024x1536') return { width: 1024, height: 1536 };
	return { width: 1024, height: 1024 };
}

/**
 * Compose the gpt-image-2 prompt for a character variant. The
 * style-prefix sets the visual register; the identity-anchor
 * instruction biases the model toward keeping face features
 * recognisable across the four variants of one batch.
 *
 * Caption / dialogue strings are deliberately left out — characters
 * are bare portraits, not panels with text.
 */
export function composeCharacterPrompt(
	style: ComicStyle,
	addPrompt: string | null | undefined
): string {
	const parts: string[] = [
		STYLE_PREFIXES[style],
		'portrait of the user',
		'looking natural, head and shoulders visible',
		'neutral background, clear identity anchor — same face, same eyes, recognisable across panels',
	];
	const trimmed = addPrompt?.trim();
	if (trimmed) {
		parts.push(trimmed);
	}
	return parts.join('. ');
}

/**
 * Generate N variants and append them to the character. Caller
 * passes the snapshot character (post-create), this function
 * mutates Dexie via `imagesStore.insert` + `comicCharactersStore.appendVariant`.
 */
export async function runCharacterGenerate(
	params: RunCharacterGenerateParams
): Promise<RunCharacterGenerateResult> {
	const { character } = params;
	const count = Math.max(1, Math.min(4, params.count ?? 4));
	const quality = params.quality ?? 'medium';
	const size: CharacterSize = params.size ?? '1024x1024';
	const model: PanelModel = params.model ?? DEFAULT_PANEL_MODEL;

	if (!character.sourceFaceMediaId) {
		throw new Error('Character braucht ein Source-Face-Bild.');
	}

	const referenceMediaIds: string[] = [character.sourceFaceMediaId];
	if (character.sourceBodyMediaId) {
		referenceMediaIds.push(character.sourceBodyMediaId);
	}

	const composed = composeCharacterPrompt(character.style, character.addPrompt);

	const token = await authStore.getValidToken();
	const res = await fetch(`${getManaApiUrl()}/api/v1/picture/generate-with-reference`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
		body: JSON.stringify({
			prompt: composed,
			referenceMediaIds,
			model,
			quality,
			size,
			n: count,
		}),
	});

	if (!res.ok) {
		const body = (await res.json().catch(() => ({}))) as {
			error?: string;
			detail?: string;
			required?: number;
		};
		if (res.status === 402) {
			throw new Error(`Nicht genug Credits (${body.required ?? '?'} erforderlich)`);
		}
		if (res.status === 404) {
			throw new Error(
				'Source-Bilder im Server-Ownership-Check durchgefallen — Face-/Body-Refs fehlen im aktiven Space.'
			);
		}
		const label = body.error ?? `Character-Generierung fehlgeschlagen (${res.status})`;
		throw new Error(body.detail ? `${label}: ${body.detail}` : label);
	}

	const data = (await res.json()) as {
		images?: Array<{ imageUrl: string; mediaId?: string }>;
		imageUrl?: string;
		mediaId?: string;
		prompt: string;
		model: string;
	};

	// Normalise: the endpoint returns either `images: [...]` (n>=1
	// path) or a legacy `imageUrl + mediaId` flat shape. Both go
	// through the same persist loop below.
	const items =
		data.images && data.images.length > 0
			? data.images
			: data.imageUrl
				? [{ imageUrl: data.imageUrl, mediaId: data.mediaId }]
				: [];

	if (items.length === 0) {
		throw new Error('Keine Variant-Bilder zurückgegeben');
	}

	const dims = dimsForSize(size);
	const variantMediaIds: string[] = [];
	const imageUrls: string[] = [];

	// Persist each variant in order — auto-pin auf erste Variant
	// passiert in `appendVariant` falls noch keine gepinnt ist, der
	// User kann später re-pinnen.
	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		if (!item.imageUrl || !item.mediaId) continue;
		const localImageId = crypto.randomUUID();
		const nowIso = new Date().toISOString();
		const variantIndex = (character.variantMediaIds?.length ?? 0) + i;

		await imagesStore.insert({
			id: localImageId,
			prompt: data.prompt,
			negativePrompt: null,
			model: data.model,
			publicUrl: item.imageUrl,
			storagePath: item.mediaId,
			filename: `comic-character-${character.id}-${variantIndex + 1}.png`,
			format: 'png',
			width: dims.width,
			height: dims.height,
			visibility: 'private',
			isFavorite: false,
			downloadCount: 0,
			generationMode: 'reference',
			referenceImageIds: referenceMediaIds,
			comicCharacterId: character.id,
			createdAt: nowIso,
		});

		await comicCharactersStore.appendVariant(character.id, localImageId);

		variantMediaIds.push(localImageId);
		imageUrls.push(item.imageUrl);
	}

	if (variantMediaIds.length === 0) {
		throw new Error('Server lieferte Bilder ohne mediaId — kein Variant gespeichert');
	}

	return {
		variantMediaIds,
		imageUrls,
		prompt: data.prompt,
		model: data.model,
	};
}
