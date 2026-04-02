export interface Config {
	port: number;
	databaseUrl: string;
	syncDatabaseUrl: string;
	baseUrl: string;
	cookieDomain: string;
	nodeEnv: string;
	serviceKey: string;
	cors: { origins: string[] };
	smtp: {
		host: string;
		port: number;
		user: string;
		pass: string;
	};
	manaCreditsUrl: string;
	manaSubscriptionsUrl: string;
	synapseOidcClientSecret: string;
}

export function loadConfig(): Config {
	const env = (key: string, fallback?: string) => process.env[key] || fallback || '';
	return {
		port: parseInt(env('PORT', '3001'), 10),
		databaseUrl: env(
			'DATABASE_URL',
			'postgresql://manacore:devpassword@localhost:5432/mana_platform'
		),
		syncDatabaseUrl: env(
			'SYNC_DATABASE_URL',
			'postgresql://manacore:devpassword@localhost:5432/mana_sync'
		),
		baseUrl: env('BASE_URL', 'http://localhost:3001'),
		cookieDomain: env('COOKIE_DOMAIN'),
		nodeEnv: env('NODE_ENV', 'development'),
		serviceKey: env('MANA_CORE_SERVICE_KEY', 'dev-service-key'),
		cors: { origins: env('CORS_ORIGINS', 'http://localhost:5173').split(',') },
		smtp: {
			host: env('SMTP_HOST', 'smtp-relay.brevo.com'),
			port: parseInt(env('SMTP_PORT', '587'), 10),
			user: env('SMTP_USER'),
			pass: env('SMTP_PASS'),
		},
		manaCreditsUrl: env('MANA_CREDITS_URL', 'http://localhost:3061'),
		manaSubscriptionsUrl: env('MANA_SUBSCRIPTIONS_URL', 'http://localhost:3063'),
		synapseOidcClientSecret: env('SYNAPSE_OIDC_CLIENT_SECRET'),
	};
}
