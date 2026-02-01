import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CreditService } from './credit.service';
import { CreditModuleOptions, CREDIT_MODULE_OPTIONS } from './types';

/**
 * Shared credit management module for Matrix bots
 *
 * Provides CreditService for querying credit balances and formatting
 * credit-related messages for Matrix chat display.
 *
 * @example
 * ```typescript
 * // With explicit configuration
 * @Module({
 *   imports: [
 *     CreditModule.register({
 *       authUrl: 'http://mana-core-auth:3001',
 *     })
 *   ]
 * })
 *
 * // With ConfigService (reads from auth.url or MANA_CORE_AUTH_URL)
 * @Module({
 *   imports: [CreditModule.forRoot()]
 * })
 * ```
 */
@Global()
@Module({})
export class CreditModule {
	/**
	 * Register module with explicit options
	 */
	static register(options: CreditModuleOptions = {}): DynamicModule {
		return {
			module: CreditModule,
			imports: [ConfigModule],
			providers: [
				{
					provide: CREDIT_MODULE_OPTIONS,
					useValue: options,
				},
				CreditService,
			],
			exports: [CreditService],
		};
	}

	/**
	 * Register module with ConfigService (reads MANA_CORE_AUTH_URL from config)
	 */
	static forRoot(): DynamicModule {
		return {
			module: CreditModule,
			imports: [ConfigModule],
			providers: [CreditService],
			exports: [CreditService],
		};
	}
}
