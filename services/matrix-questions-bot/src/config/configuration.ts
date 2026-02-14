export default () => ({
	port: parseInt(process.env.PORT || '3324', 10),
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',') || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	questions: {
		backendUrl: process.env.QUESTIONS_BACKEND_URL || 'http://localhost:3011',
		apiPrefix: process.env.QUESTIONS_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `<h2>Questions Bot - Befehle</h2>

<h3>Fragen</h3>
<ul>
<li><code>!fragen</code> - Alle Fragen auflisten</li>
<li><code>!fragen offen</code> - Offene Fragen</li>
<li><code>!frage [nr]</code> - Frage-Details anzeigen</li>
<li><code>!neu Frage?</code> - Neue Frage stellen</li>
<li><code>!loeschen [nr]</code> - Frage loeschen</li>
<li><code>!archivieren [nr]</code> - Frage archivieren</li>
</ul>

<h3>Recherche</h3>
<ul>
<li><code>!recherche [nr]</code> - Recherche starten (quick)</li>
<li><code>!recherche [nr] standard</code> - Standard-Recherche</li>
<li><code>!recherche [nr] deep</code> - Tiefe Recherche</li>
<li><code>!ergebnis [nr]</code> - Recherche-Ergebnis anzeigen</li>
<li><code>!quellen [nr]</code> - Quellen anzeigen</li>
</ul>

<h3>Antworten</h3>
<ul>
<li><code>!antwort [nr]</code> - Antwort zur Frage anzeigen</li>
<li><code>!bewerten [nr] 1-5</code> - Antwort bewerten</li>
<li><code>!akzeptieren [nr]</code> - Antwort akzeptieren</li>
</ul>

<h3>Sammlungen</h3>
<ul>
<li><code>!sammlungen</code> - Alle Sammlungen</li>
<li><code>!sammlung [name]</code> - Neue Sammlung erstellen</li>
</ul>

<h3>Suche</h3>
<ul>
<li><code>!suche Begriff</code> - Fragen durchsuchen</li>
</ul>

<h3>Weitere Befehle</h3>
<ul>
<li><code>!help</code> - Diese Hilfe anzeigen</li>
</ul>

<p><em>Tipp: Nutze Nummern aus der zuletzt angezeigten Liste.</em></p>`;
