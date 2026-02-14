export default () => ({
	port: parseInt(process.env.PORT || '3320', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN || '',
		allowedRooms: (process.env.MATRIX_ALLOWED_ROOMS || '').split(',').filter(Boolean),
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	contacts: {
		backendUrl: process.env.CONTACTS_BACKEND_URL || 'http://localhost:3015',
		apiPrefix: process.env.CONTACTS_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `**Contacts Bot - Kontaktverwaltung**

**Kontakte anzeigen:**
- \`!kontakte\` - Alle Kontakte anzeigen
- \`!suche [text]\` - Kontakte suchen
- \`!favoriten\` - Favoriten anzeigen
- \`!kontakt [nr]\` - Kontakt-Details

**Kontakte verwalten:**
- \`!neu Vorname Nachname\` - Neuen Kontakt erstellen
- \`!edit [nr] [feld] [wert]\` - Kontakt bearbeiten
- \`!loeschen [nr]\` - Kontakt loschen
- \`!fav [nr]\` - Favorit umschalten
- \`!archiv [nr]\` - Archivieren umschalten

**Felder fur !edit:**
- \`email\`, \`phone\`, \`mobile\`
- \`company\`, \`job\`, \`website\`
- \`street\`, \`city\`, \`zip\`, \`country\`
- \`notes\`, \`birthday\`

**Beispiele:**
\`!neu Max Mustermann\`
\`!edit 1 email max@example.com\`
\`!edit 1 phone +49 123 456789\`

**Sonstiges:**
- \`!status\` - Bot-Status
- \`!help\` - Diese Hilfe`;
