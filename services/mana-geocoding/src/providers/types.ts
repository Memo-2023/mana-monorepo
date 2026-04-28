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
	/** Confidence score 0–1. Photon/Nominatim approximate it from
	 *  `importance`. */
	confidence: number;
	/** Which provider answered — useful for telemetry + UI hints
	 *  ("approximate match" badge for fallback providers). */
	provider: ProviderName;
}

/**
 * Provider identifiers. `photon-self` and `photon` both wrap the same
 * `PhotonProvider` class with different configs:
 *
 *   - `photon-self`: self-hosted Photon (typically on mana-gpu),
 *     `privacy: 'local'`. Eligible for sensitive queries.
 *   - `photon`: public photon.komoot.io, `privacy: 'public'`. Last-resort
 *     fallback for non-sensitive queries when the self-hosted instance
 *     is down.
 *
 * The split exists because the chain identifies providers by name and
 * tracks per-provider health. A single `photon` slot can't simultaneously
 * mean two different backends.
 */
export type ProviderName = 'photon-self' | 'photon' | 'nominatim';

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
	/**
	 * Privacy stance:
	 *   - `'local'`: backend runs on our infrastructure, query content
	 *     never leaves our network. Eligible for sensitive queries.
	 *   - `'public'`: backend is a public third-party API. The query
	 *     content + our outbound IP are visible to that third party.
	 *     Skipped when the chain is in local-only mode (sensitive query).
	 */
	readonly privacy: 'local' | 'public';
	search(req: SearchRequest, signal?: AbortSignal): Promise<ProviderResponse>;
	reverse(req: ReverseRequest, signal?: AbortSignal): Promise<ProviderResponse>;
	/** Cheap probe — `true` means the backend is reachable right now.
	 *  The chain caches this result for `healthCacheMs` so we don't add a
	 *  per-request RTT to every search. */
	health(signal?: AbortSignal): Promise<boolean>;
}
