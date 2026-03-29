export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	cors: { origins: string[] };
}

export function loadConfig(): Config {
	const requiredEnv = (key: string, fallback?: string): string => {
		const value = process.env[key] || fallback;
		if (!value) throw new Error(`Missing required env var: ${key}`);
		return value;
	};

	return {
		port: parseInt(process.env.PORT || '3070', 10),
		databaseUrl: requiredEnv(
			'DATABASE_URL',
			'postgresql://uload:uload_dev_password_123@localhost:5432/uload_dev'
		),
		manaAuthUrl: requiredEnv('MANA_CORE_AUTH_URL', 'http://localhost:3001'),
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
	};
}
