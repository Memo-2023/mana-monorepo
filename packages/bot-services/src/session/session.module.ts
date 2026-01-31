import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionService } from './session.service';
import { SessionModuleOptions, SESSION_MODULE_OPTIONS } from './types';

/**
 * Shared session management module for Matrix bots
 *
 * Provides SessionService for managing user authentication sessions.
 * Links Matrix user IDs to mana-core-auth JWT tokens.
 *
 * @example
 * ```typescript
 * // With explicit configuration
 * @Module({
 *   imports: [
 *     SessionModule.register({
 *       authUrl: 'http://mana-core-auth:3001',
 *       sessionExpiryMs: 7 * 24 * 60 * 60 * 1000 // 7 days
 *     })
 *   ]
 * })
 *
 * // With ConfigService (reads from auth.url or MANA_CORE_AUTH_URL)
 * @Module({
 *   imports: [SessionModule.forRoot()]
 * })
 * ```
 */
@Global()
@Module({})
export class SessionModule {
	/**
	 * Register module with explicit options
	 */
	static register(options: SessionModuleOptions = {}): DynamicModule {
		return {
			module: SessionModule,
			imports: [ConfigModule],
			providers: [
				{
					provide: SESSION_MODULE_OPTIONS,
					useValue: options,
				},
				SessionService,
			],
			exports: [SessionService],
		};
	}

	/**
	 * Register module with ConfigService (reads auth.url or MANA_CORE_AUTH_URL from config)
	 */
	static forRoot(): DynamicModule {
		return {
			module: SessionModule,
			imports: [ConfigModule],
			providers: [SessionService],
			exports: [SessionService],
		};
	}
}
