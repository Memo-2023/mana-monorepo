export default () => ({
	port: parseInt(process.env.PORT || '3023', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	cors: {
		origins: process.env.CORS_ORIGINS?.split(',') || [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:8081',
		],
	},

	database: {
		url:
			process.env.DATABASE_URL ||
			'postgresql://manacore:devpassword@localhost:5432/manacore',
	},

	redis: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379', 10),
		password: process.env.REDIS_PASSWORD,
		keyPrefix: 'mana-crawler:',
	},

	crawler: {
		userAgent:
			process.env.CRAWLER_USER_AGENT ||
			'ManaCoreCrawler/1.0 (+https://manacore.io/bot)',
		defaultRateLimit: parseFloat(process.env.CRAWLER_DEFAULT_RATE_LIMIT || '2'),
		defaultMaxDepth: parseInt(process.env.CRAWLER_DEFAULT_MAX_DEPTH || '3', 10),
		defaultMaxPages: parseInt(process.env.CRAWLER_DEFAULT_MAX_PAGES || '100', 10),
		timeout: parseInt(process.env.CRAWLER_TIMEOUT || '30000', 10),
	},

	queue: {
		concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5', 10),
		maxRetries: parseInt(process.env.QUEUE_MAX_RETRIES || '3', 10),
	},

	cache: {
		robotsTtl: parseInt(process.env.CACHE_ROBOTS_TTL || '86400', 10), // 24 hours
		resultsTtl: parseInt(process.env.CACHE_RESULTS_TTL || '3600', 10), // 1 hour
	},

	externalServices: {
		manaSearchUrl: process.env.MANA_SEARCH_URL || 'http://localhost:3021',
	},
});
