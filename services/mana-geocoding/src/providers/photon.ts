/**
 * Photon provider — komoot's public photon.komoot.io.
 *
 * Photon is built on top of an OSM index (Elasticsearch + Nominatim
 * importer). The HTTP shape is GeoJSON FeatureCollection with `properties`
 * holding `osm_key`/`osm_value` raw OSM tags + structured address fields.
 *
 * Same class powers both `photon-self` (self-hosted, privacy: 'local')
 * and `photon` (public komoot.io, privacy: 'public'). Reverse-geocoding
 * takes lon/lat (note the order). Confidence is approximated from
 * `importance` (0–1) when present, else 0.5 as a neutral default.
 */

import { mapOsmTagToPlaceCategory } from '../lib/osm-category-map';
import { PUBLIC_FOCUS_DECIMALS, PUBLIC_REVERSE_DECIMALS, quantizeCoord } from '../lib/privacy';
import type {
	GeocodingProvider,
	GeocodingResult,
	ProviderResponse,
	ReverseRequest,
	SearchRequest,
} from './types';

export interface PhotonConfig {
	apiUrl: string;
	timeoutMs: number;
	/** Override the default provider name. Used when registering a second
	 *  Photon instance pointing at a self-hosted backend (`'photon-self'`)
	 *  alongside the public komoot endpoint (`'photon'`). */
	name?: 'photon' | 'photon-self';
	/** Override the default privacy stance. Self-hosted Photon on our
	 *  infrastructure is `'local'`; public komoot is `'public'`. */
	privacy?: 'local' | 'public';
}

export class PhotonProvider implements GeocodingProvider {
	readonly name: 'photon' | 'photon-self';
	readonly privacy: 'local' | 'public';

	constructor(private readonly config: PhotonConfig) {
		this.name = config.name ?? 'photon';
		this.privacy = config.privacy ?? 'public';
	}

	async search(req: SearchRequest, signal?: AbortSignal): Promise<ProviderResponse> {
		const params = new URLSearchParams({
			q: req.q.trim(),
			limit: String(req.limit),
			lang: req.lang,
		});
		// Quantize the user's focus point before forwarding. Photon biases
		// results toward "near this lat/lon"; we don't need to send the
		// user's exact GPS — 2 decimals (~1.1 km) is enough for the bias
		// to work and keeps the user's home/workplace coords out of
		// Photon's logs.
		const qLat = quantizeCoord(req.focusLat, PUBLIC_FOCUS_DECIMALS);
		const qLon = quantizeCoord(req.focusLon, PUBLIC_FOCUS_DECIMALS);
		if (qLat && qLon) {
			params.set('lat', qLat);
			params.set('lon', qLon);
		}

		try {
			const res = await this.fetch(`/api?${params}`, signal);
			if (!res.ok) {
				return {
					ok: false,
					kind: res.status === 429 ? 'rate_limited' : 'unreachable',
					status: res.status,
				};
			}
			return {
				ok: true,
				results: res.features.map((f) => normalizePhotonFeature(f, this.name)),
			};
		} catch (e) {
			return { ok: false, kind: 'unreachable', error: errorMessage(e) };
		}
	}

	async reverse(req: ReverseRequest, signal?: AbortSignal): Promise<ProviderResponse> {
		// Photon expects lon + lat, not point.lat/point.lon. Easy footgun.
		// Quantize to ~110 m so we don't reverse-geocode the user's exact
		// front door — city-block resolution is enough for the Places UI's
		// "What's near me?" use case, and we never want to log a precise
		// home location to a third party.
		const qLat = quantizeCoord(req.lat, PUBLIC_REVERSE_DECIMALS);
		const qLon = quantizeCoord(req.lon, PUBLIC_REVERSE_DECIMALS);
		const params = new URLSearchParams({
			lat: qLat ?? req.lat,
			lon: qLon ?? req.lon,
			lang: req.lang,
		});

		try {
			const res = await this.fetch(`/reverse?${params}`, signal);
			if (!res.ok) {
				return {
					ok: false,
					kind: res.status === 429 ? 'rate_limited' : 'unreachable',
					status: res.status,
				};
			}
			return {
				ok: true,
				results: res.features.map((f) => normalizePhotonFeature(f, this.name)),
			};
		} catch (e) {
			return { ok: false, kind: 'unreachable', error: errorMessage(e) };
		}
	}

	async health(signal?: AbortSignal): Promise<boolean> {
		try {
			// Tiny probe — searching for a Konstanz landmark Photon should
			// always know. We don't care about the content, only the HTTP
			// status. 200/empty is fine; anything else marks unhealthy.
			const res = await fetch(`${this.config.apiUrl}/api?q=Konstanz&limit=1`, {
				signal: combineSignals(signal, AbortSignal.timeout(this.config.timeoutMs)),
			});
			return res.ok;
		} catch {
			return false;
		}
	}

	private async fetch(
		path: string,
		signal?: AbortSignal
	): Promise<{ ok: boolean; status: number; features: PhotonFeature[] }> {
		const res = await fetch(`${this.config.apiUrl}${path}`, {
			signal: combineSignals(signal, AbortSignal.timeout(this.config.timeoutMs)),
		});
		if (!res.ok) return { ok: false, status: res.status, features: [] };
		const data = (await res.json()) as PhotonResponse;
		return { ok: true, status: res.status, features: data.features ?? [] };
	}
}

// --- Photon native types ---

interface PhotonResponse {
	type: 'FeatureCollection';
	features: PhotonFeature[];
}

interface PhotonFeature {
	type: 'Feature';
	geometry: {
		type: 'Point';
		coordinates: [number, number]; // [lon, lat]
	};
	properties: {
		osm_id?: number;
		osm_type?: string; // N | W | R
		osm_key?: string; // amenity, shop, …
		osm_value?: string; // restaurant, supermarket, …
		name?: string;
		country?: string;
		state?: string;
		county?: string;
		city?: string;
		district?: string;
		street?: string;
		housenumber?: string;
		postcode?: string;
		extent?: [number, number, number, number];
		/** 0–1 importance score (Nominatim's importance, propagated by Photon). */
		importance?: number;
		/** Used by /reverse to summarise the match — not always populated. */
		type?: string;
	};
}

/**
 * @param providerName Which provider tag to stamp on the result. Defaults
 *   to `'photon'` (public komoot) for backward compat. Pass `'photon-self'`
 *   to mark results as coming from our self-hosted instance — useful for
 *   the UI to know "this came from local infra, no privacy compromise".
 */
export function normalizePhotonFeature(
	f: PhotonFeature,
	providerName: 'photon' | 'photon-self' = 'photon'
): GeocodingResult {
	const props = f.properties;
	const [lon, lat] = f.geometry.coordinates;

	const label = buildPhotonLabel(props);
	const category = mapOsmTagToPlaceCategory(props.osm_key, props.osm_value);

	return {
		label,
		name: props.name || '',
		latitude: lat,
		longitude: lon,
		address: {
			street: props.street,
			houseNumber: props.housenumber,
			postalCode: props.postcode,
			city: props.city || props.district || props.county,
			state: props.state,
			country: props.country,
		},
		category,
		confidence: typeof props.importance === 'number' ? props.importance : 0.5,
		provider: providerName,
	};
}

/** Photon doesn't return a single `display_name` like Nominatim — we
 *  build one from the structured fields. Order matches a typical German
 *  postal address: "Name, Straße Nr, PLZ Ort, Land". */
function buildPhotonLabel(props: PhotonFeature['properties']): string {
	const streetLine = [props.street, props.housenumber].filter(Boolean).join(' ');
	const cityLine = [props.postcode, props.city || props.district || props.county]
		.filter(Boolean)
		.join(' ');
	return [props.name, streetLine, cityLine, props.country]
		.filter((part) => part && part.length > 0)
		.join(', ');
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
