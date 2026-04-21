/**
 * Application configuration loaded from environment variables.
 */

export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	serviceKey: string;
	baseUrl: string;
	stalwart: {
		jmapUrl: string;
		adminUser: string;
		adminPassword: string;
		domain: string;
	};
	smtp: {
		host: string;
		port: number;
		user: string;
		password: string;
		from: string;
		insecureTls: boolean;
	};
	cors: {
		origins: string[];
	};
	broadcast: {
		/** HMAC secret for tracking tokens. Different from MANA_SERVICE_KEY
		 *  because tracking tokens appear in public URLs — the blast
		 *  radius of a leak is narrower with a dedicated secret. */
		trackingSecret: string;
		maxRecipientsPerCampaign: number;
		maxRecipientsPerHour: number;
	};
}

export function loadConfig(): Config {
	const requiredEnv = (key: string, fallback?: string): string => {
		const value = process.env[key] || fallback;
		if (!value) throw new Error(`Missing required env var: ${key}`);
		return value;
	};

	return {
		port: parseInt(process.env.PORT || '3042', 10),
		databaseUrl: requiredEnv(
			'DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_platform'
		),
		manaAuthUrl: requiredEnv('MANA_AUTH_URL', 'http://localhost:3001'),
		serviceKey: requiredEnv('MANA_SERVICE_KEY', 'dev-service-key'),
		baseUrl: requiredEnv('BASE_URL', 'http://localhost:3042'),
		stalwart: {
			jmapUrl: requiredEnv('STALWART_JMAP_URL', 'http://localhost:8080'),
			adminUser: requiredEnv('STALWART_ADMIN_USER', 'admin'),
			adminPassword: requiredEnv('STALWART_ADMIN_PASSWORD', 'ChangeMe123!'),
			domain: requiredEnv('MAIL_DOMAIN', 'mana.how'),
		},
		smtp: {
			host: process.env.SMTP_HOST || 'localhost',
			port: parseInt(process.env.SMTP_PORT || '587', 10),
			user: process.env.SMTP_USER || 'noreply',
			password: process.env.SMTP_PASSWORD || '',
			from: process.env.SMTP_FROM || 'Mana <noreply@mana.how>',
			insecureTls: process.env.SMTP_INSECURE_TLS === 'true',
		},
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
		broadcast: {
			trackingSecret: requiredEnv(
				'BROADCAST_TRACKING_SECRET',
				// Dev fallback — MUST be rotated in prod. The requiredEnv
				// signature accepts a fallback but throws if both env +
				// fallback are empty; the literal below keeps local dev
				// working without forcing users to set the var.
				'dev-only-broadcast-secret-change-me'
			),
			maxRecipientsPerCampaign: parseInt(
				process.env.BROADCAST_MAX_RECIPIENTS_PER_CAMPAIGN || '5000',
				10
			),
			maxRecipientsPerHour: parseInt(process.env.BROADCAST_MAX_RECIPIENTS_PER_HOUR || '500', 10),
		},
	};
}
