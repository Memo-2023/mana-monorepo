export default () => ({
	port: parseInt(process.env.PORT, 10) || 3323,
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',') || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	storage: {
		backendUrl: process.env.STORAGE_BACKEND_URL || 'http://localhost:3016',
		apiPrefix: process.env.STORAGE_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `<h2>Storage Bot - Befehle</h2>

<h3>Authentifizierung</h3>
<ul>
<li><code>!login email passwort</code> - Anmelden</li>
<li><code>!logout</code> - Abmelden</li>
<li><code>!status</code> - Bot-Status anzeigen</li>
</ul>

<h3>Dateien</h3>
<ul>
<li><code>!dateien</code> - Dateien im Root auflisten</li>
<li><code>!dateien [ordner-nr]</code> - Dateien in Ordner</li>
<li><code>!datei [nr]</code> - Datei-Details anzeigen</li>
<li><code>!download [nr]</code> - Download-Link erhalten</li>
<li><code>!loeschen [nr]</code> - Datei in Papierkorb</li>
<li><code>!umbenennen [nr] neuer name</code> - Datei umbenennen</li>
<li><code>!verschieben [nr] [ordner-nr]</code> - In Ordner verschieben</li>
</ul>

<h3>Ordner</h3>
<ul>
<li><code>!ordner</code> - Ordner im Root auflisten</li>
<li><code>!ordner [nr]</code> - Unterordner anzeigen</li>
<li><code>!neuordner Name</code> - Neuen Ordner erstellen</li>
<li><code>!neuordner Name [in-ordner-nr]</code> - Unterordner erstellen</li>
<li><code>!ordnerloeschen [nr]</code> - Ordner loeschen</li>
</ul>

<h3>Teilen</h3>
<ul>
<li><code>!teilen [nr]</code> - Datei teilen (Link erstellen)</li>
<li><code>!teilen [nr] --tage 7</code> - Mit Ablaufdatum</li>
<li><code>!teilen [nr] --passwort abc</code> - Mit Passwort</li>
<li><code>!links</code> - Alle Share-Links anzeigen</li>
<li><code>!linkloeschen [nr]</code> - Share-Link loeschen</li>
</ul>

<h3>Organisation</h3>
<ul>
<li><code>!suche Begriff</code> - Dateien/Ordner suchen</li>
<li><code>!favoriten</code> - Favoriten anzeigen</li>
<li><code>!fav [nr]</code> - Favorit umschalten</li>
<li><code>!papierkorb</code> - Papierkorb anzeigen</li>
<li><code>!wiederherstellen [nr]</code> - Aus Papierkorb holen</li>
<li><code>!leeren</code> - Papierkorb leeren</li>
</ul>

<h3>Weitere Befehle</h3>
<ul>
<li><code>!help</code> - Diese Hilfe anzeigen</li>
</ul>

<p><em>Tipp: Nutze Nummern aus der zuletzt angezeigten Liste.</em></p>`;
