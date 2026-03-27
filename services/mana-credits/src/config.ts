/**
 * Application configuration loaded from environment variables.
 */

export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	serviceKey: string;
	baseUrl: string;
	stripe: {
		secretKey: string;
		webhookSecret: string;
	};
	cors: {
		origins: string[];
	};
}

export function loadConfig(): Config {
	const requiredEnv = (key: string, fallback?: string): string => {
		const value = process.env[key] || fallback;
		if (!value) throw new Error(`Missing required env var: ${key}`);
		return value;
	};

	return {
		port: parseInt(process.env.PORT || '3060', 10),
		databaseUrl: requiredEnv(
			'DATABASE_URL',
			'postgresql://manacore:devpassword@localhost:5432/mana_credits'
		),
		manaAuthUrl: requiredEnv('MANA_CORE_AUTH_URL', 'http://localhost:3001'),
		serviceKey: requiredEnv('MANA_CORE_SERVICE_KEY', 'dev-service-key'),
		baseUrl: requiredEnv('BASE_URL', 'http://localhost:3060'),
		stripe: {
			secretKey: process.env.STRIPE_SECRET_KEY || '',
			webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
		},
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
	};
}
