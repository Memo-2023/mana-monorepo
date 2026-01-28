export default () => ({
	port: parseInt(process.env.PORT || '3303', 10),
	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN,
	},
	database: {
		url: process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/zitare_bot',
	},
});
