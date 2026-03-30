export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	cors: { origins: string[] };
}

export function loadConfig(): Config {
	return {
		port: parseInt(process.env.PORT || '3073', 10),
		databaseUrl:
			process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/mana_sync',
		manaAuthUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
		cors: { origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(',') },
	};
}
