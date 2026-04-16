/**
 * Env-driven config for the mana-ai service.
 *
 * Only references the secrets/URLs the tick loop needs. Auth is
 * service-to-service via MANA_SERVICE_KEY (same pattern as mana-credits,
 * mana-user); no end-user JWTs reach this service.
 */

export interface Config {
	port: number;
	/** mana_sync DB — source of Mission rows (via sync_changes replay). */
	syncDatabaseUrl: string;
	/** mana-llm HTTP endpoint (OpenAI-compatible). */
	manaLlmUrl: string;
	/** Unified mana-api (Hono/Bun, port 3060). Hosts module-specific
	 *  compute endpoints including news-research. Used by the pre-planning
	 *  research step to feed web-research context into the planner prompt
	 *  before it produces plan steps. */
	manaApiUrl: string;
	/** Shared key for service-to-service calls. */
	serviceKey: string;
	/** How often the background tick scans for due Missions, in ms. */
	tickIntervalMs: number;
	/** Flip to false to boot the HTTP surface without the background tick
	 *  — useful for local smoke-tests + Docker image build verification. */
	tickEnabled: boolean;
	/**
	 * PEM-encoded RSA-OAEP-2048 private key for unwrapping Mission Grants.
	 * Paired with the public key pinned in mana-auth's config. Provision
	 * via Docker secret / out-of-band env; never commit.
	 *
	 * Optional at boot so the service can start without grant support
	 * (development, legacy deployments). When absent, Missions that
	 * carry a Grant are skipped with state='grant-missing'.
	 *
	 * Generate with:
	 *   openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out priv.pem
	 *   openssl pkey -in priv.pem -pubout -out pub.pem
	 */
	missionGrantPrivateKeyPem?: string;
}

function requireEnv(key: string, fallback?: string): string {
	const value = process.env[key] ?? fallback;
	if (!value) throw new Error(`Missing required env var: ${key}`);
	return value;
}

export function loadConfig(): Config {
	return {
		port: parseInt(process.env.PORT ?? '3067', 10),
		syncDatabaseUrl: requireEnv(
			'SYNC_DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_sync'
		),
		manaLlmUrl: requireEnv('MANA_LLM_URL', 'http://localhost:3020'),
		manaApiUrl: requireEnv('MANA_API_URL', 'http://localhost:3060'),
		serviceKey: requireEnv('MANA_SERVICE_KEY', 'dev-service-key'),
		tickIntervalMs: parseInt(process.env.TICK_INTERVAL_MS ?? '60000', 10),
		tickEnabled: process.env.TICK_ENABLED !== 'false',
		missionGrantPrivateKeyPem: process.env.MANA_AI_PRIVATE_KEY_PEM || undefined,
	};
}
