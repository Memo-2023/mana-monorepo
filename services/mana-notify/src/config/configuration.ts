export default () => ({
	port: parseInt(process.env.PORT || '3040', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	database: {
		url: process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/manacore',
	},

	redis: {
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || '6379', 10),
	},

	auth: {
		serviceKey: process.env.SERVICE_KEY || 'dev-service-key',
		manaCoreAuthUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},

	smtp: {
		host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
		port: parseInt(process.env.SMTP_PORT || '587', 10),
		user: process.env.SMTP_USER,
		password: process.env.SMTP_PASSWORD,
		from: process.env.SMTP_FROM || 'ManaCore <noreply@mana.how>',
	},

	push: {
		expoAccessToken: process.env.EXPO_ACCESS_TOKEN,
	},

	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL,
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
	},

	rateLimits: {
		emailPerMinute: parseInt(process.env.RATE_LIMIT_EMAIL_PER_MINUTE || '10', 10),
		pushPerMinute: parseInt(process.env.RATE_LIMIT_PUSH_PER_MINUTE || '100', 10),
	},

	cors: {
		origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:*'],
	},
});
