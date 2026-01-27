export default () => ({
	port: parseInt(process.env.PORT || '3303', 10),
	nodeEnv: process.env.NODE_ENV || 'development',

	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN || '',
		allowedUsers: process.env.TELEGRAM_ALLOWED_USERS
			? process.env.TELEGRAM_ALLOWED_USERS.split(',').map((id) => parseInt(id.trim(), 10))
			: [],
	},

	calendar: {
		apiUrl: process.env.CALENDAR_API_URL || 'http://localhost:3016',
		authUrl: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},

	database: {
		url: process.env.DATABASE_URL,
	},

	reminder: {
		checkInterval: parseInt(process.env.REMINDER_CHECK_INTERVAL || '60000', 10),
		morningBriefing: {
			enabled: process.env.MORNING_BRIEFING_ENABLED === 'true',
			time: process.env.MORNING_BRIEFING_TIME || '07:00',
			timezone: process.env.MORNING_BRIEFING_TIMEZONE || 'Europe/Berlin',
		},
	},
});

// Command descriptions for BotFather
export const COMMANDS = [
	{ command: 'start', description: 'Hilfe & Account verknüpfen' },
	{ command: 'help', description: 'Verfügbare Befehle anzeigen' },
	{ command: 'today', description: 'Heutige Termine' },
	{ command: 'tomorrow', description: 'Morgige Termine' },
	{ command: 'week', description: 'Wochenübersicht' },
	{ command: 'next', description: 'Nächste Termine (z.B. /next 5)' },
	{ command: 'add', description: 'Termin hinzufügen' },
	{ command: 'calendars', description: 'Kalender-Übersicht' },
	{ command: 'remind', description: 'Erinnerungseinstellungen' },
	{ command: 'link', description: 'ManaCore Account verknüpfen' },
	{ command: 'unlink', description: 'Account-Verknüpfung trennen' },
	{ command: 'status', description: 'Verbindungsstatus prüfen' },
];

// Default reminder times (minutes before event)
export const DEFAULT_REMINDER_OPTIONS = [5, 10, 15, 30, 60, 120, 1440]; // 1440 = 1 day
