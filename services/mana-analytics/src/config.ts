export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	manaLlmUrl: string;
	serviceKey: string;
	cors: { origins: string[] };
}

export function loadConfig(): Config {
	const env = (key: string, fallback?: string) => process.env[key] || fallback || '';
	return {
		port: parseInt(env('PORT', '3064'), 10),
		databaseUrl: env(
			'DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_platform'
		),
		manaAuthUrl: env('MANA_AUTH_URL', 'http://localhost:3001'),
		manaLlmUrl: env('MANA_LLM_URL', 'http://localhost:3025'),
		serviceKey: env('MANA_SERVICE_KEY', 'dev-service-key'),
		cors: { origins: env('CORS_ORIGINS', 'http://localhost:5173').split(',') },
	};
}
