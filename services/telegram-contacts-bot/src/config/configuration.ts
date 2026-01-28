export default () => ({
	port: parseInt(process.env.PORT || '3304', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN || '',
		allowedUsers: process.env.TELEGRAM_ALLOWED_USERS
			? process.env.TELEGRAM_ALLOWED_USERS.split(',').map((id) => parseInt(id.trim(), 10))
			: [],
	},

	contacts: {
		apiUrl: process.env.CONTACTS_API_URL || 'http://localhost:3015',
		authUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},

	database: {
		url: process.env.DATABASE_URL,
	},

	birthday: {
		checkEnabled: process.env.BIRTHDAY_CHECK_ENABLED === 'true',
		checkTime: process.env.BIRTHDAY_CHECK_TIME || '08:00',
		timezone: process.env.BIRTHDAY_CHECK_TIMEZONE || 'Europe/Berlin',
		daysAhead: parseInt(process.env.BIRTHDAY_DAYS_AHEAD || '7', 10),
	},
});

// Command descriptions for BotFather
export const COMMANDS = [
	{ command: 'start', description: 'Hilfe & Account verknüpfen' },
	{ command: 'help', description: 'Verfügbare Befehle anzeigen' },
	{ command: 'search', description: 'Kontakt suchen (z.B. /search Max)' },
	{ command: 'favorites', description: 'Favoriten-Kontakte anzeigen' },
	{ command: 'recent', description: 'Zuletzt hinzugefügte Kontakte' },
	{ command: 'birthdays', description: 'Anstehende Geburtstage' },
	{ command: 'add', description: 'Neuen Kontakt hinzufügen' },
	{ command: 'tags', description: 'Alle Tags anzeigen' },
	{ command: 'tag', description: 'Kontakte mit Tag anzeigen' },
	{ command: 'stats', description: 'Kontakt-Statistiken' },
	{ command: 'link', description: 'ManaCore Account verknüpfen' },
	{ command: 'unlink', description: 'Account-Verknüpfung trennen' },
	{ command: 'status', description: 'Verbindungsstatus prüfen' },
];

// Activity types for logging
export const ACTIVITY_TYPES = {
	called: '📞 Angerufen',
	emailed: '📧 E-Mail gesendet',
	met: '🤝 Getroffen',
	messaged: '💬 Nachricht gesendet',
	note_added: '📝 Notiz hinzugefügt',
};
