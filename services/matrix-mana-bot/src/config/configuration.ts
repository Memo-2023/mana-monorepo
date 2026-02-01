export default () => ({
	port: parseInt(process.env.PORT, 10) || 3310,
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/mana-bot-storage.json',
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS
			? process.env.MATRIX_ALLOWED_ROOMS.split(',').map((r) => r.trim())
			: [],
	},
	services: {
		ai: {
			baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
			defaultModel: process.env.OLLAMA_MODEL || 'gemma3:4b',
			timeout: parseInt(process.env.OLLAMA_TIMEOUT, 10) || 120000,
		},
		clock: {
			apiUrl: process.env.CLOCK_API_URL || 'http://localhost:3017/api/v1',
		},
		todo: {
			storagePath: process.env.TODO_STORAGE_PATH || './data/todos.json',
		},
		calendar: {
			storagePath: process.env.CALENDAR_STORAGE_PATH || './data/calendar.json',
		},
	},
	voice: {
		sttUrl: process.env.STT_URL || 'http://localhost:3020',
		voiceBotUrl: process.env.VOICE_BOT_URL || 'http://localhost:3050',
		defaultVoice: process.env.DEFAULT_VOICE || 'de-DE-ConradNeural',
		defaultSpeed: parseFloat(process.env.DEFAULT_SPEED) || 1.0,
		enabled: process.env.VOICE_ENABLED !== 'false',
		preferencesPath: process.env.VOICE_PREFERENCES_PATH || './data/voice-preferences.json',
	},
});

// Help text for the unified bot
export const HELP_TEXT = `**🤖 Mana - Dein Assistent**

**👤 Account**
• \`!login email passwort\` - Anmelden
• \`!logout\` - Abmelden
• \`!status\` - Account & Bot Status

**AI & Chat**
Schreib einfach eine Nachricht - ich antworte!
• \`!model [name]\` - KI-Modell wechseln
• \`!models\` - Verfügbare Modelle anzeigen
• \`!all [frage]\` - Alle Modelle vergleichen

**📋 Todos**
• \`!todo [text]\` - Neue Aufgabe erstellen
• \`!list\` - Alle offenen Aufgaben
• \`!today\` - Heutige Aufgaben
• \`!done [nr]\` - Aufgabe erledigen
• \`!delete [nr]\` - Aufgabe löschen

**📅 Kalender**
• \`!cal\` - Heutige Termine
• \`!week\` - Wochenübersicht
• \`!event [titel] [zeit]\` - Termin erstellen

**⏱️ Zeit & Timer**
• \`!timer [dauer]\` - Timer starten (z.B. 25m)
• \`!alarm [zeit]\` - Alarm setzen (z.B. 14:30)
• \`!time [stadt]\` - Weltuhr
• \`!timers\` - Aktive Timer anzeigen

**🔮 Smart Features**
• \`!summary\` - Tages-Zusammenfassung (AI)
• \`!ai-todo [text]\` - AI extrahiert Todos aus Text

**🎤 Sprache & Voice**
Sende eine Sprachnachricht - ich verstehe dich!
• Natürliche Befehle: "Was steht heute an?"
• \`!voice\` - Voice-Einstellungen anzeigen
• \`!voice an/aus\` - Sprachantworten aktivieren
• \`!stimmen\` - Verfügbare Stimmen
• \`!stimme [name]\` - Stimme wählen
• \`!speed [0.5-2.0]\` - Geschwindigkeit ändern

**💡 Tipps**
• Natürliche Sprache funktioniert: "Was sind meine Todos?"
• Prioritäten: \`!todo Wichtig !p1\`
• Datum: \`!todo Meeting @morgen\`
• Projekt: \`!todo Task #projekt\`

---
*100% DSGVO-konform - alle Daten lokal*`;

export const WELCOME_TEXT = `👋 **Willkommen bei Mana!**

Ich bin dein persönlicher Assistent mit vielen Funktionen:
• 🤖 AI Chat (lokales LLM)
• 📋 Todo-Verwaltung
• 📅 Kalender
• ⏱️ Timer & Alarme
• 🎤 Spracherkennung

Schreib einfach eine Nachricht, sende eine Sprachnachricht, oder sag "hilfe" für alle Befehle!`;

export const BOT_INTRODUCTION = `🤖 **Hallo! Ich bin Mana, euer All-in-One Assistent.**

Ich vereinige alle Bot-Funktionen in einem:
• AI Chat & Fragen beantworten
• Aufgaben verwalten
• Termine planen
• Timer & Alarme

Alle Daten bleiben auf diesem Server - 100% DSGVO-konform!

Sag einfach "hilfe" oder \`!help\` für alle Befehle.`;
