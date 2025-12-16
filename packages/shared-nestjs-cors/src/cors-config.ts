import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export interface CorsConfigOptions {
	/**
	 * Comma-separated list of allowed origins from environment variable.
	 * If not provided, uses development defaults.
	 */
	corsOriginsEnv?: string;

	/**
	 * Default origins for development. Only used if corsOriginsEnv is not provided.
	 * Defaults to common localhost ports if not specified.
	 */
	developmentOrigins?: string[];

	/**
	 * Additional origins to always allow (e.g., for mobile apps).
	 */
	additionalOrigins?: string[];
}

/**
 * Default development origins for all apps.
 * Covers common web app ports (5173-5190) and backend ports.
 */
const DEFAULT_DEV_ORIGINS = [
	'http://localhost:3000', // Chat web (production build port)
	'http://localhost:3001', // Auth service
	'http://localhost:3002', // Chat backend
	'http://localhost:5173', // Main web (Vite)
	'http://localhost:5174', // Additional Vite instances
	'http://localhost:5175',
	'http://localhost:5176',
	'http://localhost:5177',
	'http://localhost:5178',
	'http://localhost:5179',
	'http://localhost:5180',
	'http://localhost:5181',
	'http://localhost:5182',
	'http://localhost:5183',
	'http://localhost:5184',
	'http://localhost:5185',
	'http://localhost:5186', // Calendar web
	'http://localhost:5187', // Clock web
	'http://localhost:5188', // Todo web
	'http://localhost:5189',
	'http://localhost:5190',
	'http://localhost:8081', // Expo mobile
	'exp://localhost:8081', // Expo mobile (exp:// protocol)
];

/**
 * Creates a standardized CORS configuration for NestJS apps.
 *
 * This utility provides a consistent CORS setup across all ManaCore backends,
 * solving the common issue where staging/production deployments fail due to
 * missing CORS_ORIGINS environment variable.
 *
 * ## Usage
 *
 * ### Basic (recommended)
 * ```typescript
 * import { createCorsConfig } from '@manacore/shared-nestjs-cors';
 *
 * const app = await NestFactory.create(AppModule);
 * app.enableCors(createCorsConfig({
 *   corsOriginsEnv: process.env.CORS_ORIGINS
 * }));
 * ```
 *
 * ### With custom development origins
 * ```typescript
 * app.enableCors(createCorsConfig({
 *   corsOriginsEnv: process.env.CORS_ORIGINS,
 *   developmentOrigins: ['http://localhost:3000', 'http://localhost:5173']
 * }));
 * ```
 *
 * ### With additional origins (e.g., mobile apps)
 * ```typescript
 * app.enableCors(createCorsConfig({
 *   corsOriginsEnv: process.env.CORS_ORIGINS,
 *   additionalOrigins: ['exp://localhost:8081', 'myapp://']
 * }));
 * ```
 *
 * ## Environment Variable Format
 *
 * The `CORS_ORIGINS` environment variable should be a comma-separated list:
 * ```
 * CORS_ORIGINS=https://app.staging.manacore.ai,https://api.staging.manacore.ai
 * ```
 *
 * ## Staging/Production Setup
 *
 * In docker-compose.staging.yml:
 * ```yaml
 * chat-backend:
 *   environment:
 *     CORS_ORIGINS: https://chat.staging.manacore.ai,https://chat-api.staging.manacore.ai
 * ```
 *
 * @param options - Configuration options
 * @returns NestJS CORS configuration object
 */
export function createCorsConfig(options: CorsConfigOptions = {}): CorsOptions {
	const {
		corsOriginsEnv,
		developmentOrigins = DEFAULT_DEV_ORIGINS,
		additionalOrigins = [],
	} = options;

	// Parse CORS_ORIGINS from environment
	const envOrigins = corsOriginsEnv
		? corsOriginsEnv
				.split(',')
				.map((origin) => origin.trim())
				.filter(Boolean)
		: [];

	// Combine all origins
	const allOrigins = [...envOrigins, ...developmentOrigins, ...additionalOrigins];

	// Remove duplicates
	const uniqueOrigins = Array.from(new Set(allOrigins));

	return {
		origin: uniqueOrigins,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	};
}

/**
 * Creates a CORS configuration with a custom origin callback.
 * Use this for more advanced CORS logic, such as allowing requests with no origin
 * (server-to-server calls) or implementing dynamic origin validation.
 *
 * @param options - Configuration options
 * @returns NestJS CORS configuration object with callback
 */
export function createCorsConfigWithCallback(options: CorsConfigOptions = {}): CorsOptions {
	const {
		corsOriginsEnv,
		developmentOrigins = DEFAULT_DEV_ORIGINS,
		additionalOrigins = [],
	} = options;

	const envOrigins = corsOriginsEnv
		? corsOriginsEnv
				.split(',')
				.map((origin) => origin.trim())
				.filter(Boolean)
		: [];

	const allOrigins = [...envOrigins, ...developmentOrigins, ...additionalOrigins];
	const uniqueOrigins = Array.from(new Set(allOrigins));

	return {
		origin: (origin, callback) => {
			// Allow requests with no origin (like mobile apps or curl)
			if (!origin || uniqueOrigins.includes(origin)) {
				callback(null, origin || '*');
			} else {
				callback(null, false);
			}
		},
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
	};
}
