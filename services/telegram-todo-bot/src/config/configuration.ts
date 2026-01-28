export default () => ({
	port: parseInt(process.env.PORT || '3304', 10),
	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN,
	},
	database: {
		url: process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/todo_bot',
	},
	todoApi: {
		url: process.env.TODO_API_URL || 'http://localhost:3018',
	},
	manaCore: {
		authUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});
