import Redis from 'ioredis';

// Check if Redis should be enabled
const REDIS_ENABLED = process.env.REDIS_HOST && process.env.REDIS_PASSWORD;

let redis: Redis | null = null;
let redisAvailable = false;

if (REDIS_ENABLED) {
	const redisConfig = {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT || '6379'),
		username: process.env.REDIS_USERNAME || 'default',
		password: process.env.REDIS_PASSWORD,
		retryDelayOnFailover: 100,
		maxRetriesPerRequest: 3,
		lazyConnect: true,
		enableOfflineQueue: false, // Don't queue commands when offline
	};

	redis = new Redis(redisConfig);

	redis.on('connect', () => {
		console.log('✅ Redis: Connected successfully');
		redisAvailable = true;
	});

	redis.on('error', (err) => {
		console.error('❌ Redis Error:', err.message);
		redisAvailable = false;
	});

	redis.on('close', () => {
		console.log('⚠️ Redis: Connection closed');
		redisAvailable = false;
	});
} else {
	console.log('ℹ️ Redis: Disabled (no configuration found)');
}

// Helper functions with fallback behavior
export const cache = {
	async get<T>(key: string): Promise<T | null> {
		if (!redisAvailable) return null;
		try {
			const value = await redis!.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error('Cache get error:', error);
			return null;
		}
	},

	async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
		if (!redisAvailable) return;
		try {
			await redis!.setex(key, ttlSeconds, JSON.stringify(value));
		} catch (error) {
			console.error('Cache set error:', error);
		}
	},

	async del(key: string): Promise<void> {
		if (!redisAvailable) return;
		try {
			await redis!.del(key);
		} catch (error) {
			console.error('Cache del error:', error);
		}
	},

	async exists(key: string): Promise<boolean> {
		if (!redisAvailable) return false;
		try {
			const result = await redis!.exists(key);
			return result === 1;
		} catch (error) {
			console.error('Cache exists error:', error);
			return false;
		}
	},

	async incr(key: string): Promise<number> {
		if (!redisAvailable) return 0;
		try {
			return await redis!.incr(key);
		} catch (error) {
			console.error('Cache incr error:', error);
			return 0;
		}
	},

	async setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
		if (!redisAvailable) return;
		try {
			await redis!.setex(key, ttlSeconds, value);
		} catch (error) {
			console.error('Cache setWithExpiry error:', error);
		}
	},
};

// Ensure connection is established
export async function ensureRedisConnection() {
	if (!redis) return false;
	if (redisAvailable) return true;

	try {
		await redis.connect();
		redisAvailable = true;
		return true;
	} catch (error) {
		console.error('Failed to connect to Redis:', error);
		redisAvailable = false;
		return false;
	}
}

// Export the redis client (may be null)
export { redis, redisAvailable };
