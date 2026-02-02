import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SessionService, REDIS_SESSION_PROVIDER } from './session.service';
import { RedisSessionProvider } from './redis-session.provider';
import { SessionModuleOptions, SESSION_MODULE_OPTIONS } from './types';

/**
 * Shared session management module for Matrix bots
 *
 * Provides SessionService for managing user authentication sessions.
 * Links Matrix user IDs to mana-core-auth JWT tokens.
 *
 * @example
 * ```typescript
 * // Basic usage (in-memory sessions, per bot)
 * @Module({
 *   imports: [SessionModule.forRoot()]
 * })
 *
 * // With Redis for cross-bot SSO
 * @Module({
 *   imports: [
 *     SessionModule.forRoot({
 *       storageMode: 'redis',
 *       redisHost: 'localhost',
 *       redisPort: 6379,
 *     })
 *   ]
 * })
 *
 * // With Matrix-SSO-Link (automatic login)
 * @Module({
 *   imports: [
 *     SessionModule.forRoot({
 *       storageMode: 'redis',
 *       enableMatrixSsoLink: true,
 *       serviceKey: process.env.MANA_CORE_SERVICE_KEY,
 *     })
 *   ]
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
		const providers: any[] = [
			{
				provide: SESSION_MODULE_OPTIONS,
				useValue: options,
			},
		];

		// Add Redis provider if storage mode is redis
		if (options.storageMode === 'redis') {
			providers.push({
				provide: REDIS_SESSION_PROVIDER,
				useClass: RedisSessionProvider,
			});
		}

		providers.push(SessionService);

		return {
			module: SessionModule,
			imports: [ConfigModule],
			providers,
			exports: [SessionService],
		};
	}

	/**
	 * Register module with ConfigService
	 *
	 * Reads configuration from environment:
	 * - MANA_CORE_AUTH_URL: Auth service URL
	 * - REDIS_HOST, REDIS_PORT: Redis for cross-bot SSO
	 * - MANA_CORE_SERVICE_KEY: For Matrix-SSO-Link
	 * - SESSION_STORAGE_MODE: 'memory' or 'redis'
	 */
	static forRoot(options: SessionModuleOptions = {}): DynamicModule {
		const providers: any[] = [
			{
				provide: SESSION_MODULE_OPTIONS,
				useValue: options,
			},
		];

		// Add Redis provider if storage mode is redis
		if (options.storageMode === 'redis') {
			providers.push({
				provide: REDIS_SESSION_PROVIDER,
				useClass: RedisSessionProvider,
			});
		}

		providers.push(SessionService);

		return {
			module: SessionModule,
			imports: [ConfigModule],
			providers,
			exports: [SessionService],
		};
	}

	/**
	 * Register module with Redis enabled for cross-bot SSO
	 *
	 * Convenience method that enables Redis storage and Matrix-SSO-Link.
	 */
	static forRootWithRedis(options: Omit<SessionModuleOptions, 'storageMode'> = {}): DynamicModule {
		return this.forRoot({
			...options,
			storageMode: 'redis',
			enableMatrixSsoLink: options.enableMatrixSsoLink ?? true,
		});
	}
}
