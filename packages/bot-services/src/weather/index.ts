/**
 * Weather Service
 *
 * Open-Meteo weather API integration for morning summaries and weather queries.
 *
 * @example
 * ```typescript
 * import { WeatherModule, WeatherService } from '@manacore/bot-services/weather';
 *
 * // In module
 * @Module({
 *   imports: [WeatherModule.register({ defaultLocation: 'Berlin' })]
 * })
 *
 * // In service
 * const weather = await weatherService.getWeather('Berlin');
 * console.log(weatherService.formatWeather(weather));
 * ```
 */

export { WeatherModule } from './weather.module.js';
export { WeatherService } from './weather.service.js';
export {
	WeatherModuleOptions,
	WeatherData,
	WeatherCode,
	GeocodingResult,
	WEATHER_MODULE_OPTIONS,
	DEFAULT_CACHE_TTL_MS,
	WEATHER_DESCRIPTIONS_DE,
	WEATHER_DESCRIPTIONS_EN,
} from './types.js';
