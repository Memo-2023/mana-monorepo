export default () => ({
	port: parseInt(process.env.PORT || '3023', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	tts: {
		url: process.env.TTS_URL || 'http://localhost:3022',
		apiKey: process.env.TTS_API_KEY || '',
		defaultVoice: process.env.DEFAULT_VOICE || 'de_thorsten',
		defaultSpeed: parseFloat(process.env.DEFAULT_SPEED || '1.0'),
		maxTextLength: parseInt(process.env.MAX_TEXT_LENGTH || '500', 10),
	},
});

export const HELP_TEXT = `**TTS Bot - Hilfe**

Ich wandle deine Textnachrichten in Sprache um!

**Befehle:**
- \`!voice [name]\` - Stimme wechseln (z.B. \`!voice de_thorsten\`)
- \`!voices\` - Alle verfügbaren Stimmen anzeigen
- \`!speed [0.5-2.0]\` - Geschwindigkeit ändern
- \`!status\` - Aktuelle Einstellungen
- \`!help\` - Diese Hilfe

**Verwendung:**
Schreibe einfach eine Nachricht und ich sende dir die Sprachausgabe zurück.
Die Sprache wird automatisch erkannt (Deutsch/Englisch).

**Deutsche Stimmen:**
- \`de_thorsten\` - Deutsch männlich (lokal)
- \`de_katja\` - Deutsch weiblich
- \`de_conrad\` - Deutsch männlich
- \`de_florian\` - Deutsch männlich jung

**Englische Stimmen:**
- \`af_heart\` - Amerikanisch weiblich (warm)
- \`bm_daniel\` - Britisch männlich
- \`am_michael\` - Amerikanisch männlich`;

export const WELCOME_TEXT = `**TTS Bot**

Ich wandle Textnachrichten in Sprache um!

Schreibe einfach eine Nachricht oder \`!help\` fur Hilfe.`;
