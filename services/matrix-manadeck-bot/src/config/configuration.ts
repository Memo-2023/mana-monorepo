export default () => ({
	port: parseInt(process.env.PORT, 10) || 3321,
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',') || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	manadeck: {
		backendUrl: process.env.MANADECK_BACKEND_URL || 'http://localhost:3009',
		apiPrefix: process.env.MANADECK_API_PREFIX || '/api',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `<h2>ManaDeck Bot - Befehle</h2>

<h3>Authentifizierung</h3>
<ul>
<li><code>!login email passwort</code> - Anmelden</li>
<li><code>!logout</code> - Abmelden</li>
<li><code>!status</code> - Bot-Status anzeigen</li>
</ul>

<h3>Decks verwalten</h3>
<ul>
<li><code>!decks</code> - Alle Decks auflisten</li>
<li><code>!deck [nr]</code> - Deck-Details anzeigen</li>
<li><code>!neu Titel</code> - Neues Deck erstellen (10 Mana)</li>
<li><code>!loeschen [nr]</code> - Deck loeschen</li>
</ul>

<h3>Karten</h3>
<ul>
<li><code>!karten [nr]</code> - Karten eines Decks anzeigen</li>
<li><code>!karte [deck-nr] [karten-nr]</code> - Kartendetails</li>
</ul>

<h3>AI-Generierung</h3>
<ul>
<li><code>!generate Thema</code> - Deck mit AI generieren (30 Mana)</li>
<li><code>!generate Thema --count 10</code> - Mit Kartenanzahl</li>
<li><code>!generate Thema --type flashcard</code> - Mit Kartentyp</li>
</ul>

<h3>Lernen</h3>
<ul>
<li><code>!lernen [nr]</code> - Lernsession starten</li>
<li><code>!faellig</code> - Faellige Karten anzeigen</li>
<li><code>!stats</code> - Lernstatistiken</li>
</ul>

<h3>Weiteres</h3>
<ul>
<li><code>!mana</code> - Mana-Guthaben anzeigen</li>
<li><code>!featured</code> - Empfohlene Decks</li>
<li><code>!leaderboard</code> - Rangliste</li>
<li><code>!help</code> - Diese Hilfe anzeigen</li>
</ul>

<p><em>Tipp: Nutze Deck-/Kartennummern aus der zuletzt angezeigten Liste.</em></p>`;
