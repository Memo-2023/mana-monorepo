import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GiftService } from './gift.service';
import { GiftModuleOptions, GIFT_MODULE_OPTIONS } from './types';

@Module({})
export class GiftModule {
	/**
	 * Register the gift module with options
	 *
	 * @param options - Gift module options
	 * @returns Dynamic module
	 *
	 * @example
	 * ```typescript
	 * GiftModule.register({ authUrl: 'http://mana-core-auth:3001' })
	 * ```
	 */
	static register(options?: GiftModuleOptions): DynamicModule {
		const optionsProvider: Provider = {
			provide: GIFT_MODULE_OPTIONS,
			useValue: options || {},
		};

		return {
			module: GiftModule,
			imports: [ConfigModule],
			providers: [optionsProvider, GiftService],
			exports: [GiftService],
		};
	}

	/**
	 * Register the gift module with default configuration
	 * Uses ConfigService to get auth URL
	 *
	 * @returns Dynamic module
	 *
	 * @example
	 * ```typescript
	 * GiftModule.forRoot()
	 * ```
	 */
	static forRoot(): DynamicModule {
		return {
			module: GiftModule,
			imports: [ConfigModule],
			providers: [GiftService],
			exports: [GiftService],
		};
	}
}
