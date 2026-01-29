export default () => ({
	port: parseInt(process.env.PORT || '3021', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	cors: {
		origins: process.env.CORS_ORIGINS?.split(',') || [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:8081',
		],
	},

	searxng: {
		url: process.env.SEARXNG_URL || 'http://localhost:8080',
		timeout: parseInt(process.env.SEARXNG_TIMEOUT || '15000', 10),
		defaultLanguage: process.env.SEARXNG_DEFAULT_LANGUAGE || 'de-DE',
	},

	redis: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379', 10),
		password: process.env.REDIS_PASSWORD,
		keyPrefix: 'mana-search:',
	},

	cache: {
		searchTtl: parseInt(process.env.CACHE_SEARCH_TTL || '3600', 10), // 1 hour
		extractTtl: parseInt(process.env.CACHE_EXTRACT_TTL || '86400', 10), // 24 hours
	},

	extract: {
		timeout: parseInt(process.env.EXTRACT_TIMEOUT || '10000', 10),
		maxLength: parseInt(process.env.EXTRACT_MAX_LENGTH || '50000', 10),
		userAgent:
			process.env.EXTRACT_USER_AGENT ||
			'Mozilla/5.0 (compatible; ManaSearchBot/1.0; +https://manacore.app)',
	},
});
