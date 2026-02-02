/**
 * Shared NestJS Bootstrap Utilities for ManaCore Backends
 *
 * Provides a consistent setup for CORS, validation, and global prefix
 * across all backend applications.
 */

import { type INestApplication, ValidationPipe, type Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';

/**
 * Default CORS origins for local development
 * These ports cover most common dev scenarios
 */
export const DEFAULT_CORS_ORIGINS = [
	'http://localhost:3000', // Common web dev port
	'http://localhost:3001', // Mana-core-auth
	'http://localhost:5173', // Vite default
	'http://localhost:8081', // Expo
	'exp://localhost:8081', // Expo native
];

/**
 * Configuration options for the bootstrap utility
 */
export interface BootstrapOptions {
	/** Default port if PORT env is not set */
	defaultPort: number;
	/** Service name for console log message */
	serviceName: string;
	/** Additional CORS origins beyond defaults (app-specific web port) */
	additionalCorsOrigins?: string[];
	/** API prefix (default: 'api/v1') */
	apiPrefix?: string;
	/** Routes to exclude from global prefix (default: ['metrics', 'health']) */
	excludeFromPrefix?: string[];
	/** HTTP methods for CORS (default: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) */
	corsMethods?: string[];
	/** Body size limit for JSON/urlencoded payloads (default: '100kb'). Use '50mb' for image uploads. */
	bodyLimit?: string;
}

/**
 * Parse CORS origins from environment or use defaults
 */
function getCorsOrigins(additionalOrigins: string[] = []): string[] {
	const envOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim());
	if (envOrigins && envOrigins.length > 0) {
		return envOrigins;
	}
	return [...DEFAULT_CORS_ORIGINS, ...additionalOrigins];
}

/**
 * Configure standard CORS settings for the application
 */
export function configureCors(
	app: INestApplication,
	options: { additionalOrigins?: string[]; methods?: string[] } = {}
): void {
	const corsOrigins = getCorsOrigins(options.additionalOrigins);
	const methods = options.methods || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

	app.enableCors({
		origin: corsOrigins,
		methods,
		credentials: true,
	});
}

/**
 * Configure standard validation pipe settings
 */
export function configureValidation(app: INestApplication): void {
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		})
	);
}

/**
 * Configure global API prefix with standard exclusions
 */
export function configurePrefix(
	app: INestApplication,
	prefix = 'api/v1',
	exclude: string[] = ['metrics', 'health']
): void {
	app.setGlobalPrefix(prefix, { exclude });
}

/**
 * Bootstrap a NestJS application with standard configuration
 *
 * @example
 * ```typescript
 * import { bootstrapApp } from '@manacore/shared-nestjs-setup';
 * import { AppModule } from './app.module';
 *
 * bootstrapApp(AppModule, {
 *   defaultPort: 3002,
 *   serviceName: 'Chat',
 *   additionalCorsOrigins: ['http://localhost:5178'],
 * });
 * ```
 */
export async function bootstrapApp(
	AppModule: Type<unknown>,
	options: BootstrapOptions
): Promise<INestApplication> {
	const app = await NestFactory.create(AppModule);

	// Configure body size limit (important for services handling image uploads)
	const bodyLimit = options.bodyLimit ?? '100kb';
	app.use(json({ limit: bodyLimit }));
	app.use(urlencoded({ extended: true, limit: bodyLimit }));

	// Configure CORS
	configureCors(app, {
		additionalOrigins: options.additionalCorsOrigins,
		methods: options.corsMethods,
	});

	// Configure validation
	configureValidation(app);

	// Configure global prefix
	configurePrefix(
		app,
		options.apiPrefix ?? 'api/v1',
		options.excludeFromPrefix ?? ['metrics', 'health']
	);

	// Start listening
	const port = process.env.PORT || options.defaultPort;
	await app.listen(port);

	console.log(`${options.serviceName} backend running on http://localhost:${port}`);

	return app;
}
