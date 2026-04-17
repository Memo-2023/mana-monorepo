/**
 * Wetter module — weather proxy routes.
 *
 * Proxies Open-Meteo (forecast), DWD (alerts), and Rainbow.ai (nowcast)
 * with in-memory caching to reduce upstream calls.
 */

import { Hono } from 'hono';

const routes = new Hono();

// ─── Cache ─────────────────────────────────────────────────

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
	const entry = cache.get(key);
	if (!entry || Date.now() > entry.expiresAt) {
		cache.delete(key);
		return null;
	}
	return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number): void {
	cache.set(key, { data, expiresAt: Date.now() + ttlMs });
	// Prevent unbounded growth — drop expired entries periodically
	if (cache.size > 500) {
		const now = Date.now();
		for (const [k, v] of cache) {
			if (now > v.expiresAt) cache.delete(k);
		}
	}
}

/** Round coordinates to ~1km grid for cache key */
function coordKey(lat: number, lon: number): string {
	return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
}

const WEATHER_TTL = 15 * 60 * 1000; // 15 min
const ALERTS_TTL = 5 * 60 * 1000; // 5 min

// ─── Open-Meteo: Current + Forecast ────────────────────────

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';
const OPEN_METEO_GEOCODING = 'https://geocoding-api.open-meteo.com/v1';

const CURRENT_VARS = [
	'temperature_2m',
	'apparent_temperature',
	'weather_code',
	'relative_humidity_2m',
	'surface_pressure',
	'wind_speed_10m',
	'wind_direction_10m',
	'uv_index',
	'precipitation',
	'cloud_cover',
	'visibility',
	'is_day',
].join(',');

const HOURLY_VARS = [
	'temperature_2m',
	'precipitation',
	'precipitation_probability',
	'weather_code',
	'wind_speed_10m',
	'wind_direction_10m',
	'relative_humidity_2m',
	'apparent_temperature',
	'is_day',
].join(',');

const DAILY_VARS = [
	'temperature_2m_min',
	'temperature_2m_max',
	'weather_code',
	'precipitation_sum',
	'precipitation_probability_max',
	'sunrise',
	'sunset',
	'uv_index_max',
	'wind_speed_10m_max',
	'wind_direction_10m_dominant',
].join(',');

routes.post('/current', async (c) => {
	const { lat, lon } = await c.req.json<{ lat: number; lon: number }>();
	if (lat == null || lon == null) return c.json({ error: 'lat and lon required' }, 400);

	const key = `current:${coordKey(lat, lon)}`;
	const cached = getCached(key);
	if (cached) return c.json(cached);

	const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=${CURRENT_VARS}&models=icon_d2&timezone=auto`;
	const res = await fetch(url);
	if (!res.ok) return c.json({ error: 'Open-Meteo request failed' }, 502);

	const data = await res.json();
	setCache(key, data, WEATHER_TTL);
	return c.json(data);
});

routes.post('/forecast', async (c) => {
	const { lat, lon } = await c.req.json<{ lat: number; lon: number }>();
	if (lat == null || lon == null) return c.json({ error: 'lat and lon required' }, 400);

	const key = `forecast:${coordKey(lat, lon)}`;
	const cached = getCached(key);
	if (cached) return c.json(cached);

	const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&hourly=${HOURLY_VARS}&daily=${DAILY_VARS}&models=icon_d2&timezone=auto&forecast_hours=48`;
	const res = await fetch(url);
	if (!res.ok) return c.json({ error: 'Open-Meteo request failed' }, 502);

	const data = await res.json();
	setCache(key, data, WEATHER_TTL);
	return c.json(data);
});

// ─── Geocoding (Open-Meteo) ────────────────────────────────

routes.post('/geocode', async (c) => {
	const { query } = await c.req.json<{ query: string }>();
	if (!query) return c.json({ error: 'query required' }, 400);

	const key = `geo:${query.toLowerCase().trim()}`;
	const cached = getCached(key);
	if (cached) return c.json(cached);

	const url = `${OPEN_METEO_GEOCODING}/search?name=${encodeURIComponent(query)}&count=5&language=de&format=json`;
	const res = await fetch(url);
	if (!res.ok) return c.json({ error: 'Geocoding request failed' }, 502);

	const data = (await res.json()) as {
		results?: Array<{
			name: string;
			latitude: number;
			longitude: number;
			country: string;
			admin1?: string;
		}>;
	};
	const results = (data.results ?? []).map((r) => ({
		name: r.name,
		lat: r.latitude,
		lon: r.longitude,
		country: r.country,
		admin1: r.admin1,
	}));

	const payload = { results };
	setCache(key, payload, WEATHER_TTL);
	return c.json(payload);
});

// ─── DWD Warnings ──────────────────────────────────────────

const DWD_WARNINGS_URL = 'https://dwd.api.proxy.bund.dev/warnings/v2/current';

routes.post('/alerts', async (c) => {
	const { lat, lon } = await c.req.json<{ lat: number; lon: number }>();
	if (lat == null || lon == null) return c.json({ error: 'lat and lon required' }, 400);

	const key = `alerts:${coordKey(lat, lon)}`;
	const cached = getCached(key);
	if (cached) return c.json(cached);

	try {
		const res = await fetch(DWD_WARNINGS_URL, {
			headers: { Accept: 'application/json' },
		});
		if (!res.ok) {
			// DWD sometimes returns non-JSON; fall back gracefully
			return c.json({ alerts: [] });
		}

		const raw = await res.json();
		// DWD warnings are keyed by warning cell IDs — we filter by proximity
		const alerts = extractNearbyAlerts(raw, lat, lon);
		const payload = { alerts };
		setCache(key, payload, ALERTS_TTL);
		return c.json(payload);
	} catch {
		// DWD endpoint can be unreliable — return empty alerts rather than erroring
		return c.json({ alerts: [] });
	}
});

interface DwdWarning {
	headline?: string;
	description?: string;
	severity?: string;
	event?: string;
	start?: number;
	end?: number;
	regionName?: string;
	areaDesc?: string;
}

function extractNearbyAlerts(raw: unknown, _lat: number, _lon: number) {
	// The DWD API returns warnings grouped by region cells.
	// For v1, we return all active warnings (nationwide). A finer spatial
	// filter requires mapping Warnzell IDs to geo areas — planned for v2.
	const alerts: Array<{
		id: string;
		headline: string;
		description: string;
		severity: string;
		event: string;
		start: string;
		end: string;
		regionName: string;
	}> = [];

	if (!raw || typeof raw !== 'object') return alerts;

	const warnings: Record<string, DwdWarning[]> =
		(raw as Record<string, Record<string, DwdWarning[]>>).warnings ?? {};
	let idx = 0;
	for (const [, regionWarnings] of Object.entries(warnings)) {
		if (!Array.isArray(regionWarnings)) continue;
		for (const w of regionWarnings) {
			alerts.push({
				id: `dwd-${idx++}`,
				headline: w.headline ?? '',
				description: w.description ?? '',
				severity: mapDwdSeverity(w.severity),
				event: w.event ?? '',
				start: w.start ? new Date(w.start).toISOString() : '',
				end: w.end ? new Date(w.end).toISOString() : '',
				regionName: w.regionName ?? w.areaDesc ?? '',
			});
		}
	}
	return alerts.slice(0, 50); // cap to avoid huge payloads
}

function mapDwdSeverity(s?: string): string {
	if (!s) return 'minor';
	const lower = s.toLowerCase();
	if (lower.includes('extreme')) return 'extreme';
	if (lower.includes('severe') || lower.includes('schwer')) return 'severe';
	if (lower.includes('moderate') || lower.includes('markant')) return 'moderate';
	return 'minor';
}

// ─── Rainbow.ai Nowcast ────────────────────────────────────

const RAINBOW_API_KEY = process.env.RAINBOW_API_KEY || '';

routes.post('/nowcast', async (c) => {
	const { lat, lon } = await c.req.json<{ lat: number; lon: number }>();
	if (lat == null || lon == null) return c.json({ error: 'lat and lon required' }, 400);

	if (!RAINBOW_API_KEY) {
		// Fallback: use Open-Meteo 15-min precipitation data as nowcast substitute
		return await openMeteoNowcast(c, lat, lon);
	}

	const key = `nowcast:${coordKey(lat, lon)}`;
	const cached = getCached(key);
	if (cached) return c.json(cached);

	try {
		const url = `https://api.rainbow.ai/v2/nowcast?lat=${lat}&lon=${lon}`;
		const res = await fetch(url, {
			headers: { 'X-API-Key': RAINBOW_API_KEY, Accept: 'application/json' },
		});
		if (!res.ok) {
			return await openMeteoNowcast(c, lat, lon);
		}

		const data = await res.json();
		setCache(key, data, 5 * 60 * 1000); // 5min TTL for nowcast
		return c.json(data);
	} catch {
		return await openMeteoNowcast(c, lat, lon);
	}
});

async function openMeteoNowcast(
	c: { json: (data: unknown, status?: number) => Response },
	lat: number,
	lon: number
) {
	const key = `nowcast-om:${coordKey(lat, lon)}`;
	const cached = getCached(key);
	if (cached) return c.json(cached);

	try {
		const url = `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&minutely_15=precipitation&models=icon_d2&timezone=auto&forecast_hours=4`;
		const res = await fetch(url);
		if (!res.ok) return c.json({ minutely: [], summary: 'Keine Niederschlagsdaten verfuegbar' });

		const data = (await res.json()) as {
			minutely_15?: { time?: string[]; precipitation?: number[] };
		};
		const times = data.minutely_15?.time ?? [];
		const precips = data.minutely_15?.precipitation ?? [];
		const minutely = times.map((t: string, i: number) => ({
			time: t,
			precipitation: precips[i] ?? 0,
		}));

		const hasRain = minutely.some((m: { precipitation: number }) => m.precipitation > 0);
		const summary = hasRain ? 'Niederschlag erwartet' : 'Kein Niederschlag erwartet';
		const payload = { minutely, summary };
		setCache(key, payload, 5 * 60 * 1000);
		return c.json(payload);
	} catch {
		return c.json({ minutely: [], summary: 'Keine Niederschlagsdaten verfuegbar' });
	}
}

// ─── Radar Tile Info ───────────────────────────────────────

routes.get('/radar-tiles', (c) => {
	// Return tile URL templates for the frontend to render on a map
	if (RAINBOW_API_KEY) {
		return c.json({
			provider: 'rainbow',
			tileUrl: 'https://tilecache.rainbow.ai/v2/radar/{z}/{x}/{y}.png',
			apiKey: RAINBOW_API_KEY,
			attribution: 'Rainbow.ai',
		});
	}
	// Fallback: RainViewer free tiles (personal use)
	return c.json({
		provider: 'rainviewer',
		tileUrl:
			'https://tilecache.rainviewer.com/v2/radar/{ts}/{size}/{z}/{x}/{y}/{color}/{options}.png',
		apiKey: null,
		attribution: 'RainViewer',
		infoUrl: 'https://api.rainviewer.com/public/weather-maps.json',
	});
});

export { routes as wetterRoutes };
