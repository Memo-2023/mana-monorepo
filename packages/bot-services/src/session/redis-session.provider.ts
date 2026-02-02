import {
	Injectable,
	Logger,
	OnModuleInit,
	OnModuleDestroy,
	Inject,
	Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
	UserSession,
	SessionModuleOptions,
	SESSION_MODULE_OPTIONS,
	DEFAULT_SESSION_EXPIRY_MS,
} from './types';

/**
 * Injection token for Redis client
 */
export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Key prefix for bot sessions in Redis
 */
const KEY_PREFIX = 'bot:session:';

/**
 * Redis-based session provider for cross-bot SSO
 *
 * Sessions are stored in Redis with automatic TTL expiration.
 * All bots using this provider share the same session store.
 *
 * @example
 * ```typescript
 * // User logs in via todo-bot
 * await sessionProvider.setSession('@user:matrix.mana.how', session);
 *
 * // Same user in picture-bot - already logged in!
 * const session = await sessionProvider.getSession('@user:matrix.mana.how');
 * ```
 */
@Injectable()
export class RedisSessionProvider implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(RedisSessionProvider.name);
	private client: Redis | null = null;
	private readonly sessionExpirySeconds: number;

	constructor(
		@Optional() private configService: ConfigService,
		@Optional() @Inject(SESSION_MODULE_OPTIONS) private options?: SessionModuleOptions
	) {
		const expiryMs = options?.sessionExpiryMs || DEFAULT_SESSION_EXPIRY_MS;
		this.sessionExpirySeconds = Math.floor(expiryMs / 1000);
	}

	async onModuleInit() {
		const host =
			this.options?.redisHost || this.configService?.get<string>('REDIS_HOST', 'localhost');
		const port = this.options?.redisPort || this.configService?.get<number>('REDIS_PORT', 6379);
		const password =
			this.options?.redisPassword || this.configService?.get<string>('REDIS_PASSWORD');

		try {
			this.client = new Redis({
				host,
				port,
				password: password || undefined,
				retryStrategy: (times) => {
					if (times > 3) {
						this.logger.warn('Redis connection failed, falling back to in-memory sessions');
						return null;
					}
					return Math.min(times * 200, 2000);
				},
				maxRetriesPerRequest: 1,
			});

			this.client.on('error', (err) => {
				this.logger.error(`Redis error: ${err.message}`);
			});

			this.client.on('connect', () => {
				this.logger.log(`Connected to Redis at ${host}:${port} for session storage`);
			});

			// Test connection
			await this.client.ping();
			this.logger.log('Redis session provider initialized');
		} catch (error) {
			this.logger.warn(`Could not connect to Redis: ${error}. Falling back to in-memory sessions.`);
			this.client = null;
		}
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.quit();
		}
	}

	/**
	 * Build Redis key for a Matrix user ID
	 */
	private buildKey(matrixUserId: string): string {
		return `${KEY_PREFIX}${matrixUserId}`;
	}

	/**
	 * Check if Redis is connected
	 */
	isConnected(): boolean {
		return this.client !== null && this.client.status === 'ready';
	}

	/**
	 * Store a session in Redis
	 */
	async setSession(matrixUserId: string, session: UserSession): Promise<void> {
		if (!this.client) return;

		try {
			const data = {
				token: session.token,
				email: session.email,
				expiresAt: session.expiresAt.toISOString(),
				data: session.data || {},
			};

			await this.client.setex(
				this.buildKey(matrixUserId),
				this.sessionExpirySeconds,
				JSON.stringify(data)
			);
			this.logger.debug(`Session stored for ${matrixUserId}`);
		} catch (error) {
			this.logger.error(`Failed to store session: ${error}`);
		}
	}

	/**
	 * Get a session from Redis
	 */
	async getSession(matrixUserId: string): Promise<UserSession | null> {
		if (!this.client) return null;

		try {
			const data = await this.client.get(this.buildKey(matrixUserId));
			if (!data) return null;

			const parsed = JSON.parse(data);
			const session: UserSession = {
				token: parsed.token,
				email: parsed.email,
				expiresAt: new Date(parsed.expiresAt),
				data: parsed.data,
			};

			// Check if expired (should not happen due to TTL, but double-check)
			if (session.expiresAt < new Date()) {
				await this.deleteSession(matrixUserId);
				return null;
			}

			return session;
		} catch (error) {
			this.logger.error(`Failed to get session: ${error}`);
			return null;
		}
	}

	/**
	 * Get only the token from a session
	 */
	async getToken(matrixUserId: string): Promise<string | null> {
		const session = await this.getSession(matrixUserId);
		return session?.token ?? null;
	}

	/**
	 * Delete a session from Redis
	 */
	async deleteSession(matrixUserId: string): Promise<void> {
		if (!this.client) return;

		try {
			await this.client.del(this.buildKey(matrixUserId));
			this.logger.debug(`Session deleted for ${matrixUserId}`);
		} catch (error) {
			this.logger.error(`Failed to delete session: ${error}`);
		}
	}

	/**
	 * Update session data without changing the token
	 */
	async updateSessionData(matrixUserId: string, key: string, value: unknown): Promise<void> {
		const session = await this.getSession(matrixUserId);
		if (!session) return;

		session.data = session.data || {};
		session.data[key] = value;
		await this.setSession(matrixUserId, session);
	}

	/**
	 * Get session data
	 */
	async getSessionData<T = unknown>(matrixUserId: string, key: string): Promise<T | null> {
		const session = await this.getSession(matrixUserId);
		return (session?.data?.[key] as T) ?? null;
	}

	/**
	 * Get all active session keys (for debugging/stats)
	 */
	async getActiveSessionCount(): Promise<number> {
		if (!this.client) return 0;

		try {
			const keys = await this.client.keys(`${KEY_PREFIX}*`);
			return keys.length;
		} catch (error) {
			this.logger.error(`Failed to get session count: ${error}`);
			return 0;
		}
	}

	/**
	 * Health check
	 */
	async healthCheck(): Promise<{ status: string; latency: number }> {
		if (!this.client) {
			return { status: 'disconnected', latency: 0 };
		}

		const start = Date.now();
		try {
			await this.client.ping();
			return { status: 'ok', latency: Date.now() - start };
		} catch {
			return { status: 'error', latency: Date.now() - start };
		}
	}
}
