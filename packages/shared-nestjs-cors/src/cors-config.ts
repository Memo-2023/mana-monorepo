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

	/**
	 * Include all ManaCore app origins for cross-app communication.
	 * When true, automatically includes all staging and production URLs.
	 */
	includeAllManaApps?: boolean;
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
 * All ManaCore staging app origins.
 * Use this bundle to allow cross-app communication in staging environment.
 */
export const MANACORE_STAGING_ORIGINS = [
	// Main apps
	'https://staging.manacore.ai', // Main web
	'https://auth.staging.manacore.ai', // Auth service

	// Chat app
	'https://chat.staging.manacore.ai',
	'https://chat-api.staging.manacore.ai',

	// Picture app
	'https://picture.staging.manacore.ai',
	'https://picture-api.staging.manacore.ai',

	// Zitare app
	'https://zitare.staging.manacore.ai',
	'https://zitare-api.staging.manacore.ai',

	// Contacts app
	'https://contacts.staging.manacore.ai',
	'https://contacts-api.staging.manacore.ai',

	// Calendar app
	'https://calendar.staging.manacore.ai',
	'https://calendar-api.staging.manacore.ai',

	// Clock app
	'https://clock.staging.manacore.ai',
	'https://clock-api.staging.manacore.ai',

	// Todo app
	'https://todo.staging.manacore.ai',
	'https://todo-api.staging.manacore.ai',
];

/**
 * All ManaCore production app origins.
 * Use this bundle to allow cross-app communication in production environment.
 */
export const MANACORE_PRODUCTION_ORIGINS = [
	// Main apps
	'https://manacore.ai', // Main web
	'https://auth.manacore.ai', // Auth service

	// Chat app
	'https://chat.manacore.ai',
	'https://chat-api.manacore.ai',

	// Picture app
	'https://picture.manacore.ai',
	'https://picture-api.manacore.ai',

	// Zitare app
	'https://zitare.manacore.ai',
	'https://zitare-api.manacore.ai',

	// Contacts app
	'https://contacts.manacore.ai',
	'https://contacts-api.manacore.ai',

	// Calendar app
	'https://calendar.manacore.ai',
	'https://calendar-api.manacore.ai',

	// Clock app
	'https://clock.manacore.ai',
	'https://clock-api.manacore.ai',

	// Todo app
	'https://todo.manacore.ai',
	'https://todo-api.manacore.ai',
];

/**
 * Combined bundle of all ManaCore app origins (staging + production).
 * Use this for maximum cross-app compatibility across all environments.
 */
export const MANACORE_ALL_APP_ORIGINS = [
	...MANACORE_STAGING_ORIGINS,
	...MANACORE_PRODUCTION_ORIGINS,
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
 * ### With cross-app communication bundle (enables all ManaCore apps)
 * ```typescript
 * app.enableCors(createCorsConfig({
 *   corsOriginsEnv: process.env.CORS_ORIGINS,
 *   includeAllManaApps: true  // Includes all staging + production app URLs
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
 * ### Simple setup (no cross-app communication needed)
 * In docker-compose.staging.yml:
 * ```yaml
 * chat-backend:
 *   environment:
 *     CORS_ORIGINS: https://chat.staging.manacore.ai,https://chat-api.staging.manacore.ai
 * ```
 *
 * ### Cross-app setup (allow all ManaCore apps to communicate)
 * ```typescript
 * // main.ts
 * app.enableCors(createCorsConfig({
 *   corsOriginsEnv: process.env.CORS_ORIGINS,
 *   includeAllManaApps: true  // No need to list each app individually
 * }));
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
		includeAllManaApps = false,
	} = options;

	// Parse CORS_ORIGINS from environment
	const envOrigins = corsOriginsEnv
		? corsOriginsEnv
				.split(',')
				.map((origin) => origin.trim())
				.filter(Boolean)
		: [];

	// Combine all origins
	const allOrigins = [
		...envOrigins,
		...developmentOrigins,
		...additionalOrigins,
		...(includeAllManaApps ? MANACORE_ALL_APP_ORIGINS : []),
	];

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
		includeAllManaApps = false,
	} = options;

	const envOrigins = corsOriginsEnv
		? corsOriginsEnv
				.split(',')
				.map((origin) => origin.trim())
				.filter(Boolean)
		: [];

	const allOrigins = [
		...envOrigins,
		...developmentOrigins,
		...additionalOrigins,
		...(includeAllManaApps ? MANACORE_ALL_APP_ORIGINS : []),
	];
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
