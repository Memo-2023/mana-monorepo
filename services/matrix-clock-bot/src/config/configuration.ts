export default () => ({
	port: parseInt(process.env.PORT || '3317', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	clock: {
		apiUrl: process.env.CLOCK_API_URL || 'http://localhost:3017/api/v1',
	},
	stt: {
		url: process.env.STT_URL || 'http://localhost:3020',
	},
});

export const HELP_TEXT = `**Clock Bot - Zeiterfassung per Chat**

**Status:**
- \`!status\` - Account & Timer Status

**Timer (Stoppuhr):**
- \`!timer 25m\` oder \`!timer 1h30m\` - Timer erstellen & starten
- \`!stop\` - Laufenden Timer pausieren
- \`!resume\` - Pausierten Timer fortsetzen
- \`!reset\` - Timer zurucksetzen
- \`!timers\` - Alle Timer anzeigen

**Alarme (Wecker):**
- \`!alarm 07:30\` - Alarm fur 7:30 Uhr setzen
- \`!alarm 07:30 Aufwachen!\` - Alarm mit Label
- \`!alarms\` - Alle Alarme anzeigen
- \`!alarm off 1\` - Alarm #1 deaktivieren
- \`!alarm on 1\` - Alarm #1 aktivieren
- \`!alarm delete 1\` - Alarm #1 loschen

**Weltuhren:**
- \`!zeit\` oder \`!time\` - Aktuelle Zeit + Weltuhren
- \`!weltuhr Berlin\` - Weltuhr hinzufugen
- \`!weltuhren\` - Alle Weltuhren anzeigen

**Sprachnotizen:**
Sende eine Sprachnotiz wie "Timer 25 Minuten" oder "Wecker um 7 Uhr"

**Shortcuts:**
- "start 25 min" - Timer starten
- "stop" - Timer stoppen
- "status" - Status anzeigen`;

export const WELCOME_TEXT = `🕐 **Clock Bot - Zeiterfassung**

**Schnellstart:**
- \`!timer 25m\` - 25-Minuten Timer starten
- \`!alarm 07:30\` - Wecker stellen
- \`!status\` - Status anzeigen

\`!help\` für alle Befehle.`;

// Natural language patterns for time parsing
export const TIME_PATTERNS = {
	// Timer duration patterns
	duration: [
		/(\d+)\s*h(?:ours?|r)?(?:\s*(\d+)\s*m(?:in(?:utes?)?)?)?/i, // 1h, 1h30m, 1 hour 30 minutes
		/(\d+)\s*m(?:in(?:utes?)?)?/i, // 25m, 25 min, 25 minutes
		/(\d+)\s*s(?:ec(?:onds?)?)?/i, // 30s, 30 sec
	],
	// Alarm time patterns
	alarmTime: [
		/(\d{1,2}):(\d{2})(?::(\d{2}))?/, // 07:30, 7:30:00
		/(\d{1,2})\s*uhr(?:\s*(\d{1,2}))?/i, // 7 Uhr, 7 Uhr 30
	],
};
