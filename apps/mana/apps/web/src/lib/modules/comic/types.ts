/**
 * Comic module types — one table:
 *
 *   - `comicStories`: a comic story with title, style, fixed character
 *     reference list, and an ordered `panelImageIds: string[]` pointing
 *     at `picture.images` rows generated via the reference-edit flow.
 *
 * Panels themselves live in `picture.images` with `comicStoryId` +
 * `comicPanelIndex` plaintext back-refs — see apps/mana/apps/web/src/
 * lib/modules/picture/types.ts. No second table in this module.
 *
 * Plan: docs/plans/comic-module.md.
 */

import type { BaseRecord } from '@mana/local-store';
import type { VisibilityLevel } from '@mana/shared-privacy';

// ─── Style ────────────────────────────────────────────────────────

/**
 * Closed enum of five visual presets. Each preset is mapped to a
 * prompt-prefix template in `styles.ts`; the backend never sees the
 * enum, only the final composed prompt. Chosen at story-create time
 * and fixed — restyling = new story (or regenerate panels one by one).
 */
export type ComicStyle =
	| 'comic' // US-Comic: Linework + Cell-Shading, kräftige Farben
	| 'manga' // Schwarz/weiß, Screen-Tones, dynamische Perspektiven
	| 'cartoon' // Weich, pastellig, Saturday-Morning-Cartoon
	| 'graphic-novel' // Realistischer, Aquarell/Painterly, stimmungsvoll
	| 'webtoon'; // Vertikal-lesbar, moderne Farbpalette, Soft-Shading

// ─── Panel-Meta ───────────────────────────────────────────────────

/**
 * Per-panel sidecar data that sits on the story (keyed by the panel's
 * `picture.images.id`). The image itself carries only the rendered
 * pixels + structural fields; everything that describes *why* the
 * panel exists — user caption, dialogue text, the exact prompt used,
 * and optional Cross-Module source ref — lives here.
 *
 * Whole object is encrypted as one JSON blob via the encryption
 * registry (same pattern as food.foods / recipes.ingredients).
 */
export interface ComicPanelMeta {
	caption?: string;
	dialogue?: string;
	/** The final prompt passed to gpt-image-2, stored so a user can
	 *  regenerate or tweak without retyping. */
	promptUsed?: string;
	/** Which module-entry, if any, seeded this panel in the AI-Storyboard
	 *  flow (M4). Lets `useStoriesByInput` answer "which comics did I
	 *  make from this journal entry?". Plaintext FKs inside the
	 *  encrypted blob. */
	sourceInput?: {
		module: 'journal' | 'notes' | 'library' | 'writing' | 'calendar';
		entryId: string;
	};
}

// ─── Story ────────────────────────────────────────────────────────

export interface LocalComicStory extends BaseRecord {
	id: string;
	title: string;
	description?: string | null;
	style: ComicStyle;
	/**
	 * Reference-image IDs passed unchanged to every panel-generate call.
	 * Minimum: the primary face-ref from meImages. Optional additions:
	 * body-ref + up to ~3 wardrobe-garment photos for a costume-setup.
	 * Capped at 8 by the backend (MAX_REFERENCE_IMAGES in the /picture/
	 * generate-with-reference endpoint).
	 */
	characterMediaIds: string[];
	/**
	 * Free-text briefing the author writes once, surfaced in the
	 * AI-Storyboard flow (M4) as context Claude sees before suggesting
	 * panel descriptions. Typical: 1–3 sentences ("Ich ärgere mich über
	 * einen Bug in unserer Sync-Logik — mach daraus einen 4-Panel-
	 * Frust-Comic.").
	 */
	storyContext?: string | null;
	/**
	 * Ordered list of `picture.images.id` — the reading order of the
	 * comic. Reorder = rewrite this array. Length implicitly bounded
	 * by `MAX_PANELS_PER_STORY` at the UI layer; the type doesn't
	 * enforce it.
	 */
	panelImageIds: string[];
	/** Keyed by panel image id. Encrypted as a whole JSON blob. */
	panelMeta: Record<string, ComicPanelMeta>;
	tags: string[];
	isFavorite?: boolean;
	isArchived?: boolean;
	visibility?: VisibilityLevel;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
	unlistedToken?: string;
}

export interface ComicStory {
	id: string;
	title: string;
	description?: string;
	style: ComicStyle;
	characterMediaIds: string[];
	storyContext?: string;
	panelImageIds: string[];
	panelMeta: Record<string, ComicPanelMeta>;
	tags: string[];
	isFavorite?: boolean;
	isArchived?: boolean;
	visibility: VisibilityLevel;
	createdAt: string;
	updatedAt: string;
}

export function toStory(local: LocalComicStory): ComicStory {
	return {
		id: local.id,
		title: local.title,
		description: local.description ?? undefined,
		style: local.style,
		characterMediaIds: local.characterMediaIds ?? [],
		storyContext: local.storyContext ?? undefined,
		panelImageIds: local.panelImageIds ?? [],
		panelMeta: local.panelMeta ?? {},
		tags: local.tags ?? [],
		isFavorite: local.isFavorite,
		isArchived: local.isArchived,
		visibility: local.visibility ?? 'space',
		createdAt: local.createdAt ?? '',
		updatedAt: local.updatedAt ?? '',
	};
}

/** Thumbnail / cover panel for a story. `null` for stories without any
 *  generated panel yet (they render a placeholder in StoryCard). */
export function storyCoverPanelId(story: Pick<ComicStory, 'panelImageIds'>): string | null {
	return story.panelImageIds[0] ?? null;
}
