export default () => ({
	port: parseInt(process.env.PORT || '3011', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	database: {
		url: process.env.DATABASE_URL,
	},

	cors: {
		origins: process.env.CORS_ORIGINS?.split(',') || [
			'http://localhost:3000',
			'http://localhost:5173',
			'http://localhost:8081',
		],
	},

	auth: {
		manaAuthUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
		devBypass: process.env.DEV_BYPASS_AUTH === 'true',
		devUserId: process.env.DEV_USER_ID,
	},

	manaSearch: {
		url: process.env.MANA_SEARCH_URL || 'http://localhost:3021',
		timeout: parseInt(process.env.MANA_SEARCH_TIMEOUT || '30000', 10),
	},
});
