export default () => ({
	port: parseInt(process.env.PORT || '3001', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	database: {
		url: process.env.DATABASE_URL || 'postgresql://manacore:password@localhost:5432/manacore',
	},

	jwt: {
		// Convert \n string literals to actual newlines for PEM format
		publicKey: (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n'),
		privateKey: (process.env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
		accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
		refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
		issuer: process.env.JWT_ISSUER || 'manacore',
		audience: process.env.JWT_AUDIENCE || 'manacore',
	},

	redis: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379', 10),
		password: process.env.REDIS_PASSWORD,
	},

	stripe: {
		secretKey: process.env.STRIPE_SECRET_KEY || '',
		webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
		publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
	},

	cors: {
		origin: process.env.CORS_ORIGINS?.split(',') || [
			'http://localhost:3000',
			'http://localhost:8081',
		],
		credentials: true,
	},

	rateLimit: {
		ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
		limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
	},

	credits: {
		signupBonus: parseInt(process.env.CREDITS_SIGNUP_BONUS || '150', 10),
		dailyFreeCredits: parseInt(process.env.CREDITS_DAILY_FREE || '5', 10),
	},

	ai: {
		geminiApiKey: process.env.GOOGLE_GENAI_API_KEY || '',
	},
});
