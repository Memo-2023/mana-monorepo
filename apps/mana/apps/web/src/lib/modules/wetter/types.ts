/**
 * Wetter module types — weather data structures for Open-Meteo,
 * DWD alerts, and Rainbow.ai nowcast.
 */

// ─── Persisted (Dexie) ───────────────────────────────────────

export interface WeatherLocation {
	id: string;
	name: string;
	lat: number;
	lon: number;
	isDefault: boolean;
	order: number;
	createdAt: number;
}

export interface WeatherSettings {
	id: string;
	/** Temperature unit: 'celsius' | 'fahrenheit' */
	temperatureUnit: 'celsius' | 'fahrenheit';
	/** Wind speed unit */
	windSpeedUnit: 'kmh' | 'ms' | 'mph' | 'kn';
	/** Precipitation unit */
	precipitationUnit: 'mm' | 'inch';
}

// ─── API Response Types ──────────────────────────────────────

export interface CurrentWeather {
	temperature: number;
	feelsLike: number;
	weatherCode: number;
	humidity: number;
	pressure: number;
	windSpeed: number;
	windDirection: number;
	uvIndex: number;
	precipitation: number;
	cloudCover: number;
	visibility: number;
	isDay: boolean;
}

export interface HourlyForecast {
	time: string;
	temperature: number;
	precipitation: number;
	precipitationProbability: number;
	weatherCode: number;
	windSpeed: number;
	windDirection: number;
	humidity: number;
	feelsLike: number;
	isDay: boolean;
}

export interface DailyForecast {
	date: string;
	temperatureMin: number;
	temperatureMax: number;
	weatherCode: number;
	precipitationSum: number;
	precipitationProbabilityMax: number;
	sunrise: string;
	sunset: string;
	uvIndexMax: number;
	windSpeedMax: number;
	windDirection: number;
}

export interface WeatherAlert {
	id: string;
	headline: string;
	description: string;
	severity: 'minor' | 'moderate' | 'severe' | 'extreme';
	event: string;
	start: string;
	end: string;
	regionName: string;
}

export interface RainNowcast {
	minutely: { time: string; precipitation: number }[];
	summary: string;
}

export interface WeatherData {
	current: CurrentWeather;
	hourly: HourlyForecast[];
	daily: DailyForecast[];
	alerts: WeatherAlert[];
	location: { name: string; lat: number; lon: number };
	fetchedAt: number;
}

export interface GeocodingResult {
	name: string;
	lat: number;
	lon: number;
	country: string;
	admin1?: string;
}
