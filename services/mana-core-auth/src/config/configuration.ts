/**
 * Application Configuration
 *
 * Loads and validates environment variables.
 * Fails fast at startup if required variables are missing.
 */

import { validateEnv, isDevelopment } from './env.validation';

// Validate environment on module load
const env = validateEnv();

export default () => ({
	port: parseInt(env.PORT, 10),
	nodeEnv: env.NODE_ENV,

	database: {
		// In development, allow fallback to local database
		// In production, DATABASE_URL is validated as required
		url:
			env.DATABASE_URL ||
			(isDevelopment() ? 'postgresql://manacore:manacore@localhost:5432/manacore_auth' : ''),
	},

	jwt: {
		// Better Auth uses JWKS from database, these are legacy/fallback
		publicKey: (env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n'),
		privateKey: (env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
		accessTokenExpiry: env.JWT_ACCESS_TOKEN_EXPIRY,
		refreshTokenExpiry: env.JWT_REFRESH_TOKEN_EXPIRY,
		issuer: env.JWT_ISSUER,
		audience: env.JWT_AUDIENCE,
	},

	redis: {
		host: env.REDIS_HOST || 'localhost',
		port: parseInt(env.REDIS_PORT || '6379', 10),
		password: env.REDIS_PASSWORD,
	},

	stripe: {
		secretKey: env.STRIPE_SECRET_KEY || '',
		webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
		publishableKey: env.STRIPE_PUBLISHABLE_KEY || '',
	},

	cors: {
		origin:
			env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ||
			(isDevelopment()
				? [
						'http://localhost:3000',
						'http://localhost:5173',
						'http://localhost:5174',
						'http://localhost:8081',
					]
				: []),
		credentials: true,
	},

	rateLimit: {
		ttl: parseInt(env.RATE_LIMIT_TTL || '60', 10),
		limit: parseInt(env.RATE_LIMIT_MAX || '100', 10),
	},

	credits: {
		signupBonus: parseInt(env.CREDITS_SIGNUP_BONUS || '150', 10),
		dailyFreeCredits: parseInt(env.CREDITS_DAILY_FREE || '5', 10),
	},

	ai: {
		geminiApiKey: env.GOOGLE_GENAI_API_KEY || '',
	},

	baseUrl: env.BASE_URL || (isDevelopment() ? 'http://localhost:3001' : ''),
});
