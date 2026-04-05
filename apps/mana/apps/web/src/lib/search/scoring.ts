/**
 * Cross-App Search — Text matching and relevance scoring
 */

/**
 * Score a text field against a query string.
 * Returns 0 if no match, or a score between 0.1–1.0 based on match quality.
 */
export function scoreMatch(text: string | undefined | null, query: string, weight: number): number {
	if (!text) return 0;

	const lower = text.toLowerCase();
	const q = query.toLowerCase();

	if (lower === q) return 1.0 * weight;
	if (lower.startsWith(q)) return 0.9 * weight;
	if (lower.includes(q)) return 0.7 * weight;

	// Word-boundary match (query matches start of any word)
	const words = lower.split(/\s+/);
	if (words.some((w) => w.startsWith(q))) return 0.8 * weight;

	return 0;
}

/**
 * Score a record against a query across multiple fields.
 * Returns the highest score from any field, plus the name of the matched field.
 */
export function scoreRecord(
	fields: { name: string; value: string | undefined | null; weight: number }[],
	query: string
): { score: number; matchedField?: string } {
	let best = 0;
	let matchedField: string | undefined;

	for (const field of fields) {
		const s = scoreMatch(field.value, query, field.weight);
		if (s > best) {
			best = s;
			matchedField = field.name;
		}
	}

	return { score: best, matchedField };
}

/**
 * Truncate text to a max length, adding ellipsis if needed.
 */
export function truncateSubtitle(text: string | undefined | null, maxLen = 80): string | undefined {
	if (!text) return undefined;
	const clean = text.replace(/\n/g, ' ').trim();
	if (clean.length <= maxLen) return clean;
	return clean.slice(0, maxLen).trimEnd() + '...';
}
