/**
 * Wetter API client — talks to apps/api `/api/v1/wetter/*`.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';
import type {
	CurrentWeather,
	HourlyForecast,
	DailyForecast,
	WeatherAlert,
	RainNowcast,
	GeocodingResult,
} from './types';

async function authHeader(): Promise<Record<string, string>> {
	const token = await authStore.getValidToken();
	return token ? { Authorization: `Bearer ${token}` } : {};
}

async function post<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${getManaApiUrl()}/api/v1/wetter${path}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
		body: JSON.stringify(body),
	});
	if (!res.ok) {
		const text = await res.text().catch(() => '');
		let message = text;
		try {
			const parsed = JSON.parse(text) as { message?: string; error?: string };
			message = parsed.message ?? parsed.error ?? text;
		} catch {
			// text was not JSON
		}
		throw new Error(message || `wetter ${path} failed (${res.status})`);
	}
	return (await res.json()) as T;
}

// ─── Open-Meteo Response Transformers ──────────────────────

interface OpenMeteoCurrentResponse {
	current?: {
		temperature_2m?: number;
		apparent_temperature?: number;
		weather_code?: number;
		relative_humidity_2m?: number;
		surface_pressure?: number;
		wind_speed_10m?: number;
		wind_direction_10m?: number;
		uv_index?: number;
		precipitation?: number;
		cloud_cover?: number;
		visibility?: number;
		is_day?: number;
	};
}

interface OpenMeteoForecastResponse {
	hourly?: {
		time?: string[];
		temperature_2m?: number[];
		precipitation?: number[];
		precipitation_probability?: number[];
		weather_code?: number[];
		wind_speed_10m?: number[];
		wind_direction_10m?: number[];
		relative_humidity_2m?: number[];
		apparent_temperature?: number[];
		is_day?: number[];
	};
	daily?: {
		time?: string[];
		temperature_2m_min?: number[];
		temperature_2m_max?: number[];
		weather_code?: number[];
		precipitation_sum?: number[];
		precipitation_probability_max?: number[];
		sunrise?: string[];
		sunset?: string[];
		uv_index_max?: number[];
		wind_speed_10m_max?: number[];
		wind_direction_10m_dominant?: number[];
	};
}

function transformCurrent(raw: OpenMeteoCurrentResponse): CurrentWeather {
	const c = raw.current ?? {};
	return {
		temperature: c.temperature_2m ?? 0,
		feelsLike: c.apparent_temperature ?? 0,
		weatherCode: c.weather_code ?? 0,
		humidity: c.relative_humidity_2m ?? 0,
		pressure: c.surface_pressure ?? 0,
		windSpeed: c.wind_speed_10m ?? 0,
		windDirection: c.wind_direction_10m ?? 0,
		uvIndex: c.uv_index ?? 0,
		precipitation: c.precipitation ?? 0,
		cloudCover: c.cloud_cover ?? 0,
		visibility: c.visibility ?? 0,
		isDay: (c.is_day ?? 1) === 1,
	};
}

function transformHourly(raw: OpenMeteoForecastResponse): HourlyForecast[] {
	const h = raw.hourly ?? {};
	const times = h.time ?? [];
	return times.map((t, i) => ({
		time: t,
		temperature: h.temperature_2m?.[i] ?? 0,
		precipitation: h.precipitation?.[i] ?? 0,
		precipitationProbability: h.precipitation_probability?.[i] ?? 0,
		weatherCode: h.weather_code?.[i] ?? 0,
		windSpeed: h.wind_speed_10m?.[i] ?? 0,
		windDirection: h.wind_direction_10m?.[i] ?? 0,
		humidity: h.relative_humidity_2m?.[i] ?? 0,
		feelsLike: h.apparent_temperature?.[i] ?? 0,
		isDay: (h.is_day?.[i] ?? 1) === 1,
	}));
}

function transformDaily(raw: OpenMeteoForecastResponse): DailyForecast[] {
	const d = raw.daily ?? {};
	const dates = d.time ?? [];
	return dates.map((date, i) => ({
		date,
		temperatureMin: d.temperature_2m_min?.[i] ?? 0,
		temperatureMax: d.temperature_2m_max?.[i] ?? 0,
		weatherCode: d.weather_code?.[i] ?? 0,
		precipitationSum: d.precipitation_sum?.[i] ?? 0,
		precipitationProbabilityMax: d.precipitation_probability_max?.[i] ?? 0,
		sunrise: d.sunrise?.[i] ?? '',
		sunset: d.sunset?.[i] ?? '',
		uvIndexMax: d.uv_index_max?.[i] ?? 0,
		windSpeedMax: d.wind_speed_10m_max?.[i] ?? 0,
		windDirection: d.wind_direction_10m_dominant?.[i] ?? 0,
	}));
}

// ─── Public API ────────────────────────────────────────────

export async function getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather> {
	const raw = await post<OpenMeteoCurrentResponse>('/current', { lat, lon });
	return transformCurrent(raw);
}

export async function getForecast(
	lat: number,
	lon: number
): Promise<{ hourly: HourlyForecast[]; daily: DailyForecast[] }> {
	const raw = await post<OpenMeteoForecastResponse>('/forecast', { lat, lon });
	return {
		hourly: transformHourly(raw),
		daily: transformDaily(raw),
	};
}

export async function getAlerts(lat: number, lon: number): Promise<WeatherAlert[]> {
	const raw = await post<{ alerts: WeatherAlert[] }>('/alerts', { lat, lon });
	return raw.alerts ?? [];
}

export async function getNowcast(lat: number, lon: number): Promise<RainNowcast> {
	return post<RainNowcast>('/nowcast', { lat, lon });
}

export async function geocode(query: string): Promise<GeocodingResult[]> {
	const raw = await post<{ results: GeocodingResult[] }>('/geocode', { query });
	return raw.results ?? [];
}
