export default () => ({
	port: parseInt(process.env.PORT || '3325', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',') || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	presi: {
		backendUrl: process.env.PRESI_BACKEND_URL || 'http://localhost:3008',
		apiPrefix: process.env.PRESI_API_PREFIX || '/api',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `<h2>Presi Bot - Befehle</h2>

<h3>Authentifizierung</h3>
<ul>
<li><code>!login email passwort</code> - Anmelden</li>
<li><code>!logout</code> - Abmelden</li>
<li><code>!status</code> - Bot-Status anzeigen</li>
</ul>

<h3>Praesentationen</h3>
<ul>
<li><code>!presis</code> - Alle Praesentationen auflisten</li>
<li><code>!presi [nr]</code> - Praesentation mit Folien anzeigen</li>
<li><code>!neu Titel</code> - Neue Praesentation erstellen</li>
<li><code>!loeschen [nr]</code> - Praesentation loeschen</li>
<li><code>!umbenennen [nr] Neuer Titel</code> - Umbenennen</li>
</ul>

<h3>Folien</h3>
<ul>
<li><code>!folie [nr] titel Titel | Untertitel</code> - Titel-Folie hinzufuegen</li>
<li><code>!folie [nr] text Titel | Inhalt</code> - Text-Folie hinzufuegen</li>
<li><code>!folie [nr] punkte Titel | Punkt1, Punkt2</code> - Aufzaehlungs-Folie</li>
<li><code>!folieloeschen [presi-nr] [folien-nr]</code> - Folie loeschen</li>
</ul>

<h3>Themes</h3>
<ul>
<li><code>!themes</code> - Verfuegbare Themes anzeigen</li>
<li><code>!theme [presi-nr] [theme-nr]</code> - Theme anwenden</li>
</ul>

<h3>Teilen</h3>
<ul>
<li><code>!teilen [nr]</code> - Praesentation teilen</li>
<li><code>!teilen [nr] --tage 7</code> - Mit Ablaufdatum</li>
<li><code>!links [nr]</code> - Share-Links anzeigen</li>
</ul>

<h3>Weitere Befehle</h3>
<ul>
<li><code>!help</code> - Diese Hilfe anzeigen</li>
</ul>

<p><em>Tipp: Nutze Nummern aus der zuletzt angezeigten Liste.</em></p>`;
