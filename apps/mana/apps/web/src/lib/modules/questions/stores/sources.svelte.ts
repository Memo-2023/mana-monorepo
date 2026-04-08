/**
 * Session-scoped cache for research sources.
 *
 * Sources live exclusively on the server (research.sources table) — they
 * are public web content and we deliberately don't sync them into
 * IndexedDB. The downside: every time the user opens an answer with
 * citations we'd otherwise re-hit /api/v1/research/:id/sources.
 *
 * This little store keeps the result in memory for the lifetime of the
 * tab (no persistence) and de-duplicates concurrent fetches so opening
 * three citation popovers in a row only triggers one network round-trip.
 */

import { researchApi, type ResearchSource } from '$lib/api/research';

const cache = new Map<string, ResearchSource[]>();
const inFlight = new Map<string, Promise<ResearchSource[]>>();

/**
 * Fetch (or return cached) sources for a research run. Concurrent calls
 * for the same id share the same underlying fetch.
 */
export async function loadSources(researchResultId: string): Promise<ResearchSource[]> {
	const cached = cache.get(researchResultId);
	if (cached) return cached;

	const pending = inFlight.get(researchResultId);
	if (pending) return pending;

	const promise = researchApi
		.listSources(researchResultId)
		.then((sources) => {
			cache.set(researchResultId, sources);
			inFlight.delete(researchResultId);
			return sources;
		})
		.catch((err) => {
			inFlight.delete(researchResultId);
			throw err;
		});

	inFlight.set(researchResultId, promise);
	return promise;
}

/** Drop a single research run from the cache (e.g. after re-running). */
export function invalidateSources(researchResultId: string): void {
	cache.delete(researchResultId);
}
