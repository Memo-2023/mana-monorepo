import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import {
	WeatherData,
	WeatherCode,
	GeocodingResult,
	GeocodingApiResponse,
	WeatherApiResponse,
	WeatherModuleOptions,
	WEATHER_MODULE_OPTIONS,
	DEFAULT_CACHE_TTL_MS,
	WEATHER_DESCRIPTIONS_DE,
	WEATHER_DESCRIPTIONS_EN,
} from './types';

/**
 * Weather Service
 *
 * Provides weather data via Open-Meteo API (free, no API key required).
 *
 * Features:
 * - Geocoding: City name -> coordinates
 * - Current weather with detailed conditions
 * - In-memory caching (30 min default)
 * - German and English weather descriptions
 *
 * @example
 * ```typescript
 * const weather = await weatherService.getWeather('Berlin');
 * console.log(`${weather.temperature}°C, ${weather.weatherDescription}`);
 * ```
 */
@Injectable()
export class WeatherService {
	private readonly logger = new Logger(WeatherService.name);
	private readonly geocodingUrl = 'https://geocoding-api.open-meteo.com/v1/search';
	private readonly weatherUrl = 'https://api.open-meteo.com/v1/forecast';

	private readonly defaultLocation: string;
	private readonly cacheTtlMs: number;
	private readonly language: 'de' | 'en';

	// In-memory cache: location -> { data, expiresAt }
	private cache: Map<string, { data: WeatherData; expiresAt: Date }> = new Map();
	// Geocoding cache: location -> coordinates
	private geocodeCache: Map<string, GeocodingResult> = new Map();

	constructor(@Optional() @Inject(WEATHER_MODULE_OPTIONS) options?: WeatherModuleOptions) {
		this.defaultLocation = options?.defaultLocation || 'Berlin';
		this.cacheTtlMs = options?.cacheTtlMs || DEFAULT_CACHE_TTL_MS;
		this.language = options?.language || 'de';

		this.logger.log(
			`Weather Service initialized (default: ${this.defaultLocation}, cache: ${this.cacheTtlMs / 1000}s)`
		);
	}

	/**
	 * Get weather for a location
	 *
	 * @param location - City name (e.g., "Berlin", "New York")
	 * @returns Weather data or null if location not found
	 */
	async getWeather(location?: string): Promise<WeatherData | null> {
		const loc = (location || this.defaultLocation).toLowerCase().trim();

		// Check cache first
		const cached = this.cache.get(loc);
		if (cached && cached.expiresAt > new Date()) {
			this.logger.debug(`Cache hit for "${loc}"`);
			return cached.data;
		}

		// Geocode location
		const coordinates = await this.geocode(loc);
		if (!coordinates) {
			this.logger.warn(`Location not found: "${loc}"`);
			return null;
		}

		// Fetch weather
		const weather = await this.fetchWeather(coordinates);
		if (!weather) {
			return null;
		}

		// Cache result
		this.cache.set(loc, {
			data: weather,
			expiresAt: new Date(Date.now() + this.cacheTtlMs),
		});

		return weather;
	}

	/**
	 * Get weather description for a weather code
	 */
	getWeatherDescription(code: WeatherCode): string {
		const descriptions = this.language === 'de' ? WEATHER_DESCRIPTIONS_DE : WEATHER_DESCRIPTIONS_EN;
		return descriptions[code] || 'Unbekannt';
	}

	/**
	 * Get weather emoji for a weather code
	 */
	getWeatherEmoji(code: WeatherCode, isDay: boolean): string {
		// Clear
		if (code === 0) return isDay ? '☀️' : '🌙';
		if (code >= 1 && code <= 2) return isDay ? '🌤️' : '🌙';
		if (code === 3) return '☁️';

		// Fog
		if (code >= 45 && code <= 48) return '🌫️';

		// Drizzle
		if (code >= 51 && code <= 57) return '🌧️';

		// Rain
		if (code >= 61 && code <= 67) return '🌧️';

		// Snow
		if (code >= 71 && code <= 77) return '❄️';

		// Showers
		if (code >= 80 && code <= 82) return '🌦️';
		if (code >= 85 && code <= 86) return '🌨️';

		// Thunderstorm
		if (code >= 95) return '⛈️';

		return '🌡️';
	}

	/**
	 * Format weather for display
	 *
	 * @param weather - Weather data
	 * @param format - 'compact' or 'detailed'
	 */
	formatWeather(weather: WeatherData, format: 'compact' | 'detailed' = 'detailed'): string {
		const emoji = this.getWeatherEmoji(weather.weatherCode, weather.isDay);

		if (format === 'compact') {
			return `${Math.round(weather.temperature)}°C ${weather.weatherDescription}`;
		}

		const lines = [
			`**Wetter in ${weather.location}** ${emoji}`,
			`${Math.round(weather.temperature)}°C, ${weather.weatherDescription}`,
			`Regen: ${weather.precipitationProbability}% | Wind: ${Math.round(weather.windSpeed)} km/h`,
		];

		if (weather.apparentTemperature !== weather.temperature) {
			const diff = Math.round(weather.apparentTemperature - weather.temperature);
			if (Math.abs(diff) >= 2) {
				lines.push(
					`Gefuehlt: ${Math.round(weather.apparentTemperature)}°C (${diff > 0 ? '+' : ''}${diff}°)`
				);
			}
		}

		return lines.join('\n');
	}

	/**
	 * Clear cache (useful for testing)
	 */
	clearCache(): void {
		this.cache.clear();
		this.geocodeCache.clear();
	}

	// ===== Private Methods =====

	/**
	 * Geocode a location name to coordinates
	 */
	private async geocode(location: string): Promise<GeocodingResult | null> {
		// Check geocode cache
		const cached = this.geocodeCache.get(location);
		if (cached) {
			return cached;
		}

		try {
			const params = new URLSearchParams({
				name: location,
				count: '1',
				language: this.language,
				format: 'json',
			});

			const response = await fetch(`${this.geocodingUrl}?${params}`);

			if (!response.ok) {
				this.logger.error(`Geocoding API error: ${response.status}`);
				return null;
			}

			const data = (await response.json()) as GeocodingApiResponse;

			if (!data.results || data.results.length === 0) {
				return null;
			}

			const result = data.results[0];
			this.geocodeCache.set(location, result);
			return result;
		} catch (error) {
			this.logger.error(`Geocoding failed for "${location}":`, error);
			return null;
		}
	}

	/**
	 * Fetch weather data for coordinates
	 */
	private async fetchWeather(geo: GeocodingResult): Promise<WeatherData | null> {
		try {
			const params = new URLSearchParams({
				latitude: geo.latitude.toString(),
				longitude: geo.longitude.toString(),
				current: [
					'temperature_2m',
					'apparent_temperature',
					'relative_humidity_2m',
					'precipitation',
					'weather_code',
					'wind_speed_10m',
					'wind_direction_10m',
					'is_day',
				].join(','),
				hourly: 'precipitation_probability',
				forecast_hours: '1',
				timezone: 'auto',
			});

			const response = await fetch(`${this.weatherUrl}?${params}`);

			if (!response.ok) {
				this.logger.error(`Weather API error: ${response.status}`);
				return null;
			}

			const data = (await response.json()) as WeatherApiResponse;

			// Get precipitation probability for current hour
			const precipProb = data.hourly?.precipitation_probability?.[0] ?? 0;

			const weather: WeatherData = {
				location: geo.name,
				temperature: data.current.temperature_2m,
				apparentTemperature: data.current.apparent_temperature,
				humidity: data.current.relative_humidity_2m,
				precipitation: data.current.precipitation,
				precipitationProbability: precipProb,
				windSpeed: data.current.wind_speed_10m,
				windDirection: data.current.wind_direction_10m,
				weatherCode: data.current.weather_code,
				weatherDescription: this.getWeatherDescription(data.current.weather_code),
				isDay: data.current.is_day === 1,
				fetchedAt: new Date(),
			};

			this.logger.debug(
				`Fetched weather for ${geo.name}: ${weather.temperature}°C, ${weather.weatherDescription}`
			);
			return weather;
		} catch (error) {
			this.logger.error(`Weather fetch failed for ${geo.name}:`, error);
			return null;
		}
	}
}
