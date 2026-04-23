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
	};
}
