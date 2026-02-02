import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { I18nService, I18N_OPTIONS } from './i18n.service';
import { I18nOptions } from './types';
import { SessionModule } from '../session/session.module';

/**
 * I18n Module for Matrix Bots
 *
 * Provides multi-language support with per-user language preferences.
 *
 * @example
 * ```typescript
 * // Basic usage (uses SessionModule and ConfigModule)
 * @Module({
 *   imports: [I18nModule.forRoot()],
 * })
 *
 * // With custom default language
 * @Module({
 *   imports: [I18nModule.forRoot({ defaultLanguage: 'en' })],
 * })
 * ```
 */
@Global()
@Module({})
export class I18nModule {
	/**
	 * Register the I18n module
	 */
	static forRoot(options?: I18nOptions): DynamicModule {
		return {
			module: I18nModule,
			imports: [ConfigModule, SessionModule.forRoot()],
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
			imports: [...(options.imports || []), ConfigModule, SessionModule.forRoot()],
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
