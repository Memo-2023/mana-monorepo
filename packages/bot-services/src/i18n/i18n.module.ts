import { Module, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { I18nService, I18N_OPTIONS } from './i18n.service';
import { I18nOptions } from './types';

/**
 * I18n Module for Matrix Bots
 *
 * Provides multi-language support with per-user language preferences.
 *
 * NOTE: SessionService is optional. If you want per-user language preferences,
 * import SessionModule in your app before I18nModule. Otherwise, the default
 * language will be used for all users.
 *
 * @example
 * ```typescript
 * // Basic usage (uses default language for all users)
 * @Module({
 *   imports: [I18nModule.forRoot()],
 * })
 *
 * // With per-user preferences (requires SessionModule)
 * @Module({
 *   imports: [
 *     SessionModule.forRoot({ storageMode: 'redis' }),
 *     I18nModule.forRoot({ defaultLanguage: 'en' }),
 *   ],
 * })
 * ```
 */
@Module({})
export class I18nModule {
	/**
	 * Register the I18n module
	 */
	static forRoot(options?: I18nOptions): DynamicModule {
		return {
			module: I18nModule,
			global: true,
			imports: [ConfigModule],
			providers: [
				{
					provide: I18N_OPTIONS,
					useValue: options || {},
				},
				I18nService,
			],
			exports: [I18nService],
		};
	}

	/**
	 * Register the I18n module with async configuration
	 */
	static forRootAsync(options: {
		imports?: any[];
		useFactory: (...args: any[]) => I18nOptions | Promise<I18nOptions>;
		inject?: any[];
	}): DynamicModule {
		return {
			module: I18nModule,
			global: true,
			imports: [...(options.imports || []), ConfigModule],
			providers: [
				{
					provide: I18N_OPTIONS,
					useFactory: options.useFactory,
					inject: options.inject || [],
				},
				I18nService,
			],
			exports: [I18nService],
		};
	}
}
