/**
 * Environment-driven config. Defaults match the local dev setup
 * (`pnpm setup:env` writes the same DATABASE_URL into .env files).
 */

export interface Config {
	port: number;
	databaseUrl: string;
	tickIntervalMs: number;
	runOnStartup: boolean;
}

export function loadConfig(): Config {
	return {
		port: parseInt(process.env.PORT || '3066', 10),
		databaseUrl:
			process.env.DATABASE_URL || 'postgresql://mana:devpassword@localhost:5432/mana_platform',
		tickIntervalMs: parseInt(process.env.TICK_INTERVAL_MS || '900000', 10), // 15 min
		runOnStartup: (process.env.RUN_ON_STARTUP || 'true') !== 'false',
	};
}
