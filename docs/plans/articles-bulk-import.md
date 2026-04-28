# Articles — Bulk URL Import

## Status (2026-04-28)

**Phase 0 — Plan:** in progress.
**Phasen 1–7:** offen.

## Ziel

User wirft eine Liste von URLs in ein Textfeld (zeilengetrennt), Mana
extrahiert + speichert alle Artikel im Hintergrund. Funktioniert auch wenn
der Tab schließt, das Gerät wechselt, das Netz kurz weg ist. Der Job
überlebt Sessions und ist auf jedem Gerät sichtbar an dem der User
eingeloggt ist.

Heute existiert nur Single-URL-Ingestion (`AddUrlForm`, `QuickAddInput`,
Bookmarklets v1+v2, Share-Target). Alle Pfade rufen am Ende
`articlesStore.saveFromUrl()` oder `saveFromExtracted()` auf.

## Leitsätze

1. **Job-State lebt in der synchronisierten DB**, nicht im Tab. Damit
   fallen Tab-Close-Resilienz, Multi-Device-Sicht, Resume-after-Offline
   und Audit automatisch ab.
2. **Server macht Extract, Client macht Encrypt.** Das ehrt das At-Rest-
   Modell — der Master-Key bleibt clientseitig, der Server sieht den
   extrahierten Text nur kurz in einer Pickup-Inbox (gleicher Threat-
   Model wie heute schon der `/extract`-Endpoint).
3. **Eine Code-Bahn für jede Ingestion.** Single-URL und Bulk laufen
   nach Phase 7 durch denselben Worker — der QuickAdd-Pfad legt unter
   der Haube auch einen 1-URL-Job an.
4. **Soft → Hard.** Schema- und Semantik-Migrationen kommen in zwei
   Commits: erst tolerant zu alten Rows, dann hartes Cleanup.

## Architektur

```
            ┌──────────────────────────────────────────┐
            │  /articles/import (List + JobDetail)     │
            │  pure liveQuery-View, UI macht keine     │
            │  Job-Logik selbst                        │
            └─────────────────┬────────────────────────┘
                              │ liveQuery
                              ▼
  ┌────────────────────────────────────────────────────────┐
  │  Dexie + mana-sync  (articles appId)                   │
  │                                                        │
  │   articleImportJobs                                    │
  │     id, spaceId, totalUrls, status, leasedBy,          │
  │     leasedUntil, savedCount, duplicateCount,           │
  │     errorCount, warningCount, finishedAt               │
  │                                                        │
  │   articleImportItems                                   │
  │     id, jobId, spaceId, idx, url, state, articleId,    │
  │     warning, error, attempts, lastAttemptAt            │
  │                                                        │
  │   articleExtractPickup  (kurzlebige Inbox)             │
  │     id, itemId, payload (extracted), createdAt         │
  └─────────────────┬───────────────────────┬──────────────┘
                    │ pending items         │ pickup rows
                    ▼                       ▼
  ┌─────────────────────────────┐  ┌──────────────────────────┐
  │  apps/api  Extract-Worker   │  │  Client  Pickup-Consumer │
  │   • snapshot der Items      │  │   • liveQuery auf Pickup │
  │   • Lease + Heartbeat       │  │   • encryptRecord        │
  │   • Concurrency 3 / User    │  │   • articleTable.add()   │
  │   • shared-rss extractFromUrl│ │   • item.state='saved'   │
  │   • schreibt Pickup-Row     │  │   • pickup.delete()      │
  │   • setzt Item-State        │  │                          │
  └─────────────────────────────┘  └──────────────────────────┘
```

## Datenmodell

### `articleImportJobs` (synced, articles appId)

```ts
interface LocalArticleImportJob extends BaseRecord {
  totalUrls: number;
  status: 'queued' | 'running' | 'paused' | 'done' | 'cancelled';

  /** Worker-Lease — verhindert dass mehrere Worker denselben Job ziehen.
   *  Server-Worker stempelt seine workerId beim Claim, erneuert die
   *  leasedUntil per Heartbeat. Lease-Ablauf > 60s = Job ist verfügbar. */
  leasedBy: string | null;
  leasedUntil: string | null;

  startedAt: string | null;
  finishedAt: string | null;

  /** Counters werden vom Server beim Item-Übergang in einen Terminal-State
   *  inkrementiert. Pure Bookkeeping — Truth liegt in den Item-Rows, das
   *  hier ist die Cache-Spalte für die Liste. */
  savedCount: number;
  duplicateCount: number;
  errorCount: number;
  warningCount: number;
}
```

### `articleImportItems` (synced, articles appId)

```ts
type ImportItemState =
  | 'pending'        // wartet auf den Worker
  | 'extracting'     // Worker hat geclaimed
  | 'extracted'      // Pickup-Row liegt für den Client bereit
  | 'saved'          // im Article-Table angekommen
  | 'duplicate'      // Article mit dieser URL gabs schon
  | 'consent-wall'   // gespeichert, aber Cookie-Wand erkannt
  | 'error'          // X Versuche fehlgeschlagen
  | 'cancelled';     // Job abgebrochen vor Verarbeitung

interface LocalArticleImportItem extends BaseRecord {
  jobId: string;
  idx: number;                 // Reihenfolge aus der User-Eingabe
  url: string;                 // PLAINTEXT — Server muss lesen können
  state: ImportItemState;
  articleId: string | null;    // bei saved/duplicate gesetzt
  warning: 'probable_consent_wall' | null;
  error: string | null;
  attempts: number;
  lastAttemptAt: string | null;
}
```

**`url` bleibt bewusst plaintext** — der Server-Worker liest sie aus
`sync_changes` und kann nicht entschlüsseln. Gleiche Begründung wie bei
`articles.originalUrl` / `newsArticles.originalUrl` / `links.originalUrl`.

`error` bleibt plaintext, weil Fehlertexte technisch sind ("502 Bad
Gateway") und keinen User-Inhalt enthalten.

### `articleExtractPickup` (synced, articles appId, kurzlebig)

```ts
interface LocalArticleExtractPickup extends BaseRecord {
  itemId: string;              // Pointer zum Item — auch dessen jobId
  payload: ExtractedArticle;   // PLAINTEXT — Server hat das eh
  createdAt: string;
}
```

Inbox-Tabelle. Server schreibt rein, Client liest und löscht. Im
Steady-State leer. TTL serverseitig: 24 h, dann GC.

**Warum eine eigene Tabelle statt direkt `articles` schreiben?** Der
Server hat keinen Master-Key — er kann den Article nicht verschlüsseln.
Pickup ist die Übergabe-Pufferzone, der Client holt sie ab und ruft die
existierende `saveFromExtracted()` auf, die `encryptRecord()` triggert.

### Crypto-Registry

```ts
// articleImportJobs: keine User-typed Inhalte → plaintext-allowlist
// articleImportItems: url + error sind plaintext, sonst nichts schützenswert → plaintext-allowlist
// articleExtractPickup: payload wird gleich nach Apply gelöscht → plaintext-allowlist
```

Alle drei landen auf der `plaintext-allowlist.ts`, nicht in
`ENCRYPTION_REGISTRY`. Items und Job-Rows enthalten keine User-typed-
Felder die nicht eh schon plaintext bleiben müssten (URL fürs Routing,
Counters, Foreign Keys). Der eigentliche Article-Inhalt wandert wie
bisher verschlüsselt in `articles`.

### Module-Config + Sync

`modules/articles/module.config.ts` bekommt drei neue Tabellen:

```ts
tables: [
  { name: 'articles' },
  { name: 'articleHighlights', syncName: 'highlights' },
  { name: 'articleTags' },
  { name: 'articleImportJobs', syncName: 'importJobs' },
  { name: 'articleImportItems', syncName: 'importItems' },
  { name: 'articleExtractPickup', syncName: 'extractPickup' },
]
```

Damit gehen sie automatisch durch den Standard-Sync-Pfad, RLS,
field-level LWW. Keine neue Sync-Infrastruktur.

## Server-Worker

### Wo

**`apps/api/src/modules/articles/import-worker.ts`**, gestartet aus
`apps/api/src/index.ts` neben den Routes. Nicht in `services/mana-ai`
(falscher Scope) und nicht in `services/mana-research` (Provider-
Orchestrierung, kein Persistenz-Worker).

### Konzept

Standard-Pattern aus `services/mana-ai`:

1. **Snapshot-Projektion** — eine kleine Tabelle in `mana_platform.articles_imports`-Schema
   die `sync_changes` für `appId='articles'` und `tableName ∈ {articleImportJobs, articleImportItems}`
   zu Live-Records faltet (field-level LWW). Refreshed sich pro Tick.
2. **Tick alle 2 s.** Liest die Snapshot, sucht:
   - Jobs mit `status='running'` und (`leasedBy=null` OR `leasedUntil < now`)
   - dazu Items mit `state='pending'` für diese Jobs
3. **Lease** — `leasedBy` auf eigene `workerId` setzen, `leasedUntil = now + 60s`. Schreiben als
   `sync_changes`-Row mit `actor=system`, `origin=system`, `source='articles-import-worker'`.
4. **Concurrency 3 pro Job** — pro Tick max 3 Items in `state='extracting'` schalten,
   `extractFromUrl()` aus `@mana/shared-rss` aufrufen.
5. **Pickup-Write** — bei Erfolg: `articleExtractPickup`-Row schreiben +
   Item-State auf `extracted`. Bei Fehler: `attempts += 1`, wenn `attempts >= 3`
   → `state='error'`, sonst zurück auf `pending`.
6. **Job-Completion** — wenn alle Items eines Jobs in einem Terminal-State sind
   (`saved | duplicate | consent-wall | error | cancelled`), setze
   `job.status='done'` + `finishedAt`. Counter-Spalten gleich mit aktualisieren.
7. **Heartbeat** — solange Items `extracting`, alle 30 s `leasedUntil` erneuern.

### Single-Instance-Garantie

`pg_advisory_lock(<key>)` über die Worker-Loop. Falls apps/api in mehreren
Instanzen läuft, nimmt nur eine den Lock und tickt. Andere idlen.

### Counters: woher

Worker tracked Item-Übergänge und stempelt:
- `pending → extracted`: keine Counter-Änderung
- `extracted → saved` (Client signalisiert): `savedCount += 1`
- `extracted → duplicate` (Client signalisiert): `duplicateCount += 1`
- `extracted → consent-wall` (Client signalisiert): `warningCount += 1`
- jeder Übergang → `error`: `errorCount += 1`

Counter-Updates gehen als normale `articleImportJobs.update` durch
`sync_changes`, RLS-correct.

### Server-side Cleanup

Stündlicher GC-Job:
- Pickup-Rows älter 24 h löschen (Sicherheits-Cap)
- Jobs mit `status='done' AND finishedAt < now - 30d` archivieren
  (späteres Polish — erst mal nur Cap)

## Client-Pickup-Consumer

`apps/mana/apps/web/src/lib/modules/articles/consume-pickup.ts`,
gestartet aus `data-layer-listeners.ts` zusammen mit den anderen
Listener-Wirings.

Logik:

```ts
liveQuery(() => articleExtractPickup
  .filter(r => !r.deletedAt)
  .toArray()
).subscribe(rows => {
  for (const row of rows) {
    void consumeOne(row);
  }
});

async function consumeOne(row: LocalArticleExtractPickup) {
  // Re-entrancy guard via in-memory Set so multiple liveQuery ticks
  // don't race the same row.
  if (inFlight.has(row.id)) return;
  inFlight.add(row.id);
  try {
    const item = await articleImportItemTable.get(row.itemId);
    if (!item || item.state !== 'extracted') {
      await articleExtractPickupTable.delete(row.id);  // Stale row
      return;
    }
    // Dedupe-Check für den Fall dass der User die URL parallel
    // single-saved hat während der Job lief.
    const existing = await articlesStore.findByUrl(row.payload.originalUrl);
    if (existing) {
      await articleImportItemTable.update(item.id, {
        state: 'duplicate',
        articleId: existing.id,
      });
      await articleExtractPickupTable.delete(row.id);
      return;
    }
    const article = await articlesStore.saveFromExtracted(row.payload);
    const nextState: ImportItemState =
      row.payload.warning === 'probable_consent_wall'
        ? 'consent-wall'
        : 'saved';
    await articleImportItemTable.update(item.id, {
      state: nextState,
      articleId: article.id,
      warning: row.payload.warning ?? null,
    });
    await articleExtractPickupTable.delete(row.id);
  } finally {
    inFlight.delete(row.id);
  }
}
```

Multi-Tab: alle Tabs sehen Pickup-Rows. Web-Lock `mana:articles:pickup`
sorgt dafür dass nur ein Tab gleichzeitig konsumiert. Andere Tabs sehen
die liveQuery, der Lock-halter pickt ab.

## Store-API

`modules/articles/stores/imports.svelte.ts` — neue Datei.

```ts
export const articleImportsStore = {
  /** Erzeugt Job + N Items in einem Dexie bulkAdd, returns jobId. */
  async createJob(urls: string[]): Promise<string> { … },

  async pauseJob(jobId: string): Promise<void> { … },
  async resumeJob(jobId: string): Promise<void> { … },
  async cancelJob(jobId: string): Promise<void> { … },

  /** Setzt alle Error-Items eines Jobs zurück auf pending. */
  async retryFailed(jobId: string): Promise<void> { … },

  /** Soft-Delete des Jobs + aller Items. Article-Rows bleiben. */
  async deleteJob(jobId: string): Promise<void> { … },
};
```

`saveFromExtracted` in `modules/articles/stores/articles.svelte.ts`
bleibt der gemeinsame Kern — der Pickup-Consumer ruft sie genauso auf wie
der existierende Single-URL-Pfad.

URL-Parser steht im Store, nicht im Component:

```ts
export function parseUrls(raw: string): {
  valid: string[];
  invalid: string[];
  duplicates: string[];
} { … }
```

Pure Funktion, unit-testbar.

## UI

### `/articles/import` — Index + Eingabe (`+page.svelte`)

- `<BulkImportForm>` Komponente mit `<textarea>`, Live-Validierung als
  `$derived` über `parseUrls()`.
- Counter „X gültig · Y ungültig · Z Duplikate" über dem Submit-Button.
- Submit → `articleImportsStore.createJob(urls)` → goto `/articles/import/[jobId]`.
- Unter dem Form: `<JobsList>` mit aktiven + abgeschlossenen Jobs der
  letzten 30 Tage. Each row: Status-Pill, Counter, Click → Detail.

### `/articles/import/[jobId]` — JobDetailView

- Header: Job-Status, Fortschrittsbalken, Counter („3 / 12 — 1 Duplikat,
  1 Warnung").
- Action-Bar: Pause / Fortsetzen / Abbrechen / „Fehler erneut versuchen"
  (nur wenn `errorCount > 0`).
- Liste der Items (virtuelle Scroll für > 100 Einträge): URL +
  State-Pill + Title (sobald gespeichert) + Action-Link
  (Öffnen / Erneut versuchen / Fehler-Detail-Tooltip).

### Verlinkung

- `AddUrlForm` (`/articles/add`) bekommt unter dem Input einen kleinen
  Link „Mehrere URLs auf einmal? → Bulk-Import".
- Wenn der User in `AddUrlForm` einen Mehrzeiler einfügt, schlägt der
  Form vor: „4 URLs erkannt — als Bulk importieren?" → routet auf
  `/articles/import` mit pre-fill via `sessionStorage`.
- `/articles/settings` bekommt eine vierte Karte „Mehrere URLs
  importieren" mit Link auf `/articles/import`.

## Domain-Events

Zwei neue Events in `data/events`:

```ts
type ArticleImportStarted = {
  type: 'ArticleImportStarted';
  appId: 'articles';
  collection: 'articleImportJobs';
  recordId: string;
  payload: { totalUrls: number };
};
type ArticleImportFinished = {
  type: 'ArticleImportFinished';
  appId: 'articles';
  collection: 'articleImportJobs';
  recordId: string;
  payload: {
    totalUrls: number;
    savedCount: number;
    duplicateCount: number;
    errorCount: number;
    warningCount: number;
  };
};
```

Activity-Modul + Recap-Aggregator picken sie automatisch auf
(über das bestehende Event-Bus-Pattern).

## AI-Tool

Neuer Eintrag im `AI_TOOL_CATALOG` (`packages/shared-ai/src/tools/schemas.ts`):

```ts
{
  name: 'import_articles_from_urls',
  module: 'articles',
  policy: 'auto',           // Deterministisch, kein per-Article-Approval
  schema: z.object({
    urls: z.array(z.string().url()).min(1).max(50),
  }),
  describe: 'Ein Bulk-Import-Job für Artikel-URLs. Returns jobId zum Tracken.',
}
```

`modules/articles/tools.ts` registriert die `execute`-Function: ruft
`articleImportsStore.createJob(urls)` auf, returns `{ jobId, totalUrls }`.

`save_article` (single-URL, propose) bleibt für „bitte speichere DIESEN
Artikel" Befehle. `import_articles_from_urls` ist für Listen.

## Phasen

### Phase 1 — Datenmodell *(soft)*

1. Dexie-Version v56 (next free): `articleImportJobs`, `articleImportItems`,
   `articleExtractPickup` declaren mit Indexen:
   - `articleImportJobs: 'id, status, [spaceId+status], createdAt'`
   - `articleImportItems: 'id, jobId, [jobId+state], idx, state'`
   - `articleExtractPickup: 'id, itemId, createdAt'`
2. Types in `modules/articles/types.ts` ergänzen.
3. `module.config.ts` um die drei Tabellen erweitern.
4. `collections.ts` um Table-Refs erweitern.
5. Plaintext-Allowlist-Eintrag für alle drei Tabellen.
6. **Smoke**: `pnpm check:crypto` + `pnpm validate:all` grün.

Acceptance: Schema lädt, kein neuer Daten-Pfad aktiv. Bestehender
Single-URL-Pfad läuft weiter.

### Phase 2 — Server-Worker

1. `apps/api/src/modules/articles/import-worker.ts` mit:
   - Snapshot-Projektion (Mirror von `mana-ai/db/missions-projection.ts`)
   - Tick-Loop, advisory-lock, Lease/Heartbeat
   - `extractFromUrl()` Aufruf, Pickup-Write, State-Transitions
2. Migration `apps/api/drizzle/articles/<n>-imports-snapshot.sql`:
   - Schema `articles_imports`
   - Snapshot-Tabellen für jobs + items
   - GC-Cron-Definition
3. Boot in `apps/api/src/index.ts`:
   `import { startArticleImportWorker } from './modules/articles/import-worker';`
   `startArticleImportWorker();`

Acceptance: Manuelles Insert eines Job + Items via SQL → Worker
extracted → Pickup-Row erscheint → Item-State `extracted`.

### Phase 3 — Client-Pickup-Consumer

1. `modules/articles/consume-pickup.ts` (s.o.).
2. `data/data-layer-listeners.ts` registriert den Consumer beim Boot.
3. Web-Lock `mana:articles:pickup` für Multi-Tab-Koordination.
4. Re-entrancy-Guard via in-memory Set.

Acceptance: Pickup-Row aus Phase 2 wird konsumiert, Article landet
verschlüsselt in `articles`, Item geht auf `saved`, Pickup-Row gelöscht.

### Phase 4 — Store-API

1. `modules/articles/stores/imports.svelte.ts` mit allen Methoden.
2. `parseUrls` als pure Funktion + Unit-Tests.
3. `saveFromExtracted` bleibt unverändert — wird re-used.

Acceptance: `articleImportsStore.createJob(['url1', 'url2'])` erzeugt
Job + 2 Items, Worker zieht sie, beide landen in `articles`.

### Phase 5 — UI

1. `/articles/import/+page.svelte` mit Form + JobsList.
2. `/articles/import/[jobId]/+page.svelte` mit JobDetailView.
3. `BulkImportForm.svelte`, `JobsList.svelte`, `JobDetailView.svelte`,
   `ImportItemRow.svelte` (alles in `modules/articles/components/`).
4. Verlinkung in `AddUrlForm`, `/articles/settings`.
5. Smart-Detect-Hint in `AddUrlForm` für Mehrzeiler-Paste.
6. i18n-Keys in `de.json` + `en.json` (fr/it/es konsistent mit anderen
   Articles-Strings).

Acceptance: User pasted 5 URLs in `<textarea>`, klickt „Importieren",
sieht Detail-View mit Live-Updates, kann Pause/Fortsetzen drücken.

### Phase 6 — Domain-Events + AI-Tool

1. `ArticleImportStarted` + `ArticleImportFinished` in `data/events/types.ts`.
2. Worker emittet `Started` beim ersten Item-Claim, `Finished` beim
   Job-Completion.
3. `import_articles_from_urls` in `AI_TOOL_CATALOG` + `tools.ts`.

Acceptance: Activity-Modul zeigt beide Events, AI-Tool funktioniert
in einer Mission.

### Phase 7 — Konvergenz *(optional, nach Soak)*

1. `QuickAddInput` + `AddUrlForm` legen unter der Haube auch einen Job
   an (1 Item) statt direkt zu speichern.
2. Eine einzige Code-Bahn für jede Ingestion.
3. Hard-Cleanup: `saveFromUrl` entfernen, Aufrufer auf
   `articleImportsStore.createJob([url])` migrieren.
4. Single-URL-Pfad navigiert zum Reader sobald der Pickup-Consumer das
   `saved`-Event meldet (gleicher Code-Pfad, nur eine UI-Reaktion).

Acceptance: Heart-of-the-app smoke test — neuer User → URL pasten in
QuickAddInput → Reader öffnet sich. Performance vergleichbar (max
+200 ms Latenz akzeptabel, das ist der Worker-Tick).

## Tests

### Phase 1
- `parseUrls` — gültige / ungültige / Duplikate / Whitespace-Varianten.

### Phase 2 (Server)
- Worker pickt nur einen Job pro Lease — zweiter Worker-Stub kommt nicht ran.
- Lease-Renewal — Worker verlängert während Extracting.
- Lease-Expiry — toter Worker, Job wird wieder available.
- Item-Retry — `attempts < 3` schickt zurück auf pending, danach error.

### Phase 3 (Client)
- Pickup → encryptRecord → article.add. Mit `fake-indexeddb`.
- Multi-Tab Web-Lock — nur ein Tab konsumiert.
- Stale Pickup (Item nicht mehr `extracted`) wird ignoriert + gelöscht.
- Dedupe-Race: User hat URL parallel single-saved → Item wird `duplicate`.

### Phase 4 (Store)
- Full lifecycle: createJob → 3 Items → Worker-Mock → 2 saved + 1 error.
- retryFailed setzt nur Error-Items zurück.
- cancelJob setzt alle pending-Items auf `cancelled`.

### Phase 5 (UI)
- E2E Playwright: Bulk-Import mit 5 URLs, alle landen in der Article-
  List. Pause-Button stoppt Worker (in Test-Env mit Fake-Worker-Hook).

### Phase 7 (Konvergenz)
- QuickAddInput-Pfad geht durch den Worker, Performance-Smoke (Latenz
  vom Klick bis Reader < 5 s im Local-Dev).

## Bekannte Edge-Cases

1. **Worst-Case-Dauer**: 50 URLs × ~25 s Server-Extract / Concurrency 3
   ≈ 7 min. UI muss das ehrlich anzeigen. „Im Hintergrund — du kannst
   weitermachen."
2. **Consent-Wall im Bulk**: Server flagged `warning`, Item landet auf
   `consent-wall`, JobDetailView zeigt Hinweis „N Artikel mit Cookie-
   Wand — mit Bookmarklet erneut speichern?". Bulk-Retry dieser Items
   ist ein späteres Polish, kein MVP-Blocker.
3. **Eingabe-Duplikate**: `parseUrls` dedupliziert vor Job-Erzeugung.
4. **Bestehende Articles**: Pickup-Consumer prüft per `findByUrl` vor
   `saveFromExtracted` — falls in der Zwischenzeit single-saved, geht
   das Item auf `duplicate`.
5. **Worker-Crash mid-Item**: `state='extracting'` mit abgelaufener
   Lease wird vom nächsten Tick zurück auf `pending` gesetzt.
6. **Job-Cancel während Extract läuft**: Worker prüft pro Item den
   Job-Status vor dem Pickup-Write. Bei `status='cancelled'` →
   Item-State auf `cancelled`, kein Pickup.
7. **Ratelimit auf `extractFromUrl`**: Der Server hat Rate-Limits pro
   User auf `/api/v1/articles/extract` (200/min). Worker geht nicht
   über HTTP — er ruft `extractFromUrl()` direkt aus dem Modul. Kein
   Rate-Limit-Konflikt.
8. **Job-Liste wird zu lang**: Soft-Delete-on-30-Days-old in Phase 7-Polish.

## Was bewusst NICHT im Scope ist

- Cross-User-Resharing von Job-Definitionen (kein Use-Case)
- Server-side Re-Extraction (für Re-Index nach Readability-Updates) —
  separater Plan
- Bulk-Tagging im selben Schritt — der User taggt nach dem Import, nicht
  während
- Import aus Pocket / Instapaper / Raindrop-Backup-Dateien — eigenes
  Modul-Feature, später

## Reference Implementations im Repo

- Server-Worker-Pattern: `services/mana-ai/src/runner/`,
  `services/mana-ai/src/db/missions-projection.ts`
- Snapshot-Projektion + Advisory-Lock:
  `services/mana-ai/src/db/snapshot-refresh.ts`
- Singleton-Bootstrap-via-sync_changes (Server-Write mit system actor):
  `services/mana-auth/src/services/bootstrap-singletons.ts`
- Local-only Listener-Wiring: `apps/mana/apps/web/src/lib/data/data-layer-listeners.ts`
- liveQuery-Driven UI: `apps/mana/apps/web/src/lib/modules/ai-missions/`
