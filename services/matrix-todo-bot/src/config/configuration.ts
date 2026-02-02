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
	stt: {
		url: process.env.STT_URL || 'http://localhost:3020',
	},
});

export const HELP_TEXT = `🎯 **Todo Bot - Hilfe**

**Aufgaben verwalten:**
• \`neu [Aufgabe]\` - Neue Aufgabe hinzufügen
• Sprachnotiz senden - Aufgabe per Sprache erstellen
• \`heute\` - Heutige Aufgaben + Inbox anzeigen
• \`liste\` - Alle offenen Aufgaben
• \`inbox\` - Nur Aufgaben ohne Datum
• \`erledigt [Nr]\` - Aufgabe als erledigt markieren
• \`löschen [Nr]\` - Aufgabe löschen

**Projekte:**
• \`projekte\` - Alle Projekte anzeigen
• \`projekt [Name]\` - Aufgaben eines Projekts anzeigen

**Prioritäten & Datum:**
• \`neu Wichtige Aufgabe !p1\` - Höchste Priorität (1-4)
• \`neu Morgen machen @morgen\` - Datum setzen
• \`neu Heute erledigen @heute\` - Heute fällig

**Sonstiges:**
• \`status\` - Verbindungsstatus prüfen
• \`hilfe\` - Diese Hilfe anzeigen
• \`login email passwort\` - Anmelden für Synchronisation
• \`logout\` - Abmelden

**Tipp:** Alle Befehle funktionieren auch mit \`!\` davor (z.B. \`!neu\`)`;

export const WELCOME_TEXT = `👋 **Willkommen beim Todo Bot!**

Ich helfe dir, deine Aufgaben zu verwalten. Hier sind die wichtigsten Befehle:

• \`neu [Aufgabe]\` - Neue Aufgabe erstellen
• \`heute\` - Heutige Aufgaben + Inbox anzeigen
• \`erledigt [Nr]\` - Aufgabe abhaken

Schreibe einfach "hilfe" für alle Befehle.`;

export const BOT_INTRODUCTION = `🎯 **Hallo! Ich bin der Todo Bot.**

Ich bin jetzt diesem Raum beigetreten und kann dir bei der Aufgabenverwaltung helfen.

**Schnellstart:**
• \`neu Einkaufen gehen\` - Aufgabe erstellen
• \`heute\` - Deine Aufgaben sehen
• \`erledigt 1\` - Erste Aufgabe abhaken

Schreibe "hilfe" für alle Befehle!`;
