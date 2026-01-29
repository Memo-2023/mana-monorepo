export default () => ({
	port: parseInt(process.env.PORT || '3030', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	database: {
		url: process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/manacore',
	},

	cors: {
		origins: process.env.CORS_ORIGINS?.split(',') || [
			'http://localhost:3000',
			'http://localhost:5173',
		],
	},

	redis: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379', 10),
		password: process.env.REDIS_PASSWORD,
		keyPrefix: 'api-gateway:',
	},

	services: {
		search: process.env.SEARCH_SERVICE_URL || 'http://localhost:3021',
		stt: process.env.STT_SERVICE_URL || 'http://localhost:3020',
		tts: process.env.TTS_SERVICE_URL || 'http://localhost:3022',
	},

	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},

	apiKey: {
		prefixLive: process.env.API_KEY_PREFIX_LIVE || 'sk_live_',
		prefixTest: process.env.API_KEY_PREFIX_TEST || 'sk_test_',
	},

	defaults: {
		rateLimit: parseInt(process.env.DEFAULT_RATE_LIMIT || '10', 10),
		monthlyCredits: parseInt(process.env.DEFAULT_MONTHLY_CREDITS || '100', 10),
	},

	admin: {
		// Comma-separated list of user IDs that have admin access
		userIds: process.env.ADMIN_USER_IDS || '',
	},
});
