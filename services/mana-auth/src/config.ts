export interface Config {
	port: number;
	databaseUrl: string;
	syncDatabaseUrl: string;
	baseUrl: string;
	cookieDomain: string;
	nodeEnv: string;
	serviceKey: string;
	cors: { origins: string[] };
	manaNotifyUrl: string;
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
			'postgresql://mana:devpassword@localhost:5432/mana_platform'
		),
		syncDatabaseUrl: env(
			'SYNC_DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_sync'
		),
		baseUrl: env('BASE_URL', 'http://localhost:3001'),
		cookieDomain: env('COOKIE_DOMAIN'),
		nodeEnv: env('NODE_ENV', 'development'),
		serviceKey: env('MANA_SERVICE_KEY', 'dev-service-key'),
		cors: { origins: env('CORS_ORIGINS', 'http://localhost:5173').split(',') },
		manaNotifyUrl: env('MANA_NOTIFY_URL', 'http://localhost:3013'),
		manaCreditsUrl: env('MANA_CREDITS_URL', 'http://localhost:3061'),
		manaSubscriptionsUrl: env('MANA_SUBSCRIPTIONS_URL', 'http://localhost:3063'),
		synapseOidcClientSecret: env('SYNAPSE_OIDC_CLIENT_SECRET'),
	};
}
