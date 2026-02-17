import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WeatherService } from './weather.service';
import { WeatherModuleOptions, WEATHER_MODULE_OPTIONS } from './types';

/**
 * Weather Module
 *
 * Provides weather data via Open-Meteo API.
 * No API key required - completely free!
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Module({
 *   imports: [WeatherModule.register()]
 * })
 *
 * // With options
 * @Module({
 *   imports: [
 *     WeatherModule.register({
 *       defaultLocation: 'Berlin',
 *       cacheTtlMs: 15 * 60 * 1000, // 15 minutes
 *       language: 'de',
 *     })
 *   ]
 * })
 *
 * // With ConfigService
 * @Module({
 *   imports: [
 *     WeatherModule.registerAsync({
 *       imports: [ConfigModule],
 *       useFactory: (config: ConfigService) => ({
 *         defaultLocation: config.get('weather.defaultLocation'),
 *       }),
 *       inject: [ConfigService],
 *     })
 *   ]
 * })
 * ```
 */
@Global()
@Module({})
export class WeatherModule {
	/**
	 * Register module with explicit options
	 */
	static register(options: WeatherModuleOptions = {}): DynamicModule {
		return {
			module: WeatherModule,
			providers: [
				{
					provide: WEATHER_MODULE_OPTIONS,
					useValue: options,
				},
				WeatherService,
			],
			exports: [WeatherService],
		};
	}

	/**
	 * Register module with async configuration
	 */
	static registerAsync(options: {
		imports?: any[];
		useFactory: (...args: any[]) => Promise<WeatherModuleOptions> | WeatherModuleOptions;
		inject?: any[];
	}): DynamicModule {
		return {
			module: WeatherModule,
			imports: [...(options.imports || [])],
			providers: [
				{
					provide: WEATHER_MODULE_OPTIONS,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				WeatherService,
			],
			exports: [WeatherService],
		};
	}

	/**
	 * Register with ConfigService reading from environment
	 *
	 * Environment variables:
	 * - WEATHER_DEFAULT_LOCATION: Default city name
	 * - WEATHER_CACHE_TTL_MS: Cache TTL in milliseconds
	 * - WEATHER_LANGUAGE: 'de' or 'en'
	 */
	static forRoot(): DynamicModule {
		return this.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				defaultLocation:
					config.get<string>('weather.defaultLocation') ||
					config.get<string>('WEATHER_DEFAULT_LOCATION') ||
					'Berlin',
				cacheTtlMs:
					config.get<number>('weather.cacheTtlMs') ||
					config.get<number>('WEATHER_CACHE_TTL_MS') ||
					30 * 60 * 1000,
				language:
					(config.get<string>('weather.language') as 'de' | 'en') ||
					(config.get<string>('WEATHER_LANGUAGE') as 'de' | 'en') ||
					'de',
			}),
			inject: [ConfigService],
		});
	}
}
