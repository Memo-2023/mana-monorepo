/**
 * Application configuration loaded from environment variables.
 */

export interface Config {
	port: number;
	databaseUrl: string;
	redisUrl: string;
	manaAuthUrl: string;
	manaLlmUrl: string;
	manaCreditsUrl: string;
	manaSearchUrl: string;
	serviceKey: string;
	cors: { origins: string[] };
	cacheTtlSeconds: number;
	providerKeys: {
		brave?: string;
		tavily?: string;
		exa?: string;
		serper?: string;
		perplexity?: string;
		anthropic?: string;
		openai?: string;
		googleGenai?: string;
		jina?: string;
		firecrawl?: string;
		scrapingbee?: string;
	};
}

export function loadConfig(): Config {
	const requiredEnv = (key: string, fallback?: string): string => {
		const value = process.env[key] || fallback;
		if (!value) throw new Error(`Missing required env var: ${key}`);
		return value;
	};

	return {
		port: parseInt(process.env.PORT || '3068', 10),
		databaseUrl: requiredEnv(
			'DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_platform'
		),
		redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
		manaAuthUrl: requiredEnv('MANA_AUTH_URL', 'http://localhost:3001'),
		manaLlmUrl: requiredEnv('MANA_LLM_URL', 'http://localhost:3025'),
		manaCreditsUrl: requiredEnv('MANA_CREDITS_URL', 'http://localhost:3061'),
		manaSearchUrl: requiredEnv('MANA_SEARCH_URL', 'http://localhost:3021'),
		serviceKey: requiredEnv('MANA_SERVICE_KEY', 'dev-service-key'),
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
		cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '3600', 10),
		providerKeys: {
			brave: process.env.BRAVE_API_KEY,
			tavily: process.env.TAVILY_API_KEY,
			exa: process.env.EXA_API_KEY,
			serper: process.env.SERPER_API_KEY,
			perplexity: process.env.PERPLEXITY_API_KEY,
			anthropic: process.env.ANTHROPIC_API_KEY,
			openai: process.env.OPENAI_API_KEY,
			googleGenai: process.env.GOOGLE_GENAI_API_KEY,
			jina: process.env.JINA_API_KEY,
			firecrawl: process.env.FIRECRAWL_API_KEY,
			scrapingbee: process.env.SCRAPINGBEE_API_KEY,
		},
	};
}
