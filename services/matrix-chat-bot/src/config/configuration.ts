export default () => ({
	port: parseInt(process.env.PORT || '3327', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',') || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	chat: {
		url: process.env.CHAT_BACKEND_URL || 'http://localhost:3002',
		apiPrefix: process.env.CHAT_API_PREFIX || '',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `**AI Chat Bot - Hilfe**

**Authentifizierung:**
- \`!login email passwort\` - Anmelden
- \`!logout\` - Abmelden
- \`!status\` - Bot-Status anzeigen

**Schnell-Chat:**
- \`!chat [nachricht]\` - Schnelle AI-Antwort (ohne Verlauf)
- \`!fragen [nachricht]\` - Alias fuer !chat

**Gespraeche:**
- \`!neu [titel]\` - Neues Gespraech starten
- \`!gespraeche\` - Alle Gespraeche auflisten
- \`!gespraech [nr]\` - Gespraech auswaehlen/anzeigen
- \`!senden [nachricht]\` - Nachricht im aktuellen Gespraech senden
- \`!verlauf\` - Nachrichtenverlauf anzeigen

**Gespraechsverwaltung:**
- \`!titel [nr] [neuer titel]\` - Titel aendern
- \`!archiv [nr]\` - Gespraech archivieren
- \`!archiviert\` - Archivierte Gespraeche anzeigen
- \`!wiederherstellen [nr]\` - Aus Archiv wiederherstellen
- \`!pin [nr]\` - Gespraech anpinnen
- \`!unpin [nr]\` - Pin entfernen
- \`!loeschen [nr]\` - Gespraech loeschen

**Modelle:**
- \`!modelle\` - Verfuegbare AI-Modelle auflisten
- \`!modell [nr]\` - Modell fuer neues Gespraech waehlen

**Beispiele:**
\`\`\`
!login max@example.com meinpasswort
!chat Was ist die Hauptstadt von Frankreich?
!neu Programmierung
!senden Erklaere mir Python Listen
!gespraeche
!gespraech 1
!verlauf
!modelle
\`\`\`
`;

export const BRANCH_ICONS: Record<string, string> = {
	ollama: '🏠',
	openrouter: '☁️',
	openai: '🤖',
	anthropic: '🧠',
	default: '🔮',
};
