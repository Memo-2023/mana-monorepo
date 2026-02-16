/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup.
 * Fails fast with clear error messages if configuration is invalid.
 */

// Load .env file before validation runs
import * as dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

// Schema for environment variables
const envSchema = z.object({
	// Node environment
	NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	PORT: z.string().regex(/^\d+$/).default('3001'),

	// Database - REQUIRED in production
	DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

	// Redis - optional in development, recommended in production
	REDIS_HOST: z.string().optional(),
	REDIS_PORT: z.string().regex(/^\d+$/).optional(),
	REDIS_PASSWORD: z.string().optional(),

	// JWT - Better Auth uses JWKS, so these are optional legacy config
	JWT_PUBLIC_KEY: z.string().optional(),
	JWT_PRIVATE_KEY: z.string().optional(),
	JWT_ISSUER: z.string().default('manacore'),
	JWT_AUDIENCE: z.string().default('manacore'),
	JWT_ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
	JWT_REFRESH_TOKEN_EXPIRY: z.string().default('7d'),

	// CORS - REQUIRED in production
	CORS_ORIGINS: z.string().optional(),

	// Stripe - optional, but credit system won't work without it
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),
	STRIPE_PUBLISHABLE_KEY: z.string().optional(),

	// SMTP - optional, emails will be logged if not configured
	SMTP_HOST: z.string().optional(),
	SMTP_PORT: z.string().optional(),
	SMTP_USER: z.string().optional(),
	SMTP_PASSWORD: z.string().optional(),
	SMTP_FROM: z.string().optional(),

	// Rate limiting
	RATE_LIMIT_TTL: z.string().regex(/^\d+$/).optional(),
	RATE_LIMIT_MAX: z.string().regex(/^\d+$/).optional(),

	// AI
	GOOGLE_GENAI_API_KEY: z.string().optional(),

	// Storage
	MANACORE_STORAGE_PUBLIC_URL: z.string().optional(),

	// Base URL for callbacks
	BASE_URL: z.string().url().optional(),

	// Log level
	LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
});

// Production-specific schema with stricter requirements
const productionEnvSchema = envSchema.extend({
	// In production, these are mandatory
	CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS is required in production'),
	BASE_URL: z.string().url('BASE_URL must be a valid URL in production'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 *
 * @throws Error with detailed message if validation fails
 */
export function validateEnv(): EnvConfig {
	const isProduction = process.env.NODE_ENV === 'production';
	const schema = isProduction ? productionEnvSchema : envSchema;

	const result = schema.safeParse(process.env);

	if (!result.success) {
		const errors = result.error.errors
			.map((err) => `  - ${err.path.join('.')}: ${err.message}`)
			.join('\n');

		const message = `
╔══════════════════════════════════════════════════════════════╗
║                ENVIRONMENT CONFIGURATION ERROR                ║
╚══════════════════════════════════════════════════════════════╝

The following environment variables are missing or invalid:

${errors}

${isProduction ? 'Production mode requires stricter configuration.' : ''}

Please check your .env file or environment variables.
For development, copy .env.example to .env and fill in the values.
`;

		console.error(message);
		throw new Error(`Environment validation failed: ${result.error.message}`);
	}

	// Additional production warnings (non-fatal)
	if (isProduction) {
		const warnings: string[] = [];

		if (!result.data.STRIPE_SECRET_KEY) {
			warnings.push('STRIPE_SECRET_KEY not set - credit system will not work');
		}
		if (!result.data.SMTP_HOST) {
			warnings.push('SMTP not configured - emails will only be logged');
		}
		if (!result.data.REDIS_HOST) {
			warnings.push('REDIS_HOST not set - using in-memory session storage (not recommended)');
		}

		if (warnings.length > 0) {
			console.warn('\n⚠️  Production Warnings:');
			warnings.forEach((w) => console.warn(`   - ${w}`));
			console.warn('');
		}
	}

	return result.data;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
	return process.env.NODE_ENV !== 'production';
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
	return process.env.NODE_ENV === 'production';
}
