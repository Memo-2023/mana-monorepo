/**
 * Deduplication for discovered events.
 *
 * Hash is based on normalized title + date + location so the same event
 * from different sources (or re-crawls of the same source) collapses
 * into a single row.
 */

import type { NormalizedEvent } from './types';

/**
 * Compute a SHA-256 hex hash for deduplication.
 * Key components: lowercased title + ISO date (no time) + lowercased location.
 */
export async function computeDedupeHash(event: NormalizedEvent): Promise<string> {
	const title = event.title.toLowerCase().trim();
	const date = event.startAt.toISOString().slice(0, 10); // YYYY-MM-DD
	const location = (event.location ?? '').toLowerCase().trim();

	const input = `${title}|${date}|${location}`;
	const encoded = new TextEncoder().encode(input);
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	const hashArray = new Uint8Array(hashBuffer);
	return Array.from(hashArray)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
