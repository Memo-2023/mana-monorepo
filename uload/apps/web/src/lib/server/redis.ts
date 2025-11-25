import Redis from 'ioredis';

// Check if Redis is configured
const REDIS_ENABLED = !!(process.env.REDIS_HOST && (process.env.REDIS_PASSWORD || process.env.NODE_ENV === 'development'));

let redis: Redis | null = null;
let redisAvailable = false;

if (REDIS_ENABLED) {
	// Redis Connection Setup
	const redisConfig = {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT || '6379'),
		username: process.env.REDIS_USERNAME || 'default',
		password: process.env.REDIS_PASSWORD || undefined,
		retryDelayOnFailover: 100,
		maxRetriesPerRequest: 3,
		lazyConnect: true,
		enableOfflineQueue: false
	};

	// Create Redis client
	redis = new Redis(redisConfig);
} else {
	console.log('⚠️  Redis: Disabled (no configuration found). Cache features will be unavailable.');
}

// Connection handling
if (redis) {
	redis.on('connect', () => {
		console.log('✅ Redis: Connected successfully');
		redisAvailable = true;
	});

	redis.on('error', (err) => {
		console.error('❌ Redis Error:', err.message);
		redisAvailable = false;
	});

	redis.on('close', () => {
		console.log('⚠️  Redis: Connection closed');
		redisAvailable = false;
	});
}

// Helper functions for common operations
export const cache = {
	// Get with JSON parsing
	async get<T>(key: string): Promise<T | null> {
		if (!redis || !redisAvailable) return null;
		try {
			const value = await redis.get(key);
			return value ? JSON.parse(value) : null;
		} catch (error) {
			console.error('Cache get error:', error);
			return null;
		}
	},

	// Set with JSON stringification and TTL
	async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
		if (!redis || !redisAvailable) return;
		try {
			await redis.setex(key, ttlSeconds, JSON.stringify(value));
		} catch (error) {
			console.error('Cache set error:', error);
		}
	},

	// Delete key
	async del(key: string): Promise<void> {
		if (!redis || !redisAvailable) return;
		try {
			await redis.del(key);
		} catch (error) {
			console.error('Cache del error:', error);
		}
	},

	// Check if key exists
	async exists(key: string): Promise<boolean> {
		if (!redis || !redisAvailable) return false;
		try {
			const result = await redis.exists(key);
			return result === 1;
		} catch (error) {
			console.error('Cache exists error:', error);
			return false;
		}
	},

	// Increment counter
	async incr(key: string): Promise<number> {
		if (!redis || !redisAvailable) return 0;
		try {
			return await redis.incr(key);
		} catch (error) {
			console.error('Cache incr error:', error);
			return 0;
		}
	},

	// Set with expiry (for rate limiting)
	async setWithExpiry(key: string, value: string, ttlSeconds: number): Promise<void> {
		if (!redis || !redisAvailable) return;
		try {
			await redis.setex(key, ttlSeconds, value);
		} catch (error) {
			console.error('Cache setWithExpiry error:', error);
		}
	}
};

// Ensure connection is established
export async function ensureRedisConnection() {
	if (!redis) return false;
	if (redis.status === 'ready') {
		redisAvailable = true;
		return true;
	}
	
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

// Export the redis client and availability status
export { redis, redisAvailable };