export default () => ({
	port: parseInt(process.env.PORT || '3305', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN || '',
		allowedUsers: process.env.TELEGRAM_ALLOWED_USERS
			? process.env.TELEGRAM_ALLOWED_USERS.split(',').map((id) => parseInt(id.trim(), 10))
			: [],
	},

	chat: {
		apiUrl: process.env.CHAT_API_URL || 'http://localhost:3002',
		authUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
		defaultModel: process.env.DEFAULT_MODEL || 'gemma3:4b',
	},

	database: {
		url: process.env.DATABASE_URL,
	},
});

// Command descriptions for BotFather
export const COMMANDS = [
	{ command: 'start', description: 'Hilfe & Account verknüpfen' },
	{ command: 'help', description: 'Verfügbare Befehle anzeigen' },
	{ command: 'models', description: 'Verfügbare AI-Modelle anzeigen' },
	{ command: 'model', description: 'Modell wechseln (z.B. /model claude)' },
	{ command: 'new', description: 'Neue Konversation starten' },
	{ command: 'convos', description: 'Konversationen auflisten' },
	{ command: 'history', description: 'Letzte Nachrichten anzeigen' },
	{ command: 'clear', description: 'Kontext löschen, neue Konversation' },
	{ command: 'status', description: 'Verbindungsstatus prüfen' },
	{ command: 'link', description: 'ManaCore Account verknüpfen' },
	{ command: 'unlink', description: 'Account-Verknüpfung trennen' },
];

// Model display names
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
	'gemma3:4b': '🏠 Gemma 3 4B (Lokal)',
	'meta-llama/llama-3.1-8b-instruct:free': '☁️ Llama 3.1 8B',
	'meta-llama/llama-3.1-70b-instruct': '☁️ Llama 3.1 70B',
	'deepseek/deepseek-chat': '☁️ DeepSeek V3',
	'mistralai/mistral-small': '☁️ Mistral Small',
	'anthropic/claude-3.5-sonnet': '☁️ Claude 3.5 Sonnet',
	'openai/gpt-4o-mini': '☁️ GPT-4o Mini',
};
