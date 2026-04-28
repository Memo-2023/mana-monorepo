/**
 * Pure URL-list parser for the bulk-import flow. Extracted into its
 * own module so tests can import + exercise it without booting Dexie
 * (collections.ts and stores/imports.svelte.ts have a transitive
 * dependency on the database, which won't open under fake-indexeddb
 * if any registered table is currently in a half-migrated state).
 *
 * Plan: docs/plans/articles-bulk-import.md.
 */

export interface ParsedUrls {
	valid: string[];
	invalid: string[];
	duplicates: string[];
}

/**
 * Splits the raw textarea blob on any whitespace + comma, drops empty
 * tokens, validates with `new URL` + http(s) scheme check, and
 * deduplicates while preserving first-occurrence order.
 *
 *   parseUrls('https://a.com\nhttps://a.com\nbroken')
 *     → { valid: ['https://a.com/'],
 *         invalid: ['broken'],
 *         duplicates: ['https://a.com/'] }
 */
export function parseUrls(raw: string): ParsedUrls {
	const tokens = raw
		.split(/[\s,]+/)
		.map((t) => t.trim())
		.filter(Boolean);
	const valid: string[] = [];
	const invalid: string[] = [];
	const duplicates: string[] = [];
	const seen = new Set<string>();
	for (const token of tokens) {
		// Reject anything without an http(s) scheme — `new URL('foo.com')`
		// would happily accept it as an opaque URI and the server-side
		// fetch would then 400 on us.
		let parsed: URL;
		try {
			parsed = new URL(token);
		} catch {
			invalid.push(token);
			continue;
		}
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			invalid.push(token);
			continue;
		}
		const canonical = parsed.toString();
		if (seen.has(canonical)) {
			duplicates.push(canonical);
			continue;
		}
		seen.add(canonical);
		valid.push(canonical);
	}
	return { valid, invalid, duplicates };
}
