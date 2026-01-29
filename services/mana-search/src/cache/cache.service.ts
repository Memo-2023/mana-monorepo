import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(CacheService.name);
	private client: Redis | null = null;
	private readonly keyPrefix: string;

	private stats = {
		hits: 0,
		misses: 0,
	};

	constructor(
		private readonly configService: ConfigService,
		private readonly metricsService: MetricsService,
	) {
		this.keyPrefix = this.configService.get<string>('redis.keyPrefix', 'mana-search:');
	}

	async onModuleInit() {
		const host = this.configService.get<string>('redis.host', 'localhost');
		const port = this.configService.get<number>('redis.port', 6379);
		const password = this.configService.get<string>('redis.password');

		try {
			this.client = new Redis({
				host,
				port,
				password,
				retryStrategy: (times) => {
					if (times > 3) {
						this.logger.warn('Redis connection failed, running without cache');
						return null; // Stop retrying
					}
					return Math.min(times * 200, 2000);
				},
				maxRetriesPerRequest: 1,
			});

			this.client.on('error', (err) => {
				this.logger.error(`Redis error: ${err.message}`);
			});

			this.client.on('connect', () => {
				this.logger.log(`Connected to Redis at ${host}:${port}`);
			});

			// Test connection
			await this.client.ping();
		} catch (error) {
			this.logger.warn(`Could not connect to Redis: ${error}. Running without cache.`);
			this.client = null;
		}
	}

	async onModuleDestroy() {
		if (this.client) {
			await this.client.quit();
		}
	}

	private buildKey(key: string): string {
		return `${this.keyPrefix}${key}`;
	}

	async get<T>(key: string): Promise<T | null> {
		if (!this.client) return null;

		try {
			const data = await this.client.get(this.buildKey(key));
			if (data) {
				this.stats.hits++;
				this.metricsService.recordCacheHit();
				return JSON.parse(data);
			}
			this.stats.misses++;
			this.metricsService.recordCacheMiss();
			return null;
		} catch (error) {
			this.logger.error(`Cache get error: ${error}`);
			return null;
		}
	}

	async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
		if (!this.client) return;

		try {
			await this.client.setex(this.buildKey(key), ttlSeconds, JSON.stringify(value));
		} catch (error) {
			this.logger.error(`Cache set error: ${error}`);
		}
	}

	async delete(key: string): Promise<void> {
		if (!this.client) return;

		try {
			await this.client.del(this.buildKey(key));
		} catch (error) {
			this.logger.error(`Cache delete error: ${error}`);
		}
	}

	async clear(): Promise<number> {
		if (!this.client) return 0;

		try {
			const keys = await this.client.keys(`${this.keyPrefix}*`);
			if (keys.length > 0) {
				await this.client.del(...keys);
			}
			return keys.length;
		} catch (error) {
			this.logger.error(`Cache clear error: ${error}`);
			return 0;
		}
	}

	getStats() {
		const total = this.stats.hits + this.stats.misses;
		return {
			hits: this.stats.hits,
			misses: this.stats.misses,
			hitRate: total > 0 ? this.stats.hits / total : 0,
		};
	}

	async healthCheck(): Promise<{ status: string; latency: number }> {
		if (!this.client) {
			return { status: 'disabled', latency: 0 };
		}

		const start = Date.now();
		try {
			await this.client.ping();
			return { status: 'ok', latency: Date.now() - start };
		} catch {
			return { status: 'error', latency: Date.now() - start };
		}
	}

	isConnected(): boolean {
		return this.client !== null && this.client.status === 'ready';
	}
}
