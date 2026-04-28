/**
 * Nominatim provider — public OSM endpoint at nominatim.openstreetmap.org.
 *
 * Strict 1-req/sec policy per usage policy. The provider takes a
 * `RateLimiter` so a per-process Nominatim queue can be shared across
 * search/reverse. A custom `User-Agent` is required (Nominatim returns
 * 403 to default-UA fetches).
 *
 * Compared to Pelias/Photon, Nominatim returns a single flat array
 * rather than GeoJSON. We adapt the shape and synthesize a confidence
 * score from `importance`.
 *
 * https://nominatim.org/release-docs/develop/api/Search/
 * https://operations.osmfoundation.org/policies/nominatim/
 */

import { mapOsmTagToPlaceCategory } from '../lib/osm-category-map';
import type { RateLimiter } from '../lib/rate-limiter';
import type {
	GeocodingProvider,
	GeocodingResult,
	ProviderResponse,
	ReverseRequest,
	SearchRequest,
} from './types';

export interface NominatimConfig {
	apiUrl: string;
	userAgent: string;
	timeoutMs: number;
}

export class NominatimProvider implements GeocodingProvider {
	readonly name = 'nominatim' as const;

	constructor(
		private readonly config: NominatimConfig,
		private readonly limiter: RateLimiter
	) {}

	async search(req: SearchRequest, signal?: AbortSignal): Promise<ProviderResponse> {
		const params = new URLSearchParams({
			q: req.q.trim(),
			format: 'json',
			addressdetails: '1',
			limit: String(req.limit),
			'accept-language': req.lang,
		});

		try {
			const json = await this.limiter.run(
				() => this.fetchJson<NominatimSearchResult[]>(`/search?${params}`, signal),
				signal
			);
			if (!json.ok) {
				return {
					ok: false,
					kind: json.status === 429 ? 'rate_limited' : 'unreachable',
					status: json.status,
				};
			}
			return { ok: true, results: json.data.map(normalizeNominatimResult) };
		} catch (e) {
			return { ok: false, kind: 'unreachable', error: errorMessage(e) };
		}
	}

	async reverse(req: ReverseRequest, signal?: AbortSignal): Promise<ProviderResponse> {
		const params = new URLSearchParams({
			lat: req.lat,
			lon: req.lon,
			format: 'json',
			addressdetails: '1',
			'accept-language': req.lang,
		});

		try {
			const json = await this.limiter.run(
				() => this.fetchJson<NominatimSearchResult>(`/reverse?${params}`, signal),
				signal
			);
			if (!json.ok) {
				return {
					ok: false,
					kind: json.status === 429 ? 'rate_limited' : 'unreachable',
					status: json.status,
				};
			}
			// /reverse returns a single object rather than an array. Nominatim
			// also returns `{ error: 'Unable to geocode' }` with status 200
			// when no result was found — treat that as an empty success.
			const single = json.data;
			if (!single || (single as unknown as { error?: string }).error) {
				return { ok: true, results: [] };
			}
			return { ok: true, results: [normalizeNominatimResult(single)] };
		} catch (e) {
			return { ok: false, kind: 'unreachable', error: errorMessage(e) };
		}
	}

	async health(signal?: AbortSignal): Promise<boolean> {
		try {
			// Nominatim exposes /status as a no-rate-limit health page.
			// Use a fresh fetch (don't go through the limiter) so a backed-up
			// search queue doesn't make health checks artificially fail.
			const res = await fetch(`${this.config.apiUrl}/status?format=json`, {
				signal: combineSignals(signal, AbortSignal.timeout(this.config.timeoutMs)),
				headers: { 'User-Agent': this.config.userAgent },
			});
			return res.ok;
		} catch {
			return false;
		}
	}

	private async fetchJson<T>(
		path: string,
		signal?: AbortSignal
	): Promise<{ ok: true; status: number; data: T } | { ok: false; status: number }> {
		const res = await fetch(`${this.config.apiUrl}${path}`, {
			signal: combineSignals(signal, AbortSignal.timeout(this.config.timeoutMs)),
			headers: { 'User-Agent': this.config.userAgent },
		});
		if (!res.ok) return { ok: false, status: res.status };
		const data = (await res.json()) as T;
		return { ok: true, status: res.status, data };
	}
}

// --- Nominatim native types ---

interface NominatimSearchResult {
	place_id?: number;
	osm_type?: string;
	osm_id?: number;
	lat: string;
	lon: string;
	display_name?: string;
	/** OSM `class` (amenity, shop, …) */
	class?: string;
	/** OSM `type` (restaurant, supermarket, …) */
	type?: string;
	/** Top-level name when present (venue queries). For pure addresses Nominatim
	 *  doesn't fill this — we fall back to the first address line. */
	name?: string;
	importance?: number;
	address?: {
		road?: string;
		house_number?: string;
		postcode?: string;
		city?: string;
		town?: string;
		village?: string;
		hamlet?: string;
		state?: string;
		country?: string;
		country_code?: string;
		// Nominatim returns the venue name under one of these keys depending
		// on the OSM class. We try them in order.
		amenity?: string;
		shop?: string;
		tourism?: string;
		leisure?: string;
		building?: string;
	};
}

export function normalizeNominatimResult(r: NominatimSearchResult): GeocodingResult {
	const lat = parseFloat(r.lat);
	const lon = parseFloat(r.lon);
	const a = r.address ?? {};

	// Nominatim's `display_name` is a comma-separated label that includes
	// hierarchy noise (county, district, region) we don't want. Build our
	// own from the structured fields when available; fall back to display_name.
	const venueName = r.name || a.amenity || a.shop || a.tourism || a.leisure || '';
	const street = a.road;
	const city = a.city || a.town || a.village || a.hamlet;
	const label = buildNominatimLabel({
		venueName,
		street,
		houseNumber: a.house_number,
		postalCode: a.postcode,
		city,
		country: a.country,
		fallbackDisplayName: r.display_name,
	});

	return {
		label,
		name: venueName,
		latitude: lat,
		longitude: lon,
		address: {
			street,
			houseNumber: a.house_number,
			postalCode: a.postcode,
			city,
			state: a.state,
			country: a.country,
		},
		category: mapOsmTagToPlaceCategory(r.class, r.type),
		confidence: typeof r.importance === 'number' ? r.importance : 0.5,
		provider: 'nominatim',
	};
}

interface LabelParts {
	venueName: string;
	street?: string;
	houseNumber?: string;
	postalCode?: string;
	city?: string;
	country?: string;
	fallbackDisplayName?: string;
}

function buildNominatimLabel(parts: LabelParts): string {
	const streetLine = [parts.street, parts.houseNumber].filter(Boolean).join(' ');
	const cityLine = [parts.postalCode, parts.city].filter(Boolean).join(' ');
	const composed = [parts.venueName, streetLine, cityLine, parts.country]
		.filter((part) => part && part.length > 0)
		.join(', ');
	return composed || parts.fallbackDisplayName || '';
}

function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

function combineSignals(...signals: Array<AbortSignal | undefined>): AbortSignal {
	const real = signals.filter((s): s is AbortSignal => !!s);
	if (real.length === 1) return real[0];
	const ctrl = new AbortController();
	for (const s of real) {
		if (s.aborted) {
			ctrl.abort(s.reason);
			break;
		}
		s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true });
	}
	return ctrl.signal;
}
