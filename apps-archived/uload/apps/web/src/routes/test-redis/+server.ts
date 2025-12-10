import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	// Dynamischer Import von ioredis (falls nicht installiert)
	let Redis;
	try {
		Redis = (await import('ioredis')).default;
	} catch (importError) {
		return json(
			{
				success: false,
				error: 'ioredis package not installed. Run: npm install ioredis',
				message: 'Redis dependency missing',
			},
			{ status: 500 }
		);
	}

	const connectionTests = [];

	// Environment Variables checken
	const envRedisUrl = process.env.REDIS_URL;
	const envRedisHost = process.env.REDIS_HOST || 'redis-database-ycsoowwsc84s0s8gc8oooosk';
	const envRedisPassword = process.env.REDIS_PASSWORD;
	const envRedisUsername = process.env.REDIS_USERNAME || 'default';

	const hosts = [
		'localhost',
		'127.0.0.1',
		'redis',
		'redis-database-ycsoowwsc84s0s8gc8oooosk',
		envRedisHost,
	];

	// Erst probieren ob REDIS_URL gesetzt ist
	if (envRedisUrl) {
		try {
			const redis = new Redis(envRedisUrl, {
				connectTimeout: 5000,
				lazyConnect: true,
				retryDelayOnFailover: 100,
				maxRetriesPerRequest: 1,
			});

			await redis.connect();
			await redis.ping();

			await redis.set('test-key', 'Hello from uLoad via REDIS_URL!');
			const value = await redis.get('test-key');
			const info = await redis.info('server');
			await redis.del('test-key');
			redis.disconnect();

			return json({
				success: true,
				redis_value: value,
				connection_method: 'REDIS_URL',
				redis_url: envRedisUrl.replace(/:([^:@]*?)@/, ':***@'), // Password verstecken
				redis_server_info: info
					.split('\n')
					.slice(0, 5)
					.filter((line) => line.trim()),
				message: 'Redis connection working via REDIS_URL!',
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			connectionTests.push({
				method: 'REDIS_URL',
				url: envRedisUrl ? envRedisUrl.replace(/:([^:@]*?)@/, ':***@') : 'not set',
				error: error.message,
				error_type: error.constructor.name,
			});
		}
	}

	// Test verschiedene Hosts mit Authentication
	for (const host of hosts) {
		// Test ohne Auth
		try {
			const redis = new Redis({
				host,
				port: 6379,
				connectTimeout: 5000,
				lazyConnect: true,
				retryDelayOnFailover: 100,
				maxRetriesPerRequest: 1,
			});

			await redis.connect();
			await redis.ping();

			await redis.set('test-key', `Hello from uLoad via ${host}!`);
			const value = await redis.get('test-key');
			const info = await redis.info('server');
			await redis.del('test-key');
			redis.disconnect();

			return json({
				success: true,
				redis_value: value,
				working_host: host,
				connection_method: 'no_auth',
				redis_server_info: info
					.split('\n')
					.slice(0, 5)
					.filter((line) => line.trim()),
				message: `Redis connection working via ${host} (no auth)!`,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			connectionTests.push({
				host,
				method: 'no_auth',
				error: error.message,
				error_type: error.constructor.name,
			});
		}

		// Test mit Auth (falls Environment Variables gesetzt)
		if (envRedisPassword) {
			try {
				const redis = new Redis({
					host,
					port: 6379,
					username: envRedisUsername,
					password: envRedisPassword,
					connectTimeout: 5000,
					lazyConnect: true,
					retryDelayOnFailover: 100,
					maxRetriesPerRequest: 1,
				});

				await redis.connect();
				await redis.ping();

				await redis.set('test-key', `Hello from uLoad via ${host} with auth!`);
				const value = await redis.get('test-key');
				const info = await redis.info('server');
				await redis.del('test-key');
				redis.disconnect();

				return json({
					success: true,
					redis_value: value,
					working_host: host,
					connection_method: 'with_auth',
					username: envRedisUsername,
					redis_server_info: info
						.split('\n')
						.slice(0, 5)
						.filter((line) => line.trim()),
					message: `Redis connection working via ${host} with auth!`,
					timestamp: new Date().toISOString(),
				});
			} catch (error) {
				connectionTests.push({
					host,
					method: 'with_auth',
					username: envRedisUsername,
					error: error.message,
					error_type: error.constructor.name,
				});
			}
		}
	}

	// Kein Host funktioniert
	return json(
		{
			success: false,
			message: 'Redis connection failed on all hosts and methods',
			connection_tests: connectionTests,
			environment: {
				NODE_ENV: process.env.NODE_ENV,
				REDIS_URL: envRedisUrl ? 'set' : 'not set',
				REDIS_HOST: envRedisHost,
				REDIS_USERNAME: envRedisUsername,
				REDIS_PASSWORD: envRedisPassword ? 'set' : 'not set',
				container_info: 'Running in container',
				redis_logs_hint: 'Check Redis logs for bind address and auth requirements',
			},
			next_steps: [
				'1. Add REDIS_URL environment variable to your main app',
				'2. Format: redis://username:password@host:port',
				'3. Use the exact Redis service name from Docker Compose',
				'4. Copy credentials from Redis service configuration',
			],
		},
		{ status: 500 }
	);
};
