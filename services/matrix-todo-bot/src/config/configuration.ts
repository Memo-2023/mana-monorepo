export default () => ({
	port: parseInt(process.env.PORT || '3314', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	todo: {
		apiUrl: process.env.TODO_API_URL || 'http://localhost:3010/api/v1',
		serviceKey: process.env.TODO_SERVICE_KEY || '',
	},
});

export const HELP_TEXT = `🎯 **Todo Bot - Hilfe**

**Aufgaben verwalten:**
• \`!add [Aufgabe]\` - Neue Aufgabe hinzufügen
• \`!list\` oder \`!heute\` - Heutige Aufgaben anzeigen
• \`!inbox\` - Aufgaben ohne Datum anzeigen
• \`!done [Nr]\` - Aufgabe als erledigt markieren
• \`!delete [Nr]\` - Aufgabe löschen

**Projekte:**
• \`!projects\` - Alle Projekte anzeigen
• \`!project [Name]\` - Aufgaben eines Projekts anzeigen

**Prioritäten:**
• \`!add Wichtige Aufgabe !p1\` - Höchste Priorität (1-4)
• \`!add Morgen machen @morgen\` - Datum setzen

**Sonstiges:**
• \`!status\` - Verbindungsstatus prüfen
• \`!help\` oder \`hilfe\` - Diese Hilfe anzeigen

**Natürliche Sprache:**
Du kannst auch einfach "hilfe", "zeige aufgaben", "was muss ich heute machen?" schreiben.`;

export const WELCOME_TEXT = `👋 **Willkommen beim Todo Bot!**

Ich helfe dir, deine Aufgaben zu verwalten. Hier sind die wichtigsten Befehle:

• \`!add [Aufgabe]\` - Neue Aufgabe erstellen
• \`!list\` - Heutige Aufgaben anzeigen
• \`!done [Nr]\` - Aufgabe abhaken

Schreibe \`!help\` oder einfach "hilfe" für alle Befehle.`;

export const BOT_INTRODUCTION = `🎯 **Hallo! Ich bin der Todo Bot.**

Ich bin jetzt diesem Raum beigetreten und kann dir bei der Aufgabenverwaltung helfen.

**Schnellstart:**
• \`!add Einkaufen gehen\` - Aufgabe erstellen
• \`!list\` - Deine Aufgaben sehen
• \`!done 1\` - Erste Aufgabe abhaken

Schreibe \`!help\` für alle Befehle!`;
