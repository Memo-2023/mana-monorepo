export default () => ({
	port: parseInt(process.env.PORT || '3317', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	zitare: {
		backendUrl: process.env.ZITARE_BACKEND_URL || 'http://localhost:3007',
		apiPrefix: process.env.ZITARE_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
	stt: {
		url: process.env.STT_URL || 'http://localhost:3020',
	},
});

export const HELP_MESSAGE = `**Zitare Bot - Taegliche Inspiration**

**Zitate:**
- \`!zitat\` - Zufaelliges Zitat
- \`!heute\` - Zitat des Tages
- \`!suche [text]\` - Zitate suchen
- \`!kategorie [name]\` - Zitate nach Kategorie
- \`!kategorien\` - Alle Kategorien

**Favoriten:**
- \`!favorit\` - Letztes Zitat speichern
- \`!favoriten\` - Alle Favoriten anzeigen

**Listen:**
- \`!listen\` - Alle Listen anzeigen
- \`!liste [name]\` - Neue Liste erstellen
- \`!addliste [nr] [zitat-nr]\` - Zitat zur Liste hinzufuegen

**Sonstiges:**
- \`!status\` - Bot-Status
- \`!help\` - Diese Hilfe

**Sprachnotizen:**
Sende eine Sprachnotiz mit Befehlen wie "Zitat", "Motivation" oder einem Suchbegriff.

**Natuerliche Sprache:**
- "zitat", "inspiration" -> Zufaelliges Zitat
- "motiviere mich" -> Motivation-Zitat
- "guten morgen" -> Morgenzitat`;

// Re-export types and utilities from @zitare/content
export type { Quote, Category } from '@zitare/content';
export { CATEGORIES, CATEGORY_LABELS } from '@zitare/content';
