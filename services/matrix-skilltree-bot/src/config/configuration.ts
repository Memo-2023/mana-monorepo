export default () => ({
	port: parseInt(process.env.PORT, 10) || 3326,
	matrix: {
		homeserverUrl: process.env.MATRIX_HOMESERVER_URL || 'http://localhost:8008',
		accessToken: process.env.MATRIX_ACCESS_TOKEN,
		allowedRooms: process.env.MATRIX_ALLOWED_ROOMS?.split(',') || [],
		storagePath: process.env.MATRIX_STORAGE_PATH || './data/bot-storage.json',
	},
	skilltree: {
		backendUrl: process.env.SKILLTREE_BACKEND_URL || 'http://localhost:3024',
		apiPrefix: process.env.SKILLTREE_API_PREFIX || '/api/v1',
	},
	auth: {
		url: process.env.MANA_CORE_AUTH_URL || 'http://localhost:3001',
	},
});

export const HELP_MESSAGE = `<h2>Skilltree Bot - Befehle</h2>

<h3>Authentifizierung</h3>
<ul>
<li><code>!login email passwort</code> - Anmelden</li>
<li><code>!logout</code> - Abmelden</li>
<li><code>!status</code> - Bot-Status anzeigen</li>
</ul>

<h3>Skills</h3>
<ul>
<li><code>!skills</code> - Alle Skills auflisten</li>
<li><code>!skills koerper</code> - Nach Branch filtern</li>
<li><code>!skill [nr]</code> - Skill-Details anzeigen</li>
<li><code>!neu Name | Branch</code> - Neuen Skill erstellen</li>
<li><code>!loeschen [nr]</code> - Skill loeschen</li>
</ul>

<h3>XP sammeln</h3>
<ul>
<li><code>!xp [nr] 50 Aktivitaet</code> - XP hinzufuegen</li>
<li><code>!xp [nr] 100 Training --min 60</code> - Mit Dauer</li>
</ul>

<h3>Statistiken</h3>
<ul>
<li><code>!stats</code> - Gesamtstatistik anzeigen</li>
<li><code>!aktivitaeten</code> - Letzte Aktivitaeten</li>
<li><code>!aktivitaeten [nr]</code> - Aktivitaeten fuer Skill</li>
</ul>

<h3>Branches</h3>
<p><code>intellect</code> (Wissen), <code>body</code>/<code>koerper</code> (Fitness), <code>creativity</code>/<code>kreativ</code> (Kunst), <code>social</code>/<code>sozial</code> (Kommunikation), <code>practical</code>/<code>praktisch</code> (Handwerk), <code>mindset</code> (Achtsamkeit), <code>custom</code> (Eigene)</p>

<h3>Level-System</h3>
<ul>
<li>Level 1: 100 XP (Anfaenger)</li>
<li>Level 2: 500 XP (Fortgeschritten)</li>
<li>Level 3: 1500 XP (Kompetent)</li>
<li>Level 4: 4000 XP (Experte)</li>
<li>Level 5: 10000 XP (Meister)</li>
</ul>

<p><em>Tipp: Nutze Nummern aus der zuletzt angezeigten Liste.</em></p>`;
