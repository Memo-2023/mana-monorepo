export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	manaLlmUrl: string;
	manaCreditsUrl: string;
	serviceKey: string;
	/**
	 * Secret seeded into the per-user display-hash for the public-community
	 * pseudonym ("Wachsame Eule #4528"). Rotating this re-keys all future
	 * pseudonyms — existing rows keep the old hash/name.
	 */
	pseudonymSecret: string;
	/**
	 * UserIds that bypass the +5 / +500 community credit grants — they would
	 * otherwise self-reward when posting/shipping their own wishes. Comma-
	 * separated env, empty in dev.
	 */
	founderUserIds: Set<string>;
	cors: { origins: string[] };
}

export function loadConfig(): Config {
	const env = (key: string, fallback?: string) => process.env[key] || fallback || '';
	return {
		port: parseInt(env('PORT', '3064'), 10),
		databaseUrl: env('DATABASE_URL', 'postgresql://mana:devpassword@localhost:5432/mana_platform'),
		manaAuthUrl: env('MANA_AUTH_URL', 'http://localhost:3001'),
		manaLlmUrl: env('MANA_LLM_URL', 'http://localhost:3025'),
		manaCreditsUrl: env('MANA_CREDITS_URL', 'http://localhost:3061'),
		serviceKey: env('MANA_SERVICE_KEY', 'dev-service-key'),
		pseudonymSecret: env('FEEDBACK_PSEUDONYM_SECRET', 'dev-pseudonym-secret'),
		founderUserIds: new Set(
			env('FEEDBACK_FOUNDER_USER_IDS', '')
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		),
		cors: { origins: env('CORS_ORIGINS', 'http://localhost:5173').split(',') },
	};
}
