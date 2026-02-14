export default () => ({
	port: parseInt(process.env.PORT || '3312', 10),
	timezone: process.env.TZ || 'Europe/Berlin',
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		reportRoomId: process.env.MATRIX_REPORT_ROOM_ID || '',
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	umami: {
		apiUrl: process.env.UMAMI_API_URL || 'http://localhost:3000',
		username: process.env.UMAMI_USERNAME || 'admin',
		password: process.env.UMAMI_PASSWORD || '',
	},
	database: {
		url: process.env.DATABASE_URL || '',
	},
	prometheus: {
		url: process.env.PROMETHEUS_URL || 'http://localhost:9090',
	},
});

// Website IDs from Umami - update these with actual UUIDs
export const WEBSITE_IDS: Record<string, string> = {
	'manacore-webapp': process.env.UMAMI_WEBSITE_MANACORE || '',
	'chat-webapp': process.env.UMAMI_WEBSITE_CHAT || '',
	'todo-webapp': process.env.UMAMI_WEBSITE_TODO || '',
	'calendar-webapp': process.env.UMAMI_WEBSITE_CALENDAR || '',
	'clock-webapp': process.env.UMAMI_WEBSITE_CLOCK || '',
	'contacts-webapp': process.env.UMAMI_WEBSITE_CONTACTS || '',
	'storage-webapp': process.env.UMAMI_WEBSITE_STORAGE || '',
};

export const DISPLAY_NAMES: Record<string, string> = {
	'manacore-webapp': 'Dashboard',
	'chat-webapp': 'Chat',
	'todo-webapp': 'Todo',
	'calendar-webapp': 'Calendar',
	'clock-webapp': 'Clock',
	'contacts-webapp': 'Contacts',
	'storage-webapp': 'Storage',
};
