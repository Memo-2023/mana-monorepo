import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlantaApiService } from './planta-api.service';
import { PlantaModuleOptions, PLANTA_MODULE_OPTIONS } from './types';

/**
 * Planta Module
 *
 * Plant care and watering management API client.
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Module({
 *   imports: [PlantaModule.register()]
 * })
 *
 * // With custom API URL
 * @Module({
 *   imports: [
 *     PlantaModule.register({
 *       apiUrl: 'http://planta-backend:3022',
 *     })
 *   ]
 * })
 * ```
 */
@Global()
@Module({})
export class PlantaModule {
	/**
	 * Register module with explicit options
	 */
	static register(options: PlantaModuleOptions = {}): DynamicModule {
		return {
			module: PlantaModule,
			providers: [
				{
					provide: PLANTA_MODULE_OPTIONS,
					useValue: options,
				},
				PlantaApiService,
			],
			exports: [PlantaApiService],
		};
	}

	/**
	 * Register module with async configuration
	 */
	static registerAsync(options: {
		imports?: any[];
		useFactory: (...args: any[]) => Promise<PlantaModuleOptions> | PlantaModuleOptions;
		inject?: any[];
	}): DynamicModule {
		return {
			module: PlantaModule,
			imports: [...(options.imports || [])],
			providers: [
				{
					provide: PLANTA_MODULE_OPTIONS,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				PlantaApiService,
			],
			exports: [PlantaApiService],
		};
	}

	/**
	 * Register with ConfigService reading from environment
	 *
	 * Environment variables:
	 * - PLANTA_API_URL: Planta backend URL
	 */
	static forRoot(): DynamicModule {
		return this.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				apiUrl:
					config.get<string>('planta.apiUrl') ||
					config.get<string>('PLANTA_API_URL') ||
					'http://localhost:3022',
			}),
			inject: [ConfigService],
		});
	}
}
