/**
 * Pelias provider — primary backend, self-hosted with the DACH OSM index.
 *
 * Forward-search uses /autocomplete first (fast venue match) and falls
 * back to /search if autocomplete returns zero features (autocomplete
 * deliberately excludes the address layer for perf).
 */

import { mapPeliasToPlaceCategory } from '../lib/category-map';
import type {
	GeocodingProvider,
	GeocodingResult,
	ProviderResponse,
	ReverseRequest,
	SearchRequest,
} from './types';

export interface PeliasConfig {
	apiUrl: string;
	timeoutMs: number;
}

export class PeliasProvider implements GeocodingProvider {
	readonly name = 'pelias' as const;
	readonly privacy = 'local' as const;

	constructor(private readonly config: PeliasConfig) {}

	async search(req: SearchRequest, signal?: AbortSignal): Promise<ProviderResponse> {
		const params = new URLSearchParams({
			text: req.q.trim(),
			size: String(req.limit),
			lang: req.lang,
		});
		if (req.focusLat && req.focusLon) {
			params.set('focus.point.lat', req.focusLat);
			params.set('focus.point.lon', req.focusLon);
		}

		// /autocomplete first (fast venue match), then /search if empty.
		// Both attempts are wrapped in the same external timeout signal so
		// a cumulative slow Pelias still falls through to the next provider.
		try {
			const ac = await this.fetch(`/autocomplete?${params}`, signal);
			if (!ac.ok) return { ok: false, kind: 'unreachable', status: ac.status };
			let features = ac.features;

			if (features.length === 0) {
				const s = await this.fetch(`/search?${params}`, signal);
				if (s.ok) features = s.features;
				// /search returning a non-OK after /autocomplete returned OK-but-empty
				// is a clean zero-results answer, not a fall-through. We trust the
				// successful autocomplete probe.
			}

			return { ok: true, results: features.map(normalizePeliasFeature) };
		} catch (e) {
			return { ok: false, kind: 'unreachable', error: errorMessage(e) };
		}
	}

	async reverse(req: ReverseRequest, signal?: AbortSignal): Promise<ProviderResponse> {
		const params = new URLSearchParams({
			'point.lat': req.lat,
			'point.lon': req.lon,
			size: '3',
			lang: req.lang,
		});

		try {
			const r = await this.fetch(`/reverse?${params}`, signal);
			if (!r.ok) return { ok: false, kind: 'unreachable', status: r.status };
			return { ok: true, results: r.features.map(normalizePeliasFeature) };
		} catch (e) {
			return { ok: false, kind: 'unreachable', error: errorMessage(e) };
		}
	}

	async health(signal?: AbortSignal): Promise<boolean> {
		try {
			const url = `${this.config.apiUrl}/status`;
			const res = await fetch(url, {
				signal: combineSignals(signal, AbortSignal.timeout(this.config.timeoutMs)),
			});
			// /v1/status doesn't exist on every Pelias version — a 404 still
			// means the server is up. Anything else (5xx, ECONNREFUSED, timeout)
			// is unhealthy.
			return res.ok || res.status === 404;
		} catch {
			return false;
		}
	}

	private async fetch(
		path: string,
		signal?: AbortSignal
	): Promise<{ ok: boolean; status: number; features: PeliasFeature[] }> {
		const res = await fetch(`${this.config.apiUrl}${path}`, {
			signal: combineSignals(signal, AbortSignal.timeout(this.config.timeoutMs)),
		});
		if (!res.ok) return { ok: false, status: res.status, features: [] };
		const data = (await res.json()) as PeliasResponse;
		return { ok: true, status: res.status, features: data.features ?? [] };
	}
}

// --- Pelias native types ---

interface PeliasResponse {
	type: 'FeatureCollection';
	features: PeliasFeature[];
}

interface PeliasFeature {
	type: 'Feature';
	geometry: {
		type: 'Point';
		coordinates: [number, number]; // [lon, lat]
	};
	properties: {
		id?: string;
		name?: string;
		label?: string;
		confidence?: number;
		layer?: string;
		street?: string;
		housenumber?: string;
		postalcode?: string;
		locality?: string;
		region?: string;
		country?: string;
		category?: string[];
	};
}

export function normalizePeliasFeature(feature: PeliasFeature): GeocodingResult {
	const props = feature.properties;
	const [lon, lat] = feature.geometry.coordinates;

	return {
		label: props.label || props.name || '',
		name: props.name || '',
		latitude: lat,
		longitude: lon,
		address: {
			street: props.street,
			houseNumber: props.housenumber,
			postalCode: props.postalcode,
			city: props.locality,
			state: props.region,
			country: props.country,
		},
		category: mapPeliasToPlaceCategory(props.category, props.layer),
		peliasCategories: props.category,
		confidence: props.confidence ?? 0,
		provider: 'pelias',
	};
}

function errorMessage(e: unknown): string {
	return e instanceof Error ? e.message : String(e);
}

/** Combine an external AbortSignal with our own timeout signal. AbortSignal.any
 *  exists in Bun but TS typing is patchy across runtimes — small helper. */
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
