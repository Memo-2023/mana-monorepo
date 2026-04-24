/**
 * Prompt-prefix templates per visual style. The prefix is prepended to
 * every panel prompt in `runPanelGenerate` (M2); gpt-image-2 sees the
 * composite (stylePrefix + panelPrompt + captionHint + dialogueHint),
 * never the enum itself. Keep prefixes short and directive — they're
 * spent on every call.
 *
 * Adding a style = extending `ComicStyle` in types.ts + `STYLE_LABELS`
 * in constants.ts + a prefix here. The three stay in lockstep because
 * Record<ComicStyle, …> forces exhaustive coverage.
 */

import type { ComicStyle } from './types';

export const STYLE_PREFIXES: Record<ComicStyle, string> = {
	comic:
		'US comic book illustration, bold clean linework, vivid cell-shaded coloring, dramatic lighting, high contrast, comic-panel framing',
	manga:
		'Japanese manga illustration, black and white line art with screen tones, dynamic perspective, expressive character design, dramatic motion lines',
	cartoon:
		'soft pastel cartoon illustration, rounded friendly shapes, warm saturated colors, Saturday-morning animation style, simple clean backgrounds',
	'graphic-novel':
		'graphic novel illustration, painterly watercolor style, muted atmospheric palette, cinematic composition, moody naturalistic lighting',
	webtoon:
		'modern webtoon illustration, clean vertical-scroll framing, bright saturated colors, soft cel-shading, expressive character close-ups',
};

/**
 * Compose the final gpt-image-2 prompt for a single panel. Caption and
 * dialogue (both optional) are rendered directly into the image by
 * gpt-image-2 — no SVG overlay. Decision #4 in docs/plans/comic-module.md.
 *
 * The text-rendering language is whatever the user typed (gpt-image-2
 * handles multiple languages, English is most stable but German works
 * for short strings). UI surfaces an English-preferred hint.
 */
export function composePanelPrompt(input: {
	style: ComicStyle;
	panelPrompt: string;
	caption?: string;
	dialogue?: string;
}): string {
	const parts: string[] = [STYLE_PREFIXES[input.style], input.panelPrompt.trim()];
	const caption = input.caption?.trim();
	const dialogue = input.dialogue?.trim();
	if (caption) {
		parts.push(`narration caption at the top reading: "${caption}"`);
	}
	if (dialogue) {
		parts.push(`character speaking in a speech bubble saying: "${dialogue}"`);
	}
	return parts.join('. ');
}
