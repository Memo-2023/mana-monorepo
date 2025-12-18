/**
 * Test Helper Utilities
 *
 * Common utilities for writing tests
 */

import { ConfigService } from '@nestjs/config';

/**
 * Create mock ConfigService
 */
export const createMockConfigService = (overrides: Record<string, any> = {}): ConfigService => {
	const defaultConfig: Record<string, any> = {
		'database.url': 'postgresql://test:test@localhost:5432/test',
		// Note: JWT keys are managed automatically by Better Auth (EdDSA/Ed25519)
		// Keys are stored in auth.jwks table - no manual configuration needed
		'jwt.accessTokenExpiry': '15m',
		'jwt.refreshTokenExpiry': '7d',
		'jwt.issuer': 'mana-core',
		'jwt.audience': 'mana-universe',
		'credits.signupBonus': 150,
		'credits.dailyFreeCredits': 5,
		'redis.host': 'localhost',
		'redis.port': 6379,
		'redis.password': 'test',
		BASE_URL: 'http://localhost:3001',
		...overrides,
	};

	return {
		get: jest.fn((key: string) => defaultConfig[key]),
		getOrThrow: jest.fn((key: string) => {
			if (!defaultConfig[key]) {
				throw new Error(`Configuration key ${key} not found`);
			}
			return defaultConfig[key];
		}),
	} as unknown as ConfigService;
};

/**
 * Create a test date with specific offset
 */
export const createTestDate = (offsetMs = 0): Date => {
	return new Date(Date.now() + offsetMs);
};

/**
 * Mock timer utilities
 */
export const timerUtils = {
	/**
	 * Fast-forward time
	 */
	advance: (ms: number) => {
		jest.advanceTimersByTime(ms);
	},

	/**
	 * Use fake timers
	 */
	useFake: () => {
		jest.useFakeTimers();
	},

	/**
	 * Use real timers
	 */
	useReal: () => {
		jest.useRealTimers();
	},
};

/**
 * Assert helpers for common patterns
 */
export const assertHelpers = {
	/**
	 * Assert that a function throws a specific error
	 */
	assertThrowsAsync: async (fn: () => Promise<any>, expectedError: string | RegExp) => {
		await expect(fn()).rejects.toThrow(expectedError);
	},

	/**
	 * Assert that an object has specific properties
	 */
	assertHasProperties: (obj: any, properties: string[]) => {
		properties.forEach((prop) => {
			expect(obj).toHaveProperty(prop);
		});
	},

	/**
	 * Assert that an object does NOT have specific properties
	 */
	assertLacksProperties: (obj: any, properties: string[]) => {
		properties.forEach((prop) => {
			expect(obj).not.toHaveProperty(prop);
		});
	},

	/**
	 * Assert that a value is a valid UUID
	 */
	assertIsUuid: (value: string) => {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		expect(value).toMatch(uuidRegex);
	},

	/**
	 * Assert that a date is recent (within last N seconds)
	 */
	assertIsRecent: (date: Date, withinSeconds = 5) => {
		const now = Date.now();
		const dateMs = date.getTime();
		const diff = Math.abs(now - dateMs);
		expect(diff).toBeLessThan(withinSeconds * 1000);
	},

	/**
	 * Assert that a value is between min and max
	 */
	assertBetween: (value: number, min: number, max: number) => {
		expect(value).toBeGreaterThanOrEqual(min);
		expect(value).toBeLessThanOrEqual(max);
	},
};

/**
 * Database test helpers
 */
export const dbTestHelpers = {
	/**
	 * Create a mock database connection
	 */
	createMockDb: () => ({
		select: jest.fn().mockReturnThis(),
		from: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		for: jest.fn().mockReturnThis(),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		returning: jest.fn(),
		transaction: jest.fn(),
	}),

	/**
	 * Mock successful query result
	 */
	mockSuccessResult: (data: any) => ({
		data,
		error: null,
	}),

	/**
	 * Mock error result
	 */
	mockErrorResult: (error: Error) => ({
		data: null,
		error,
	}),
};

/**
 * Security test helpers
 */
export const securityTestHelpers = {
	/**
	 * Common SQL injection payloads
	 */
	sqlInjectionPayloads: [
		"'; DROP TABLE users; --",
		"' OR '1'='1",
		"' OR '1'='1' --",
		"' OR '1'='1' /*",
		"admin'--",
		"' UNION SELECT NULL--",
	],

	/**
	 * Common XSS payloads
	 */
	xssPayloads: [
		'<script>alert("xss")</script>',
		'<img src=x onerror=alert("xss")>',
		'<svg onload=alert("xss")>',
		'javascript:alert("xss")',
	],

	/**
	 * Test for timing attacks
	 */
	measureExecutionTime: async (fn: () => Promise<any>): Promise<number> => {
		const start = process.hrtime.bigint();
		await fn();
		const end = process.hrtime.bigint();
		return Number(end - start) / 1_000_000; // Convert to milliseconds
	},

	/**
	 * Test for constant-time comparison
	 */
	isConstantTime: async (
		fn1: () => Promise<any>,
		fn2: () => Promise<any>,
		threshold = 10
	): Promise<boolean> => {
		const time1 = await securityTestHelpers.measureExecutionTime(fn1);
		const time2 = await securityTestHelpers.measureExecutionTime(fn2);
		const diff = Math.abs(time1 - time2);
		return diff < threshold;
	},
};

/**
 * Mock HTTP request/response
 */
export const httpMockHelpers = {
	/**
	 * Create mock Express request
	 */
	createMockRequest: (overrides: Partial<any> = {}) => ({
		headers: {},
		body: {},
		query: {},
		params: {},
		ip: '127.0.0.1',
		user: null,
		...overrides,
	}),

	/**
	 * Create mock Express response
	 */
	createMockResponse: () => {
		const res: any = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn().mockReturnThis(),
			send: jest.fn().mockReturnThis(),
			end: jest.fn().mockReturnThis(),
		};
		return res;
	},

	/**
	 * Create mock NestJS ExecutionContext
	 */
	createMockExecutionContext: (request: any) => ({
		switchToHttp: () => ({
			getRequest: () => request,
			getResponse: () => httpMockHelpers.createMockResponse(),
		}),
		getClass: () => ({}),
		getHandler: () => ({}),
	}),
};

/**
 * Performance test helpers
 */
export const performanceHelpers = {
	/**
	 * Run a function N times and measure average execution time
	 */
	benchmark: async (fn: () => Promise<any>, iterations = 100): Promise<number> => {
		const times: number[] = [];

		for (let i = 0; i < iterations; i++) {
			const start = process.hrtime.bigint();
			await fn();
			const end = process.hrtime.bigint();
			times.push(Number(end - start) / 1_000_000);
		}

		const avg = times.reduce((a, b) => a + b, 0) / times.length;
		return avg;
	},

	/**
	 * Assert function execution is under a time limit
	 */
	assertExecutionTime: async (fn: () => Promise<any>, maxMs: number) => {
		const start = process.hrtime.bigint();
		await fn();
		const end = process.hrtime.bigint();
		const duration = Number(end - start) / 1_000_000;
		expect(duration).toBeLessThan(maxMs);
	},
};
