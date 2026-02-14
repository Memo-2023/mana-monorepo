export default () => ({
	port: parseInt(process.env.PORT || '3024', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	stt: {
		url: process.env.STT_URL || 'http://localhost:3020',
		apiKey: process.env.STT_API_KEY || '',
		defaultLanguage: process.env.DEFAULT_LANGUAGE || 'de',
		defaultModel: process.env.DEFAULT_MODEL || 'whisper',
	},
});

export const HELP_TEXT = `**STT Bot - Hilfe**

Ich wandle deine Sprachnachrichten in Text um!

**Befehle:**
- \`!language [de|en|auto]\` - Sprache aendern
- \`!model [whisper|voxtral]\` - Modell waehlen
- \`!status\` - Aktuelle Einstellungen
- \`!help\` - Diese Hilfe

**Verwendung:**
Sende einfach eine Sprachnachricht und ich schreibe dir den Text zurueck.

**Modelle:**
- \`whisper\` - Whisper Large V3 (lokal, schnell, Standard)
- \`voxtral\` - Voxtral Mini (Cloud, Speaker Diarization)

**Sprachen:**
- \`de\` - Deutsch (Standard)
- \`en\` - English
- \`auto\` - Automatische Erkennung`;

export const WELCOME_TEXT = `**STT Bot**

Ich wandle Sprachnachrichten in Text um!

Sende einfach eine Sprachnachricht oder \`!help\` fuer Hilfe.`;
