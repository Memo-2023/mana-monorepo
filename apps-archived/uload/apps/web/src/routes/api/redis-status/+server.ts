import { json } from '@sveltejs/kit';
import { redis, ensureRedisConnection, redisAvailable } from '$lib/server/redis';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const status = {
		connected: false,
		host: process.env.REDIS_HOST || 'not configured',
		enabled: !!redis,
		available: redisAvailable,
		cachedLinks: 0,
		error: null as string | null,
	};

	try {
		// Try to connect
		const connected = await ensureRedisConnection();
		status.connected = connected;

		if (connected && redis) {
			// Count cached redirects
			const keys = await redis.keys('redirect:*');
			status.cachedLinks = keys.length;

			// Test basic operation
			await redis.setex('test:ping', 10, 'pong');
			const test = await redis.get('test:ping');
			if (test !== 'pong') {
				status.error = 'Read/write test failed';
			}
		} else if (!redis) {
			status.error = 'Redis is not configured (check environment variables)';
		} else {
			status.error = 'Could not establish connection';
		}
	} catch (error: any) {
		status.error = error.message;
		status.connected = false;
	}

	return json(status);
};
