export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	cors: { origins: string[] };
	groqApiKey: string;
	whisperModel: string;
}

export function loadConfig(): Config {
	const requiredEnv = (key: string, fallback?: string): string => {
		const value = process.env[key] || fallback;
		if (!value) throw new Error(`Missing required env var: ${key}`);
		return value;
	};

	return {
		port: parseInt(process.env.PORT || '3072', 10),
		databaseUrl: requiredEnv(
			'DATABASE_URL',
			'postgresql://manacore:devpassword@localhost:5432/mana_sync'
		),
		manaAuthUrl: requiredEnv('MANA_CORE_AUTH_URL', 'http://localhost:3001'),
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
		groqApiKey: process.env.GROQ_API_KEY || '',
		whisperModel: process.env.WHISPER_MODEL || 'whisper-large-v3-turbo',
	};
}
