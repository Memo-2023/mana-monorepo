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
	manaMailUrl: string;
	/** Base64-encoded 32-byte AES-256 key encryption key (KEK). Wraps each
	 *  user's master key in auth.encryption_vaults. Required in production
	 *  — in development a deterministic dev KEK is auto-generated so the
	 *  service still boots, with a loud warning. */
	encryptionKek: string;
	/**
	 * PEM-encoded RSA-OAEP-2048 public key for the mana-ai Mission
	 * Grant runner. The `/me/ai-mission-grant` endpoint wraps per-
	 * mission data keys with this public key so only mana-ai (holder
	 * of the paired private key) can unwrap them. Optional at boot:
	 * when absent, the endpoint returns 503 so the UI can degrade
	 * to foreground-only execution.
	 */
	missionGrantPublicKeyPem?: string;
	/** WebAuthn passkey settings. `rpId` is the effective domain the
	 *  authenticator binds credentials to — `mana.how` in prod (scopes
	 *  passkeys across all subdomains) and `localhost` in dev. `origin`
	 *  is the URL where the browser made the WebAuthn call; mismatches
	 *  cause the verification step to fail with `invalid origin`. `name`
	 *  is shown to the user in the authenticator prompt ("Register a
	 *  passkey for Mana"). */
	webauthn: {
		rpId: string;
		rpName: string;
		origin: string | string[];
	};
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

	const corsOrigins = env('CORS_ORIGINS', 'http://localhost:5173').split(',');

	// WebAuthn: derive sensible defaults from the auth service's
	// BASE_URL + COOKIE_DOMAIN so a dev never has to set three extra
	// env vars. In prod, override explicitly.
	//
	// rpId must be the bare effective domain (no protocol, no port).
	// A mismatch between rpId and the client's origin hostname causes
	// SecurityError at registration time. Deriving rpId from
	// COOKIE_DOMAIN (already stripped of its leading dot for the shared
	// cookie) keeps it honest — `.mana.how` → `mana.how` — and falls
	// back to the hostname of BASE_URL.
	const cookieDomain = env('COOKIE_DOMAIN');
	const defaultRpId = cookieDomain
		? cookieDomain.replace(/^\./, '')
		: new URL(env('BASE_URL', 'http://localhost:3001')).hostname;

	return {
		port: parseInt(env('PORT', '3001'), 10),
		databaseUrl: env('DATABASE_URL', 'postgresql://mana:devpassword@localhost:5432/mana_platform'),
		syncDatabaseUrl: env(
			'SYNC_DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_sync'
		),
		baseUrl: env('BASE_URL', 'http://localhost:3001'),
		cookieDomain,
		nodeEnv,
		serviceKey: env('MANA_SERVICE_KEY', 'dev-service-key'),
		cors: { origins: corsOrigins },
		manaNotifyUrl: env('MANA_NOTIFY_URL', 'http://localhost:3013'),
		manaCreditsUrl: env('MANA_CREDITS_URL', 'http://localhost:3061'),
		manaSubscriptionsUrl: env('MANA_SUBSCRIPTIONS_URL', 'http://localhost:3063'),
		manaMailUrl: env('MANA_MAIL_URL', 'http://localhost:3042'),
		encryptionKek,
		missionGrantPublicKeyPem: env('MANA_AI_PUBLIC_KEY_PEM') || undefined,
		webauthn: {
			rpId: env('WEBAUTHN_RP_ID', defaultRpId),
			rpName: env('WEBAUTHN_RP_NAME', 'Mana'),
			// Pass every CORS origin as allowed WebAuthn origin by default
			// so the same passkey works from any app subdomain. Override
			// with WEBAUTHN_ORIGIN to restrict further.
			origin: env('WEBAUTHN_ORIGIN') ? env('WEBAUTHN_ORIGIN').split(',') : corsOrigins,
		},
	};
}
