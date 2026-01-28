export default () => ({
	port: parseInt(process.env.PORT || '3316', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',').filter(Boolean) || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	nutriphi: {
		backendUrl: process.env.NUTRIPHI_BACKEND_URL || 'http://localhost:3023',
		apiPrefix: process.env.NUTRIPHI_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
		devBypass: process.env.DEV_BYPASS_AUTH === 'true',
		devUserId: process.env.DEV_USER_ID || '',
	},
	stt: {
		url: process.env.STT_URL || 'http://localhost:3020',
	},
});

export const HELP_MESSAGE = `**NutriPhi Bot - KI-Ernahrungsassistent**

**Befehle:**
- \`!help\` - Diese Hilfe anzeigen
- \`!login email passwort\` - Bei NutriPhi anmelden
- \`!analyze [beschreibung]\` - Foto/Text/Sprache analysieren
- \`!today\` / \`heute\` - Tages-Zusammenfassung
- \`!week\` / \`woche\` - Wochen-Statistik
- \`!goals\` / \`ziele\` - Aktuelle Ziele
- \`!setgoals kalorien protein carbs fett\` - Ziele setzen
- \`!favorites\` / \`favoriten\` - Favoriten anzeigen
- \`!tips\` / \`tipps\` - KI-Empfehlungen
- \`!status\` - Bot-Status

**Mahlzeit erfassen:**
- Foto senden + \`!analyze\`
- Sprachnotiz senden (wird automatisch transkribiert & analysiert)
- \`!analyze Spaghetti mit Sauce\` (Textbeschreibung)

**Beispiele:**
- "heute" - Zeigt Tages-Ubersicht
- \`!analyze Apfel und Banane\` - Analysiert Textbeschreibung
- \`!setgoals 2000 80 250 65\` - Setzt Tagesziele`;

export const MEAL_TYPE_LABELS: Record<string, string> = {
	breakfast: 'Fruhstuck',
	lunch: 'Mittagessen',
	dinner: 'Abendessen',
	snack: 'Snack',
};
