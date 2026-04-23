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
	/** mana-research HTTP endpoint (Hono/Bun, port 3068). Hosts the
	 *  async-research submit/poll endpoints that the deep-research pre-
	 *  planning path delegates to for multi-minute Gemini tasks. */
	manaResearchUrl: string;
	/** Opt-in gate for the deep-research pre-planning path. Default off
	 *  — deep runs cost $1–7 per mission, so we only want them triggered
	 *  when explicitly enabled on the server. */
	deepResearchEnabled: boolean;
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
	/**
	 * Policy gate mode for server-side tool dispatch:
	 *   'off'      — legacy, no policy evaluation.
	 *   'log-only' — evaluate and log decisions, never block.
	 *   'enforce'  — convert deny decisions into failed ToolResults so the
	 *                LLM sees the rejection and can course-correct.
	 * Defaults to 'log-only' to match the M1 rollout plan.
	 */
	policyMode: 'off' | 'log-only' | 'enforce';
	/**
	 * Context-window ceiling used by the compactor (Claude-Code `wU2`
	 * pattern). When cumulative prompt+completion tokens cross 92% of
	 * this, the loop folds the middle of messages into a compact
	 * summary before the next LLM call. Default matches
	 * gemini-2.5-flash's 1M-token context window; override via
	 * MANA_AI_COMPACT_MAX_CTX for deployments on smaller models. Set
	 * to 0 to disable compaction entirely.
	 */
	compactMaxContextTokens: number;
}

function requireEnv(key: string, fallback?: string): string {
	const value = process.env[key] ?? fallback;
	if (!value) throw new Error(`Missing required env var: ${key}`);
	return value;
}

function parsePolicyMode(raw: string | undefined): Config['policyMode'] {
	const v = (raw ?? 'log-only').toLowerCase();
	if (v === 'off' || v === 'log-only' || v === 'enforce') return v;
	throw new Error(`POLICY_MODE must be off|log-only|enforce, got "${raw}"`);
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
		manaResearchUrl: requireEnv('MANA_RESEARCH_URL', 'http://localhost:3068'),
		deepResearchEnabled: process.env.MANA_AI_DEEP_RESEARCH_ENABLED === 'true',
		serviceKey: requireEnv('MANA_SERVICE_KEY', 'dev-service-key'),
		tickIntervalMs: parseInt(process.env.TICK_INTERVAL_MS ?? '60000', 10),
		tickEnabled: process.env.TICK_ENABLED !== 'false',
		missionGrantPrivateKeyPem: process.env.MANA_AI_PRIVATE_KEY_PEM || undefined,
		policyMode: parsePolicyMode(process.env.POLICY_MODE),
		compactMaxContextTokens: parseInt(process.env.MANA_AI_COMPACT_MAX_CTX ?? '1000000', 10),
	};
}
