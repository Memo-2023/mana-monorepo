/**
 * Turn an upload filename into a presentable default garment name.
 *
 * Filenames from e-commerce sources and phone cameras come in as
 * URL-safe slugs with SKU-numbers, duplicate segments, and hyphens —
 * e.g. `17390-gestreiftes-herren-t-shirt-aus-baumwolle-17390-2-w.png`.
 * A raw strip-extension leaves the user staring at that string as the
 * display name and having to manually clean it up. This helper does
 * a best-effort pretty-print so the default label is usable as-is.
 *
 * Rules (order matters):
 *   1. Strip the last extension.
 *   2. Replace underscores + hyphens with spaces.
 *   3. Collapse runs of whitespace.
 *   4. Drop "pure-number" tokens that look like SKU / size codes
 *      (≥ 4 digits AND longer than any letter-only neighbour — matches
 *      `17390`, `2-w` stays because it's not pure digits). The short
 *      alpha-numerics like `4xl` / `w38` are kept; stock codes are not.
 *   5. Title-case each remaining word. "T-Shirt" style hyphenated terms
 *      are rebuilt by re-hyphenating two-letter-max fragments so
 *      `t-shirt` becomes `T-Shirt` and `v-neck` becomes `V-Neck`.
 *   6. Trim trailing punctuation + clamp to 80 characters on a word
 *      boundary so wild inputs don't blow up the UI.
 *
 * Returns a non-empty string — falls back to the trimmed, extension-
 * less original when normalisation would otherwise yield "".
 */
export function prettifyUploadName(filename: string): string {
	const extIdx = filename.lastIndexOf('.');
	const withoutExt = extIdx > 0 ? filename.slice(0, extIdx) : filename;

	const raw = withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
	if (!raw) return filename;

	// Token filter: drop pure-digit tokens of length ≥ 4 (SKU-shaped).
	const tokens = raw.split(' ').filter((t) => !(t.length >= 4 && /^\d+$/.test(t)));

	const titled = tokens
		.map((t) => {
			// "t-shirt" would have been split on hyphens earlier, but if a
			// caller pre-tokenised with hyphens we stitch them back here.
			if (t.includes('-')) {
				return t
					.split('-')
					.map((seg) => capitalise(seg))
					.join('-');
			}
			return capitalise(t);
		})
		.join(' ')
		.replace(/[\s.,;:\-]+$/, '');

	const clamped = clampAtWordBoundary(titled, 80);
	return clamped || withoutExt;
}

function capitalise(word: string): string {
	if (word.length === 0) return word;
	// Keep short tokens that look like codes (`4xl`, `w38`) uppercase
	// for readability. Anything ≤ 2 chars or mixed-digit-letter stays
	// uppercased so `T-Shirt` works and `w38` reads as `W38`.
	if (word.length <= 2 || /[0-9]/.test(word)) {
		return word.toUpperCase();
	}
	return word[0].toUpperCase() + word.slice(1).toLowerCase();
}

function clampAtWordBoundary(s: string, max: number): string {
	if (s.length <= max) return s;
	const cut = s.slice(0, max);
	const lastSpace = cut.lastIndexOf(' ');
	return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:\-]+$/, '');
}
