export default () => ({
	port: parseInt(process.env.PORT || '3315', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	calendar: {
		apiUrl: process.env.CALENDAR_API_URL || 'http://localhost:3016/api/v1',
	},
});

export const HELP_TEXT = `📅 **Calendar Bot - Hilfe**

**Termine anzeigen:**
• \`!heute\` - Termine für heute
• \`!morgen\` - Termine für morgen
• \`!woche\` - Termine diese Woche
• \`!termine\` - Nächste 7 Tage

**Termine erstellen:**
• \`!termin [Titel] am [Datum] um [Uhrzeit]\`
• \`!termin Meeting am 15.02. um 14:00\`
• \`!termin Zahnarzt morgen um 10:30\`
• \`!termin Geburtstag am 20.03. ganztägig\`

**Termine verwalten:**
• \`!details [Nr]\` - Details zu einem Termin
• \`!löschen [Nr]\` - Termin löschen

**Kalender:**
• \`!kalender\` - Deine Kalender anzeigen

**Sonstiges:**
• \`!status\` - Verbindungsstatus
• \`!help\` oder \`hilfe\` - Diese Hilfe

**Natürliche Sprache:**
Du kannst auch "was steht heute an?", "termine morgen" oder "zeige kalender" schreiben.`;

export const WELCOME_TEXT = `👋 **Willkommen beim Calendar Bot!**

Ich helfe dir, deine Termine zu verwalten. Hier sind die wichtigsten Befehle:

• \`!heute\` - Heutige Termine
• \`!termin Meeting morgen um 14:00\` - Termin erstellen
• \`!woche\` - Wochenübersicht

Schreibe \`!help\` oder einfach "hilfe" für alle Befehle.`;

export const BOT_INTRODUCTION = `📅 **Hallo! Ich bin der Calendar Bot.**

Ich bin jetzt diesem Raum beigetreten und kann dir bei der Terminverwaltung helfen.

**Schnellstart:**
• \`!heute\` - Was steht heute an?
• \`!termin Arzt morgen um 10:00\` - Termin erstellen
• \`!woche\` - Wochenübersicht

Schreibe \`!help\` für alle Befehle!`;
