/**
 * Provider-chain types — shared interface every geocoding backend speaks.
 *
 * The chain (`./chain.ts`) iterates over registered providers in priority
 * order until one returns a non-failure result. Each provider must
 * normalize its native response into the shared `GeocodingResult` shape so
 * the rest of the wrapper (cache, routes, clients) doesn't care which
 * backend served the request.
 */

import type { PlaceCategory } from '../lib/category-map';

/** Normalized result returned to the client. */
export interface GeocodingResult {
	/** Display name (e.g. "Münster Café, Münsterplatz 3, Konstanz") */
	label: string;
	/** Short name (e.g. "Münster Café") */
	name: string;
	latitude: number;
	longitude: number;
	/** Structured address components */
	address: {
		street?: string;
		houseNumber?: string;
		postalCode?: string;
		city?: string;
		state?: string;
		country?: string;
	};
	/** Our Places category, derived from the provider's native taxonomy. */
	category: PlaceCategory;
	/** Raw Pelias categories (food, retail, transport, …) — only present
	 *  when the result came from Pelias. Photon/Nominatim don't have an
	 *  equivalent multi-tag taxonomy. */
	peliasCategories?: string[];
	/** Confidence score 0–1. Pelias provides this natively; Photon/Nominatim
	 *  approximate it from `importance`. */
	confidence: number;
	/** Which provider answered — useful for telemetry + UI hints
	 *  ("approximate match" badge for fallback providers). */
	provider: ProviderName;
}

export type ProviderName = 'pelias' | 'photon' | 'nominatim';

export interface SearchRequest {
	q: string;
	limit: number;
	lang: string;
	focusLat?: string;
	focusLon?: string;
}

export interface ReverseRequest {
	lat: string;
	lon: string;
	lang: string;
}

/**
 * A provider answers one of three ways:
 *   - `{ ok: true, results }` — backend reachable, returned its best guess
 *     (which may be `[]` if no match was found — a clean zero is still a
 *     successful answer, not a fallthrough trigger)
 *   - `{ ok: false, kind: 'unreachable' }` — network / 5xx / timeout
 *   - `{ ok: false, kind: 'rate_limited' }` — 429 from public APIs
 *
 * The chain falls through on `ok: false` only. An empty `results` array
 * stops the chain — otherwise an obscure address that legitimately doesn't
 * match would needlessly hit every public API down the list.
 */
export type ProviderResponse =
	| { ok: true; results: GeocodingResult[] }
	| { ok: false; kind: 'unreachable' | 'rate_limited'; status?: number; error?: string };

export interface GeocodingProvider {
	readonly name: ProviderName;
	search(req: SearchRequest, signal?: AbortSignal): Promise<ProviderResponse>;
	reverse(req: ReverseRequest, signal?: AbortSignal): Promise<ProviderResponse>;
	/** Cheap probe — `true` means the backend is reachable right now.
	 *  The chain caches this result for `healthCacheMs` so we don't add a
	 *  per-request RTT to every search. */
	health(signal?: AbortSignal): Promise<boolean>;
}
