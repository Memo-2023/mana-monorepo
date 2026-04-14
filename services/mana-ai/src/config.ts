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
	/** Shared key for service-to-service calls. */
	serviceKey: string;
	/** How often the background tick scans for due Missions, in ms. */
	tickIntervalMs: number;
	/** Flip to false to boot the HTTP surface without the background tick
	 *  — useful for local smoke-tests + Docker image build verification. */
	tickEnabled: boolean;
}

function requireEnv(key: string, fallback?: string): string {
	const value = process.env[key] ?? fallback;
	if (!value) throw new Error(`Missing required env var: ${key}`);
	return value;
}

export function loadConfig(): Config {
	return {
		port: parseInt(process.env.PORT ?? '3066', 10),
		syncDatabaseUrl: requireEnv(
			'SYNC_DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_sync'
		),
		manaLlmUrl: requireEnv('MANA_LLM_URL', 'http://localhost:3020'),
		serviceKey: requireEnv('MANA_SERVICE_KEY', 'dev-service-key'),
		tickIntervalMs: parseInt(process.env.TICK_INTERVAL_MS ?? '60000', 10),
		tickEnabled: process.env.TICK_ENABLED !== 'false',
	};
}
