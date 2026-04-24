/**
 * Panel generation client. Composes a reference-based image-edit call
 * against `/api/v1/picture/generate-with-reference` using the story's
 * fixed `characterMediaIds` plus the story-wide style-prefix, then
 * persists the result into `picture.images` with `comicStoryId` +
 * `comicPanelIndex` back-refs and appends the panel to the story via
 * `comicStoriesStore.appendPanel`.
 *
 * Same HTTP shape as `wardrobe/api/try-on.ts` — Comics reuse the
 * endpoint verbatim. Only difference: character refs come from the
 * story row (not reactively from useImageByPrimary), and the result
 * goes through appendPanel into the story's ordered panel list.
 *
 * Plan: docs/plans/comic-module.md M2.
 */

import { getManaApiUrl } from '$lib/api/config';
import { authStore } from '$lib/stores/auth.svelte';
import { imagesStore } from '$lib/modules/picture/stores/images.svelte';
import { comicStoriesStore } from '../stores/stories.svelte';
import { composePanelPrompt } from '../styles';
import type { ComicPanelMeta, ComicStory } from '../types';

/**
 * Panel size. 1024×1024 is the comic-default — square panels compose
 * into a strip or grid cleanly. 1024×1536 is available for verticaly-
 * oriented "Webtoon"-style long shots. The backend supports more but
 * M2 keeps the picker small.
 */
export type PanelSize = '1024x1024' | '1024x1536';

export interface RunPanelGenerateParams {
	story: ComicStory;
	panelPrompt: string;
	caption?: string;
	dialogue?: string;
	/** Tags the panel with the module-entry it was seeded from (M4 AI-
	 *  Storyboard). Ignored in M2 single-panel flow. */
	sourceInput?: ComicPanelMeta['sourceInput'];
	quality?: 'low' | 'medium' | 'high';
	size?: PanelSize;
}

export interface RunPanelGenerateResult {
	imageId: string;
	imageUrl: string;
	prompt: string;
	model: string;
	panelIndex: number;
}

function dimsForSize(size: PanelSize): { width: number; height: number } {
	if (size === '1024x1536') return { width: 1024, height: 1536 };
	return { width: 1024, height: 1024 };
}

/**
 * Shared low-level POST. Mirrors wardrobe's callGenerateWithReference
 * so the error matrix stays identical across the two consumers of
 * this endpoint.
 */
async function callGenerateWithReference(opts: {
	prompt: string;
	referenceMediaIds: string[];
	quality: 'low' | 'medium' | 'high';
	size: PanelSize;
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
			model: 'openai/gpt-image-2',
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
				'Ein oder mehrere Referenzbilder sind im Server-Ownership-Check durchgefallen — prüfe, ob Face/Body in diesem Space existieren.'
			);
		}
		const label = body.error ?? `Panel-Generierung fehlgeschlagen (${res.status})`;
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

/**
 * Generate one panel for a story. The story provides the fixed
 * reference-image list (face + optional body + optional garments —
 * chosen once at story-create time); this call only adds the panel
 * prompt + caption + dialogue on top of the story's style prefix.
 */
export async function runPanelGenerate(
	params: RunPanelGenerateParams
): Promise<RunPanelGenerateResult> {
	const { story, panelPrompt, caption, dialogue, sourceInput } = params;

	if (story.characterMediaIds.length === 0) {
		throw new Error('Story hat keine Character-Referenz — bitte Face-Ref hinterlegen.');
	}
	if (!panelPrompt.trim()) {
		throw new Error('Panel-Prompt ist leer.');
	}

	// Style-prefix + panelPrompt + caption/dialog hints, composed in
	// styles.ts. The backend never sees the style enum — it only sees
	// the final prompt string.
	const composedPrompt = composePanelPrompt({
		style: story.style,
		panelPrompt,
		caption,
		dialogue,
	});

	const effectiveSize: PanelSize =
		params.size ?? (story.style === 'webtoon' ? '1024x1536' : '1024x1024');
	const effectiveQuality = params.quality ?? 'medium';

	// Cap at 8 references (server limit). If the story somehow has more
	// in its characterMediaIds (shouldn't — UI caps at ~5), truncate and
	// warn. Face-ref is [0] by convention.
	const referenceMediaIds = story.characterMediaIds.slice(0, 8);

	const result = await callGenerateWithReference({
		prompt: composedPrompt,
		referenceMediaIds,
		quality: effectiveQuality,
		size: effectiveSize,
	});

	const now = new Date().toISOString();
	const localImageId = crypto.randomUUID();
	const dims = dimsForSize(effectiveSize);
	const panelIndex = story.panelImageIds.length; // zero-based

	await imagesStore.insert({
		id: localImageId,
		prompt: result.prompt,
		negativePrompt: null,
		model: result.model,
		publicUrl: result.imageUrl,
		storagePath: result.mediaId,
		filename: `comic-panel-${story.id}-${panelIndex + 1}.png`,
		format: 'png',
		width: dims.width,
		height: dims.height,
		visibility: 'private',
		isFavorite: false,
		downloadCount: 0,
		generationMode: 'reference',
		referenceImageIds: referenceMediaIds,
		comicStoryId: story.id,
		comicPanelIndex: panelIndex,
		createdAt: now,
		updatedAt: now,
	});

	await comicStoriesStore.appendPanel(story.id, localImageId, {
		caption: caption?.trim() || undefined,
		dialogue: dialogue?.trim() || undefined,
		promptUsed: composedPrompt,
		sourceInput,
	});

	return {
		imageId: localImageId,
		imageUrl: result.imageUrl,
		prompt: result.prompt,
		model: result.model,
		panelIndex,
	};
}
