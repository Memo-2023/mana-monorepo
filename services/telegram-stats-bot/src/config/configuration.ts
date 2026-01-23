export default () => ({
	port: parseInt(process.env.PORT || '3300', 10),
	timezone: process.env.TZ || 'Europe/Berlin',
	telegram: {
		botToken: process.env.TELEGRAM_BOT_TOKEN,
		chatId: process.env.TELEGRAM_CHAT_ID,
	},
	umami: {
		apiUrl: process.env.UMAMI_API_URL || 'http://localhost:3200',
		username: process.env.UMAMI_USERNAME || 'admin',
		password: process.env.UMAMI_PASSWORD,
	},
	database: {
		url: process.env.DATABASE_URL,
	},
});

export const WEBSITE_IDS: Record<string, string> = {
	// Landing Pages
	'chat-landing': 'a264b165-80d2-47ab-91f4-2efc01de0b66',
	'manacore-landing': 'cef3798d-85ae-47df-a44a-e9bee09dbcf9',
	'clock-landing': '0332b471-a022-46af-a726-0f45932bfd58',

	// Web Apps
	'chat-webapp': '5cf9d569-3266-4a57-80dd-3a652dc32786',
	'manacore-webapp': '4a14016d-394a-44e0-8ecc-67271f63ffb0',
	'todo-webapp': 'ac021d98-778e-46cf-b6b2-2f650ea78f07',
	'calendar-webapp': '884fc0a8-3b67-43bd-903b-2be531c66792',
	'clock-webapp': '1e7b5006-87a5-4547-8a3d-ab30eac15dd4',
	'contacts-webapp': 'ab89a839-be15-4949-99b4-e72492cee4ff',
	'picture-webapp': 'bc552bd2-667d-44b4-a717-0dce6a8db98f',
	'manadeck-webapp': '314fc57a-c63d-4008-b19e-5e272c0329d6',
	'planta-webapp': '876f30bd-43e3-405a-9697-6157db67ca6b',
	'zitare-landing': '17e7f92d-8f85-4e78-a4f5-10f0b47e8fb8',
	'zitare-webapp': '8ad3c21f-6e9b-4d1e-b3a2-5c8f7d6e9a4b',
};

// Grouped websites for reporting
export const WEBSITE_GROUPS = {
	landings: ['chat-landing', 'manacore-landing', 'clock-landing', 'zitare-landing'],
	webapps: [
		'manacore-webapp',
		'chat-webapp',
		'todo-webapp',
		'calendar-webapp',
		'clock-webapp',
		'contacts-webapp',
		'picture-webapp',
		'manadeck-webapp',
		'planta-webapp',
		'zitare-webapp',
	],
};

// Display names for reports
export const DISPLAY_NAMES: Record<string, string> = {
	'chat-landing': 'Chat Landing',
	'chat-webapp': 'Chat',
	'manacore-landing': 'ManaCore Landing',
	'manacore-webapp': 'ManaCore',
	'todo-webapp': 'Todo',
	'calendar-webapp': 'Calendar',
	'clock-landing': 'Clock Landing',
	'clock-webapp': 'Clock',
	'contacts-webapp': 'Contacts',
	'picture-webapp': 'Picture',
	'manadeck-webapp': 'ManaDeck',
	'planta-webapp': 'Planta',
	'zitare-landing': 'Zitare Landing',
	'zitare-webapp': 'Zitare',
};
