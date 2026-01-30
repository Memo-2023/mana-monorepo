export default () => ({
	port: parseInt(process.env.PORT || '3322', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',') || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	planta: {
		backendUrl: process.env.PLANTA_BACKEND_URL || 'http://localhost:3022',
		apiPrefix: process.env.PLANTA_API_PREFIX || '/api',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `<h2>Planta Bot - Befehle</h2>

<h3>Authentifizierung</h3>
<ul>
<li><code>!login email passwort</code> - Anmelden</li>
<li><code>!logout</code> - Abmelden</li>
<li><code>!status</code> - Bot-Status anzeigen</li>
</ul>

<h3>Pflanzen verwalten</h3>
<ul>
<li><code>!pflanzen</code> - Alle Pflanzen auflisten</li>
<li><code>!pflanze [nr]</code> - Pflanzendetails anzeigen</li>
<li><code>!neu Name</code> - Neue Pflanze hinzufuegen</li>
<li><code>!loeschen [nr]</code> - Pflanze entfernen</li>
<li><code>!edit [nr] [feld] [wert]</code> - Pflanze bearbeiten</li>
</ul>

<h3>Giessen</h3>
<ul>
<li><code>!giessen [nr]</code> - Pflanze als gegossen markieren</li>
<li><code>!giessen [nr] Notiz</code> - Mit Notiz giessen</li>
<li><code>!faellig</code> - Pflanzen die gegossen werden muessen</li>
<li><code>!historie [nr]</code> - Giess-Historie anzeigen</li>
</ul>

<h3>Pflege-Einstellungen</h3>
<ul>
<li><code>!intervall [nr] [tage]</code> - Giess-Intervall aendern</li>
</ul>

<h3>Weitere Befehle</h3>
<ul>
<li><code>!help</code> - Diese Hilfe anzeigen</li>
</ul>

<h3>Bearbeitbare Felder</h3>
<p><code>name</code>, <code>art</code> (scientificName), <code>licht</code> (low/medium/bright/direct), <code>wasser</code> (Tage), <code>notizen</code></p>

<p><em>Tipp: Nutze Pflanzennummern aus der zuletzt angezeigten Liste.</em></p>`;
