/**
 * Comic module — labels, caps, defaults.
 */

import type { ComicStyle } from './types';

export const STYLE_LABELS: Record<ComicStyle, { de: string; en: string }> = {
	comic: { de: 'US-Comic', en: 'US-Comic' },
	manga: { de: 'Manga', en: 'Manga' },
	cartoon: { de: 'Cartoon', en: 'Cartoon' },
	'graphic-novel': { de: 'Graphic Novel', en: 'Graphic Novel' },
	webtoon: { de: 'Webtoon', en: 'Webtoon' },
};

export const STYLE_ORDER: readonly ComicStyle[] = [
	'comic',
	'manga',
	'cartoon',
	'graphic-novel',
	'webtoon',
] as const;

/**
 * Hard client-side cap on panels per story. gpt-image-2 consistency
 * degrades beyond ~8–10 panels even with identical refs; 12 is the
 * "long comic" ceiling before restyling. UI warns softly ≥ 8. Plan
 * offene-frage #1.
 */
export const MAX_PANELS_PER_STORY = 12;
export const PANEL_COUNT_WARN_THRESHOLD = 8;

/**
 * Default panel count the AI-Storyboard flow (M4) asks Claude to
 * generate when no explicit number is chosen. Slider range 2–8 in UI.
 */
export const DEFAULT_STORYBOARD_PANEL_COUNT = 4;
export const MIN_STORYBOARD_PANEL_COUNT = 2;
export const MAX_STORYBOARD_PANEL_COUNT = 8;
