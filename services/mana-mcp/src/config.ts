/**
 * Service configuration. All values come from env. Defaults match local
 * dev (`pnpm setup:env` writes the same values into .env files).
 */

export interface Config {
	port: number;
	authUrl: string;
	jwtAudience: string;
	manaSyncUrl: string;
	corsOrigins: string[];
	/**
	 * Policy enforcement mode:
	 *   'off'      — no policy evaluation (legacy behaviour).
	 *   'log-only' — evaluate, record metrics, but never deny a call.
	 *                Used during the M1 soak period (see docs/plans/
	 *                agent-loop-improvements-m1.md §Rollout).
	 *   'enforce'  — deny calls whose decision is allow:false.
	 */
	policyMode: 'off' | 'log-only' | 'enforce';
}

function intEnv(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) return fallback;
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0) {
		throw new Error(`${name} must be a positive integer, got "${raw}"`);
	}
	return n;
}

function parsePolicyMode(raw: string | undefined): Config['policyMode'] {
	const v = (raw ?? 'log-only').toLowerCase();
	if (v === 'off' || v === 'log-only' || v === 'enforce') return v;
	throw new Error(`POLICY_MODE must be off|log-only|enforce, got "${raw}"`);
}

export function loadConfig(): Config {
	return {
		port: intEnv('PORT', 3069),
		authUrl: process.env.MANA_AUTH_URL ?? 'http://localhost:3001',
		jwtAudience: process.env.JWT_AUDIENCE ?? 'mana',
		manaSyncUrl: process.env.MANA_SYNC_URL ?? 'http://localhost:3050',
		corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean),
		policyMode: parsePolicyMode(process.env.POLICY_MODE),
	};
}
