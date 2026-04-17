/**
 * Ephemeral weather data store. Lives in memory only — weather data
 * is fetched fresh from the API. Auto-refreshes every 15 minutes.
 */

import * as api from '../api';
import type { WeatherData, RainNowcast } from '../types';

const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 min

function createStore() {
	let weatherData = $state<WeatherData | null>(null);
	let nowcast = $state<RainNowcast | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let refreshTimer: ReturnType<typeof setInterval> | null = null;
	let lastCoords: { lat: number; lon: number } | null = null;

	async function fetchWeather(lat: number, lon: number, locationName?: string) {
		loading = true;
		error = null;
		lastCoords = { lat, lon };

		try {
			const [current, forecast, alerts] = await Promise.all([
				api.getCurrentWeather(lat, lon),
				api.getForecast(lat, lon),
				api.getAlerts(lat, lon),
			]);

			weatherData = {
				current,
				hourly: forecast.hourly,
				daily: forecast.daily,
				alerts,
				location: { name: locationName ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon },
				fetchedAt: Date.now(),
			};

			// Start auto-refresh
			startAutoRefresh();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Wetterdaten konnten nicht geladen werden';
		} finally {
			loading = false;
		}
	}

	async function fetchNowcast(lat: number, lon: number) {
		try {
			nowcast = await api.getNowcast(lat, lon);
		} catch {
			nowcast = { minutely: [], summary: 'Niederschlagsdaten nicht verfuegbar' };
		}
	}

	function startAutoRefresh() {
		stopAutoRefresh();
		refreshTimer = setInterval(() => {
			if (lastCoords) {
				const name = weatherData?.location.name;
				fetchWeather(lastCoords.lat, lastCoords.lon, name);
				fetchNowcast(lastCoords.lat, lastCoords.lon);
			}
		}, REFRESH_INTERVAL);
	}

	function stopAutoRefresh() {
		if (refreshTimer) {
			clearInterval(refreshTimer);
			refreshTimer = null;
		}
	}

	return {
		get weatherData() {
			return weatherData;
		},
		get nowcast() {
			return nowcast;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		fetchWeather,
		fetchNowcast,
		stopAutoRefresh,
	};
}

export const weatherStore = createStore();
