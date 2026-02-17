/**
 * Weather Service Types
 *
 * Types for Open-Meteo weather API integration
 */

/**
 * Weather condition codes from Open-Meteo
 * See: https://open-meteo.com/en/docs#weathervariables
 */
export type WeatherCode =
	| 0 // Clear sky
	| 1
	| 2
	| 3 // Mainly clear, partly cloudy, overcast
	| 45
	| 48 // Fog and depositing rime fog
	| 51
	| 53
	| 55 // Drizzle: Light, moderate, dense
	| 56
	| 57 // Freezing drizzle: Light, dense
	| 61
	| 63
	| 65 // Rain: Slight, moderate, heavy
	| 66
	| 67 // Freezing rain: Light, heavy
	| 71
	| 73
	| 75 // Snow fall: Slight, moderate, heavy
	| 77 // Snow grains
	| 80
	| 81
	| 82 // Rain showers: Slight, moderate, violent
	| 85
	| 86 // Snow showers: Slight, heavy
	| 95 // Thunderstorm: Slight or moderate
	| 96
	| 99; // Thunderstorm with slight and heavy hail

/**
 * Weather data structure
 */
export interface WeatherData {
	location: string;
	temperature: number;
	apparentTemperature: number;
	humidity: number;
	precipitation: number;
	precipitationProbability: number;
	windSpeed: number;
	windDirection: number;
	weatherCode: WeatherCode;
	weatherDescription: string;
	isDay: boolean;
	fetchedAt: Date;
}

/**
 * Geocoding result from Open-Meteo
 */
export interface GeocodingResult {
	id: number;
	name: string;
	latitude: number;
	longitude: number;
	country: string;
	countryCode: string;
	timezone: string;
	admin1?: string; // State/Province
}

/**
 * Open-Meteo geocoding API response
 */
export interface GeocodingApiResponse {
	results?: GeocodingResult[];
	generationtime_ms?: number;
}

/**
 * Open-Meteo current weather API response
 */
export interface WeatherApiResponse {
	latitude: number;
	longitude: number;
	timezone: string;
	current: {
		time: string;
		interval: number;
		temperature_2m: number;
		apparent_temperature: number;
		relative_humidity_2m: number;
		precipitation: number;
		weather_code: WeatherCode;
		wind_speed_10m: number;
		wind_direction_10m: number;
		is_day: number;
	};
	hourly?: {
		time: string[];
		precipitation_probability: number[];
	};
}

/**
 * Weather service configuration
 */
export interface WeatherServiceConfig {
	defaultLocation?: string;
	cacheTtlMs?: number;
	language?: 'de' | 'en';
}

/**
 * Weather module options
 */
export interface WeatherModuleOptions {
	defaultLocation?: string;
	cacheTtlMs?: number;
	language?: 'de' | 'en';
}

/**
 * Injection token for weather module options
 */
export const WEATHER_MODULE_OPTIONS = 'WEATHER_MODULE_OPTIONS';

/**
 * Default cache TTL: 30 minutes
 */
export const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Weather code to German description mapping
 */
export const WEATHER_DESCRIPTIONS_DE: Record<number, string> = {
	0: 'Klar',
	1: 'Ueberwiegend klar',
	2: 'Teilweise bewoelkt',
	3: 'Bedeckt',
	45: 'Nebel',
	48: 'Gefrierender Nebel',
	51: 'Leichter Nieselregen',
	53: 'Nieselregen',
	55: 'Starker Nieselregen',
	56: 'Leichter gefrierender Nieselregen',
	57: 'Starker gefrierender Nieselregen',
	61: 'Leichter Regen',
	63: 'Regen',
	65: 'Starker Regen',
	66: 'Leichter gefrierender Regen',
	67: 'Starker gefrierender Regen',
	71: 'Leichter Schneefall',
	73: 'Schneefall',
	75: 'Starker Schneefall',
	77: 'Schneegriesel',
	80: 'Leichte Regenschauer',
	81: 'Regenschauer',
	82: 'Heftige Regenschauer',
	85: 'Leichte Schneeschauer',
	86: 'Starke Schneeschauer',
	95: 'Gewitter',
	96: 'Gewitter mit leichtem Hagel',
	99: 'Gewitter mit starkem Hagel',
};

/**
 * Weather code to English description mapping
 */
export const WEATHER_DESCRIPTIONS_EN: Record<number, string> = {
	0: 'Clear sky',
	1: 'Mainly clear',
	2: 'Partly cloudy',
	3: 'Overcast',
	45: 'Fog',
	48: 'Depositing rime fog',
	51: 'Light drizzle',
	53: 'Moderate drizzle',
	55: 'Dense drizzle',
	56: 'Light freezing drizzle',
	57: 'Dense freezing drizzle',
	61: 'Slight rain',
	63: 'Moderate rain',
	65: 'Heavy rain',
	66: 'Light freezing rain',
	67: 'Heavy freezing rain',
	71: 'Slight snow fall',
	73: 'Moderate snow fall',
	75: 'Heavy snow fall',
	77: 'Snow grains',
	80: 'Slight rain showers',
	81: 'Moderate rain showers',
	82: 'Violent rain showers',
	85: 'Slight snow showers',
	86: 'Heavy snow showers',
	95: 'Thunderstorm',
	96: 'Thunderstorm with slight hail',
	99: 'Thunderstorm with heavy hail',
};
