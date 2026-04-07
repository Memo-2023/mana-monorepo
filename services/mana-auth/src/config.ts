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
	/** Base64-encoded 32-byte AES-256 key encryption key (KEK). Wraps each
	 *  user's master key in auth.encryption_vaults. Required in production
	 *  — in development a deterministic dev KEK is auto-generated so the
	 *  service still boots, with a loud warning. */
	encryptionKek: string;
}

export function loadConfig(): Config {
	const env = (key: string, fallback?: string) => process.env[key] || fallback || '';
	const nodeEnv = env('NODE_ENV', 'development');

	// Encryption KEK: in production a missing/short value is fatal — the
	// vault service refuses to mint or unwrap any master keys without a
	// real KEK. In development we auto-fill with a deterministic dev key
	// so contributors can run the service without setting up a secret.
	let encryptionKek = env('MANA_AUTH_KEK');
	if (!encryptionKek) {
		if (nodeEnv === 'production') {
			throw new Error(
				'mana-auth: MANA_AUTH_KEK env var is required in production. ' +
					'Set it to a base64-encoded 32-byte random value: ' +
					'`openssl rand -base64 32`'
			);
		}
		// 32 zero bytes — deterministic, obviously not for production. The
		// vault service logs a loud warning at startup when it sees this.
		encryptionKek = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
	}

	return {
		port: parseInt(env('PORT', '3001'), 10),
		databaseUrl: env('DATABASE_URL', 'postgresql://mana:devpassword@localhost:5432/mana_platform'),
		syncDatabaseUrl: env(
			'SYNC_DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_sync'
		),
		baseUrl: env('BASE_URL', 'http://localhost:3001'),
		cookieDomain: env('COOKIE_DOMAIN'),
		nodeEnv,
		serviceKey: env('MANA_SERVICE_KEY', 'dev-service-key'),
		cors: { origins: env('CORS_ORIGINS', 'http://localhost:5173').split(',') },
		manaNotifyUrl: env('MANA_NOTIFY_URL', 'http://localhost:3013'),
		manaCreditsUrl: env('MANA_CREDITS_URL', 'http://localhost:3061'),
		manaSubscriptionsUrl: env('MANA_SUBSCRIPTIONS_URL', 'http://localhost:3063'),
		synapseOidcClientSecret: env('SYNAPSE_OIDC_CLIENT_SECRET'),
		encryptionKek,
	};
}
