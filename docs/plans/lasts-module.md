# Lasts — Module Plan

## Status (2026-04-26)

**M1 Skelett: DONE** — `lasts/`-Modul registriert, Dexie v51, Encryption-Registry, Per-Space-Welcome-Seed, Route `/lasts` mountet mit Empty-State, Refactor `firsts/types.ts` extrahiert Categories nach `data/milestones/categories.ts` ohne API-Bruch.

**M2 CRUD + DetailView: DONE** — ListView mit StatusTabs (Alle | Vermutet | Bestätigt | Aufgehoben), Quick-Add (Suspected/Confirmed-Toggle, Enter erstellt + öffnet Detail), Context-Menu, Search ab > 5 Einträgen. DetailView (`views/DetailView.svelte` + Route `/lasts/entry/[id]`) mit always-editable Feldern, Autosave on blur/change, Lifecycle-Buttons (Bestätigen, Aufheben mit Inline-Note), Delete + Auto-Back. 44 i18n-Keys × 5 Locales.

**M3 Inbox + Inferenz: DONE** — Dexie v52 mit `lastsCooldown`-Tabelle (deterministische ID `${refTable}:${refId}`, 12-Monate-Cooldown). Inferenz-Engine (`inference/scan.ts` + `inference/sources/places.ts`) als Source-Registry-Pattern. Erste Quelle: Places — Heuristik `visitCount ≥ 5 ∧ Span ≥ 180d ∧ Silence ≥ 365d`. Orchestrator dedupliziert gegen existierende Lasts + Cooldown-Liste. `suggestLasts()`-Store-Methode triggert Scan + schreibt Survivors als `suspected` mit `inferredFrom`. InboxView (`views/InboxView.svelte` + Route `/lasts/inbox`) mit "Jetzt scannen"-Button + Akzeptieren (löscht inferredFrom → bleibt suspected im Hauptfeed) / Verwerfen (delete + cooldown). ListView trägt Inbox-Link + Live-Count rechts in der Tab-Bar.

**Deferred zu M3.b**: `contacts`-Source braucht `lastInteractionAt`-Feld auf Contact-Records (existiert nicht); `habits`-Source braucht direkten Timestamp im HabitLog (aktuell via `timeBlockId`-Join). Beide nachziehen sobald jeweilige Felder existieren oder via separater Aggregation. Tabu-Liste (kein Auto-Suggest für `relationship: family|partner` in contacts, no refs zu period/dreams/losses/regret) wird erst beim Hinzufügen der jeweiligen Source aktiv — Hooks sind im Orchestrator vorbereitet (kann pro Source-Scanner früh ausgefiltert werden, bevor Kandidat zurückkehrt).

**M4 AI-Tools: DONE** — 5 Tools im `AI_TOOL_CATALOG` (`@mana/shared-ai/src/tools/schemas.ts`):
- `create_last` (propose) — neuer Last suspected | confirmed
- `confirm_last` (propose) — suspected → confirmed mit Reflexion (date, meaning, whatIKnewThen, whatIKnowNow, tenderness 1-5, wouldReclaim no/maybe/yes)
- `reclaim_last` (propose) — confirmed → reclaimed mit optionaler Note
- `list_lasts` (auto) — gefiltert nach status + category, max 100
- `suggest_lasts` (auto) — triggert Inferenz-Engine, schreibt Survivors als suspected mit inferredFrom in Inbox

Webapp-Implementierungen in `lasts/tools.ts` (Vault-locked-Handling für `list_lasts`, Validierung von Enums + Range-Checks). Registriert in `data/tools/init.ts`. Server-side Planner-Drift-Test (`services/mana-ai/src/planner/tools.test.ts`) bestätigt Konsistenz: 4/4 grün. Shared-AI Schema-Tests: 6/6 grün.

**Nicht in M4**: `<AiProposalInbox module="lasts" />` Wiring in ListView entfällt — die Komponente existiert nicht im Repo (root `apps/mana/CLAUDE.md` beschreibt sie als "wired in /todo, /calendar, /places, /drink, /food, /news, /notes" aber `find apps/mana -iname "*proposal*"` liefert null). Aspirational-Doc-Drift, nicht meine M4-Lieferung. Sobald die Komponente existiert, ist `<AiProposalInbox module="lasts" />` ein Einzeiler in `lasts/ListView.svelte` zwischen Tab-Bar und Quick-Add.

**M5 Reminders + Settings: DONE** (Pivot zu In-App-Banner statt OS-Push) — kein PWA-Push-System existiert im Repo (`mana-notify` ist server-side für Email/Web-Push, kein Service-Worker-Push-Subscription, keine `Notification.requestPermission()` Aufrufe in der webapp). Pragmatischer Pfad analog zum **augur `DueBanner`-Pattern**: in-app surfacing der heutigen Lasts beim Öffnen von `/lasts`, opt-in-toggelbar in den Settings.

Lieferung:
- **Pure Date-Math** (`lib/reminders.ts`): `isSameDayOfYear`, `yearsBetween`, `findAnniversaryLasts` (confirmed lasts mit `date` heute vor X Jahren), `findRecognitionAnniversaryLasts` (any status mit `recognisedAt` heute vor X Jahren). 12 Vitest-Cases, alle grün.
- **Settings-Store** (`stores/settings.svelte.ts`) via `createAppSettingsStore('lasts-settings', …)`: 4 persistent localStorage-Flags — `anniversaryReminders`, `recognitionReminders`, `inboxNotify`, `bannerMaxItems` (Default 3). Modul-Pattern analog `todoSettings`/`broadcastSettings`.
- **DueBanner-Component** (`components/DueBanner.svelte`): rendert max-N Zeilen — Anniversaries → Recognition-Anniversaries → Inbox-Notify in dieser Priorität, deduplicated wenn Anniversary + Recognition denselben Last treffen. Klick → `/lasts/entry/[id]` oder `/lasts/inbox`.
- **SettingsView + Route** (`views/SettingsView.svelte` + `/lasts/settings`): 3 Toggles + Slider für `bannerMaxItems` + "Zurücksetzen" + "Test-Banner zeigen" (rendert 4 Sek Beispiel) + Footnote zur fehlenden OS-Push-Infrastruktur.
- **ListView-Wiring**: `<DueBanner {lasts} {inboxCount} />` ganz oben, `⚙`-Settings-Link in der Tab-Bar.
- **i18n**: 22 neue Keys × 5 Locales (banner.* + settings.*).

**Deferred zu M5.b — echtes OS-Push** sobald PWA-Push-Infra existiert: Service-Worker-Subscription via `Notification.requestPermission()` + Push-Subscription-Endpoint, `mana-notify`-Backend-Cron für Anniversary-Scans (statt client-side beim App-Öffnen), Hard-Cap 2 Pushs/Monat als Server-Throttle. Die Date-Math-Helper (`findAnniversaryLasts` + `findRecognitionAnniversaryLasts`) sind bereits push-tauglich purer Code ohne Svelte-Runen-Bindings — können der Server-Cron ohne Refactor wiederverwendet werden.

**Vor-Push-Validatoren**: `validate:i18n-parity` rot wegen pre-existing untracked WIP `apps/mana/apps/web/src/lib/i18n/locales/settings/{de,en,es,fr}.json` — `it.json` fehlt; nicht in git history, mtime = 20:42 (nicht meine Lieferung; vermutlich parallele Session oder Hook). Mein `lasts/`-Namespace hat alle 5 Locales aligned.

**M6 Visibility + Unlisted-Sharing: DONE** — Modul auf das Repo-weite `@mana/shared-privacy`-System aufgesattelt, analog augur/library/places/events.

Lieferung:
- **Type-Erweiterung**: `LocalLast` und `Last` haben jetzt `visibility`, `visibilityChangedAt`, `visibilityChangedBy`, `unlistedToken`, `unlistedExpiresAt`. `toLast` setzt Default `'private'` (intim, anders als firsts).
- **Encryption-Registry**: visibility/Token-Felder bleiben plaintext (Server-Routing-Felder, keine User-typed Inhalte). Crypto-Audit weiter sauber bei 211 Tables.
- **Per-Space-Welcome-Seed**: explizit `visibility: 'private'`.
- **Resolver**: `buildLastBlob` in `data/unlisted/resolvers.ts` — Whitelist nur "reflective core" (title, status, category, date, meaning, whatIKnewThen, whatIKnowNow, tenderness, wouldReclaim). `note`, `inferredFrom`, person/place/media-Refs, recognisedAt, reclaimedNote bleiben PRIVAT. **Hard-Block: reclaimed Lasts werden nicht serialisiert** — die zurückgekommen-Emotion ist verletzlicher als der Last selbst.
- **Store-Methoden** (`stores/items.svelte.ts`): `setVisibility(id, level)` mit publish/revoke unlisted-Snapshot via `@mana/shared-privacy/unlisted-client`, `regenerateUnlistedToken(id)` für Token-Rotation, `setUnlistedExpiry(id, date)` für TTL-Update. Reclaim-Lasts → unlisted wird im Store geblockt mit klarer Fehlermeldung.
- **SharedLastView** (`SharedLastView.svelte`): public-render-Komponente, kontemplativer Ton, weisse Karte mit Kategorie-Akzent links, "Damals / Heute"-Reflexion zweispaltig, optional Tenderness-Stars + WouldReclaim. "via Mana Lasts" Footer, kein Marketing.
- **Share-Dispatcher**: `routes/share/[token]/+page.svelte` kennt jetzt `data.collection === 'lasts'`.
- **DetailView-Wire**: `<VisibilityPicker>` + `<SharedLinkControls>` Block oberhalb der Lifecycle-Action-Bar — nur sichtbar für non-reclaimed Lasts.
- **i18n**: `lasts.detail.visibilityLabel` × 5 Locales.

**M6 Done-Definition**: ✓ Last kann auf `unlisted` gesetzt werden, Share-Link funktioniert öffentlich ohne Login (Snapshot-Server-Resolution via mana-api `/api/v1/unlisted/public/<token>`, dann SSR-Render via `SharedLastView`).

**Vor-Push-Validatoren** weiter: 2 svelte-check-Errors in `SettingsSidebar.svelte` — gleiche Orphan-WIP-Quelle wie `settings/it.json` (nicht meine Lieferung). Mein Code: 0/0/0 in allen reminders.test (12/12), i18n-keys baseline-equal, crypto 211 ✓.

**M7 Timeline-Aggregator + Year-Recap: DONE** — Cross-modulares "Meilensteine"-Surface, das firsts ∪ lasts als ein chronologisches Feed rendert.

Lieferung:
- **Pure Aggregator** `data/milestones/timeline-query.ts`: `mergeMilestones(firsts, lasts)` mit Discriminator-Direction (`'first'` | `'last'`), Pinned-First-Sort, Date-desc-fallback-zu-createdAt. Plus `filterByDirection`, `filterByYear`, `compareTimelineDesc`. Reactive Hook `useMilestonesTimeline()` lädt beide Tabellen parallel + dekodiert client-seitig.
- **Recap-Aggregator** `data/milestones/year-recap.ts`: `buildMilestonesRecap(entries, year)` → `{ year, total, firsts, lasts, byCategory: per-Cat × per-Direction, topFirsts (5), topLasts (5), activeMonths: 'YYYY-MM'[] }`. Bewusst nur Counts, keine Hit-Rate/Brier-Style-Metriken (lasts/firsts haben kein "verifizierbares" Element).
- **Tests** `timeline-query.test.ts`: 12/12 passed (mergeMilestones, filterByDirection, filterByYear, buildMilestonesRecap mit allen Feldern, compareTimelineDesc).
- **TimelineView** (`lib/components/milestones/TimelineView.svelte`): Tab-Bar (Alle | Firsts | Lasts), Karten mit Direction-Chip + Kategorie-Pille, Klick → jeweilige Modul-Detail-Route. Recap-Link top-right zum aktuellen Jahr.
- **YearRecapView** (`lib/components/milestones/YearRecapView.svelte`): Hero-Stats (Total | Firsts | Lasts mit direction-coloring), Kategorie-Breakdown mit Per-Direction-Counts, Top-5-Listen pro Direction (klickbar), Active-Months-Strip.
- **Routes** `/milestones` und `/milestones/recap/[year]` (nutzen `RoutePage` mit `appId="milestones"` — Registry hat keinen Eintrag, fallback rendert sauber mit Title-Override).
- **Cross-Link** in `lasts/ListView.svelte` Tab-Bar: "Meilensteine"-Link führt zu `/milestones`.
- **i18n-Namespace** `milestones/` × 5 Locales mit `timeline.*`, `tabs.*`, `recap.*` Keys (i18n-parity nun 39 namespaces × 5 locales aligned).

**M7 Done-Definition**: ✓ Timeline-View zeigt firsts und lasts interleaved, sortierbar (date desc, pinned-first), filterbar (direction tabs, year-filter über Recap-Route).

**Nicht in M7** (Polish): Eintrag in `packages/shared-branding/src/mana-apps.ts` als "milestones"-App mit Icon/Color für den App-Launcher. Ohne Eintrag funktioniert die Route via direkte URL-Navigation oder den Cross-Link von `/lasts`. Kann später ergänzt werden — kostet einen App-Icon-SVG und einen mana-apps.ts-Block.

---

**M1-M7 SHIPPED** — Modul `lasts` ist feature-komplett gemäß Plan. Validation: 0/0/0 in svelte-check (7645 files), 24/24 tests grün (12 reminders + 12 timeline), i18n-parity 39×5 aligned (+2 namespaces: lasts, milestones), i18n-keys baseline-equal, crypto 211 tables. Browser-Test offen (`pnpm run mana:dev` → `/lasts`, `/lasts/inbox`, `/lasts/settings`, `/lasts/entry/[id]`, `/milestones`, `/milestones/recap/2026`).

Vorbild: das bereits existierende Modul [`firsts/`](../../apps/mana/apps/web/src/lib/modules/firsts/) (Bucket-List + Reflexion mit `dream → lived` Lifecycle, 11 Kategorien, Foto/Audio/Place/People). `lasts` ist das spiegelbildliche Modul: das *letzte* Mal, dass du etwas getan/gefühlt/gesehen hast — meistens erst rückwirkend erkennbar.

---

## Ziel

Ein Modul `lasts`, in dem der Nutzer **Letzte Male** erfasst und reflektiert. Kernfrage: *"Wann habe ich das eigentlich zum letzten Mal getan/gefühlt — und wusste ich's damals?"*

Zwei Eingabewege:

1. **Manuell** — der User markiert bewusst (selten, oft an Wendepunkten: letzter Tag im Job, letztes Konzert mit X, letzte Nacht in der alten Wohnung).
2. **Inferred** — die AI scannt regelmässig die anderen Module (places, contacts, food, habits, routes, music) auf Frequenz-Muster und schlägt Last-Kandidaten in einer Inbox vor: *"Du warst seit 18 Monaten nicht mehr in [Café X] — vorher 3×/Woche. Last?"*

Nicht im Scope:
- Trauer-Workflow für Verluste/Tod (eigenes Modul `losses` aus Module-Ideas).
- Bucket-List / Vorfreude — bleibt bei `firsts`.
- Streak-Tracking — bleibt bei `habits`.

## Abgrenzung

- **Nicht `firsts`**: Tonalität ist anders (Kontemplation vs. Vorfreude), Lifecycle ist anders (`suspected → confirmed` vs. `dream → lived`), Push-Quoten sind anders. Eigenes Modul, eigene Tabelle. Geteilt wird nur der Code drumherum (Komponenten, Kategorien, Picker).
- **Nicht `losses`**: dort gehört der Trauer-Workflow für markierte Verluste hin. `lasts` ist breiter und oft *zärtlich* statt schmerzhaft. Ein Last kann zu einem Loss eskaliert werden (Cross-Link), aber ein Loss erzeugt keinen Last.
- **Nicht `eras`**: Eras aggregieren ganze Lebensabschnitte. `lasts` sind die Endpunkte einzelner Dinge — Eras können auf Lasts referenzieren ("Burnout-Jahr endete mit folgenden Lasts: …").
- **Nicht `journal`**: ein Journal-Eintrag ist datiert auf den Schreibtag; ein Last ist datiert auf das (vermutete) Ereignis. Reflexion lebt im Last-Datensatz selbst, nicht als verlinkter Journal-Eintrag.

## Architektur-Entscheidung: zwei Tabellen, geteilte Komponenten

**Eigene Dexie-Tabelle `lasts`** — nicht `milestones` mit Diskriminator. Begründung in der vorgelagerten Diskussion (Modul-Boundary, `_pendingChanges`-Tagging, Encryption-Registry pro Tabelle, eigene Visibility-Defaults, eigene Migrations).

**Geteilt** wird stattdessen alles ausserhalb der Tabelle:
- Kategorien (11 Stück, identisch mit `firsts`) → `lib/data/milestones/categories.ts`
- Lifecycle-Helpers, Validators → `lib/data/milestones/lifecycle.ts`
- Timeline-Aggregator-Query (firsts + lasts gemerged) → `lib/data/milestones/timeline-query.ts`
- UI-Komponenten (Card, Editor, ReflectionFields, LifecycleToggle, CategoryPill) → `lib/components/milestones/`

Das macht ein zukünftiges drittes Geschwister-Modul (`peaks`, `pivots`, `cycles`) trivial — nur neue Tabelle + Lifecycle-Strings, alles andere ist da.

## Lifecycle-Mapping

| `firsts` | `lasts` |
|---|---|
| `dream` (geplant, will ich erleben) | `suspected` (vermutet, vom User oder AI markiert) |
| `lived` (gemacht, mit Reflexion) | `confirmed` (bestätigt, mit Reflexion) |
| — (kein Rückwärts-Pfad) | `reclaimed` (war doch nicht das letzte Mal — ist wieder passiert) |

`reclaimed` ist semantisch wichtig: das Modul soll mit dem Leben atmen. Wenn du wieder mit der Person sprichst oder doch wieder ins Café gehst, klickst du "Aufgehoben" — der Eintrag bleibt in der History (mit Notiz "Aufgehoben am …"), erscheint aber nicht mehr im Hauptfeed. Reclaimed-Items sind ihre eigene kleine emotional bedeutsame Untersicht.

## Felder-Mapping (`lasts` ↔ `firsts`)

| `firsts` Feld | `lasts` Feld | Bemerkung |
|---|---|---|
| `title` | `title` | identisch |
| `status: 'dream'\|'lived'` | `status: 'suspected'\|'confirmed'\|'reclaimed'` | Discriminator |
| `category` | `category` | gleiches Enum |
| `motivation` | `meaning` | "Was hat es dir bedeutet?" statt "Warum willst du das?" |
| `priority: 1\|2\|3` | `confidence: 'probably'\|'likely'\|'certain'` | Wie sicher ist es das letzte Mal? |
| `date` | `date` | Vermutetes/bestätigtes Datum (oft approximativ) |
| `note` | `note` | identisch |
| `expectation` | `whatIKnewThen` | "Was wusstest du damals nicht?" |
| `reality` | `whatIKnowNow` | "Was weisst du jetzt?" |
| `rating: 1-5` | `tenderness: 1-5` | Nicht "gut/schlecht" — wie sehr berührt es dich heute |
| `wouldRepeat: yes\|no\|definitely` | `wouldReclaim: no\|maybe\|yes` | Würdest du es zurückholen, wenn du könntest? |
| `personIds[]` | `personIds[]` | identisch |
| `placeId` | `placeId` | identisch |
| `mediaIds[]` | `mediaIds[]` | identisch |
| `audioNoteId` | `audioNoteId` | identisch |
| `sharedWith` | `sharedWith` | identisch |
| `isPinned`, `isArchived` | `isPinned`, `isArchived` | identisch |
| — | `recognisedAt` | Wann wurde es als Last erkannt (oft Jahre nach `date`) — wichtig für "vor X Jahren erkannt"-Reminder |
| — | `inferredFrom` | Optionales Provenance-Object: `{ tool: 'suggest_lasts', refTable: 'places', refId: '...', frequencyHint: '3x/week → 0 in 18mo' }` für AI-Vorschläge |

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/lasts/
├── types.ts                    # LocalLast, Last, LastStatus, LastConfidence, WouldReclaim, Tenderness
├── collections.ts              # lastTable + LASTS_GUEST_SEED (1 confirmed + 1 suspected Beispiel)
├── queries.ts                  # useAllLasts, useLastsByStatus, useLastsByCategory, useLast(id), useLastsInbox (suspected only), useLastsStats
├── stores/
│   └── items.svelte.ts         # createLast, updateLast, confirmLast, reclaimLast, suggestLasts (Inferenz-Loop), pin/archive/delete
├── tools.ts                    # AI-Tools: create_last (propose), confirm_last (propose), reclaim_last (propose), list_lasts (auto), suggest_lasts (auto)
├── inference/
│   └── scan.ts                 # Cross-Modul-Reader: places/contacts/food/habits/routes für Frequenz-Drops
├── ListView.svelte             # Modul-Root (komponiert StatusTabs + Liste, leitet zu InboxView)
├── InboxView.svelte            # Suspected-Vorschläge: Akzeptieren / Verwerfen
├── DetailView.svelte           # Einzelansicht inkl. Reflexion + Reclaim-Button
├── module.config.ts            # { appId: 'lasts', tables: [{ name: 'lasts' }] }
└── index.ts                    # Re-Exports
```

```
apps/mana/apps/web/src/lib/data/milestones/        # NEU — geteilt firsts ↔ lasts
├── categories.ts               # MilestoneCategory, CATEGORY_LABELS, CATEGORY_COLORS (extrahiert aus firsts/types.ts)
├── lifecycle.ts                # Status-Transition-Helpers, Validators
├── shared-types.ts             # Person/Place/Media-Ref-Shapes (re-exports BaseRecord)
└── timeline-query.ts           # useMilestonesTimeline() — Union-Query firsts ∪ lasts, sortiert nach date
```

```
apps/mana/apps/web/src/lib/components/milestones/  # NEU — geteilte UI
├── MilestoneCard.svelte        # generisch, props: direction, status, category, title, date, isPinned
├── MilestoneEditor.svelte      # Formular-Body — slot-basiert für direction-spezifische Reflexions-Felder
├── ReflectionFields.svelte     # zwei Textareas, Labels via props
├── LifecycleToggle.svelte      # generisch, status-options via props
├── CategoryPill.svelte         # Farb-Pill aus CATEGORY_COLORS
└── PeoplePlaceMediaPicker.svelte  # bündelt die drei Picker (existieren schon einzeln)
```

```
apps/mana/apps/web/src/routes/(app)/
├── lasts/+page.svelte                  # NEU — Modul-Root
├── lasts/[id]/+page.svelte             # NEU — Detail-Route
├── lasts/inbox/+page.svelte            # NEU — Suspected-Inbox (separate Route weil eigenes mentales Modell)
└── milestones/+page.svelte             # OPTIONAL M7 — Timeline-Aggregator firsts + lasts
```

## Daten-Schema

### `LocalLast` (Dexie)

```typescript
import type { BaseRecord } from '@mana/local-store';
import type { MilestoneCategory } from '$lib/data/milestones/categories';

export type LastStatus = 'suspected' | 'confirmed' | 'reclaimed';
export type LastConfidence = 'probably' | 'likely' | 'certain';
export type WouldReclaim = 'no' | 'maybe' | 'yes';

export interface InferredFrom {
  tool: string;                  // z.B. 'suggest_lasts'
  refTable: string;              // 'places' | 'contacts' | 'food' | 'habits' | 'routes' | …
  refId: string;
  frequencyHint?: string;        // human-readable: '3x/week → 0 in 18mo'
  scannedAt: string;             // ISO
}

export interface LocalLast extends BaseRecord {
  title: string;
  status: LastStatus;
  category: MilestoneCategory;

  // Recognition phase
  confidence: LastConfidence | null;     // wie sicher
  inferredFrom: InferredFrom | null;     // null = manuell

  // Confirmed phase (Reflexion)
  date: string | null;                   // ISO date — vermutet oder bestätigt
  meaning: string | null;                // "was hat es bedeutet"
  note: string | null;
  whatIKnewThen: string | null;
  whatIKnowNow: string | null;
  tenderness: number | null;             // 1-5
  wouldReclaim: WouldReclaim | null;

  // Reclaimed phase
  reclaimedAt: string | null;            // ISO — falls aufgehoben
  reclaimedNote: string | null;          // optional Begründung

  // Social
  personIds: string[];
  sharedWith: string | null;

  // Rich media
  mediaIds: string[];
  audioNoteId: string | null;
  placeId: string | null;

  // Meta
  recognisedAt: string;                  // wann wurde der Last erkannt (≠ createdAt nicht garantiert, aber meist gleich)
  isPinned: boolean;
  isArchived: boolean;
}
```

### Domain-Typ `Last` — gleiche Form ohne BaseRecord-Internals (analog `firsts/types.ts`).

### Encryption-Registry

In `apps/mana/apps/web/src/lib/data/crypto/registry.ts` (analog zu `firsts`-Block):

```typescript
// ─── Lasts ───────────────────────────────────────────────
// User-typed text fields are encrypted. Status, category, confidence, dates,
// tenderness, wouldReclaim, personIds, mediaIds, placeId, inferredFrom stay
// plaintext for indexing/filtering and so the inference scanner can read
// provenance without master-key access.
lasts: {
  enabled: true,
  fields: ['title', 'meaning', 'note', 'whatIKnewThen', 'whatIKnowNow', 'reclaimedNote', 'sharedWith'],
},
```

### Dexie-Migration

Neue Version `db.version(51)` in `apps/mana/apps/web/src/lib/data/database.ts`:

```typescript
db.version(51).stores({
  // … alle existierenden Tabellen 1:1 übernehmen aus v50 …
  lasts: 'id, spaceId, userId, status, category, date, recognisedAt, isPinned, isArchived',
});
```

Index-Strategie:
- `status` — schnelle Filter für Inbox vs. Confirmed-Liste
- `category` — Kategorie-Filter
- `date` — Sort + Anniversary-Scans
- `recognisedAt` — "vor X Jahren erkannt"-Reminder
- `isPinned`, `isArchived` — Standard-Listing-Filter

Kein Soft/Hard-Split nötig — neue Tabelle, keine bestehenden Daten zu migrieren.

## Inferenz-Engine (`inference/scan.ts`)

Heuristik pro Quell-Modul:

| Quelle | Signal |
|---|---|
| `places` | Visit-Frequenz drop: war `≥ N visits / month` über `≥ M months`, jetzt `0 visits` seit `≥ K months` |
| `contacts` | Last-contact-date in `contacts.lastInteractionAt` (falls vorhanden) — wenn `> threshold` Monate und vorher häufig |
| `food` | Gericht in `meals` regelmässig, jetzt nicht mehr |
| `habits` | Habit pausiert oder seit X nicht mehr geloggt |
| `routes`/`hikes` | Route mit Wiederholungs-Counter, jetzt 0 |
| `music` (falls Listening-Logs existieren) | Künstler-Drop |
| `notes`/`writing`/`quotes` | Tag/Theme-Frequenz-Drop |

Default-Schwellen konservativ (Inbox-Lärm ist tödlich für die emotionale Wirkung):
- minimale Vorgeschichte: ≥ 5 Vorkommen über ≥ 6 Monate
- minimale Stille: ≥ 12 Monate ohne Vorkommen
- max. Vorschläge pro Scan: 3
- Cooldown: keine Wiedervorschläge derselben `(refTable, refId)` für 12 Monate nach Verwerfen

Cron: einmal pro Monat, z.B. am 1. um 9:00 Lokalzeit. Ausführung im AI-Mission-Runner als Mission `lasts.monthly-scan` (oder als simpler client-seitiger Cron-Job — tendiere zu Mission, weil dadurch Audit-Log + Pause-Switch gratis). Modul-Owner: einer der bestehenden Agents oder ein dedizierter "Gefährte"-Agent.

**Hard rules** (in der Heuristik verdrahtet, nicht User-konfigurierbar):
- Keine Vorschläge für `contacts` mit `relationship: 'family' | 'partner'` ohne explizite Opt-In — Trauer-Trigger.
- Keine Vorschläge für Refs in `period`, `dreams`, `losses`, `regret/forgive` — zu intim.
- Wenn `losses` einen Eintrag mit gleicher `personId` hat, suspend alle Inferenz für diese Person komplett.

## AI-Tool-Coverage

Im `AI_TOOL_CATALOG` in `@mana/shared-ai/src/tools/schemas.ts`:

| Modul | Propose | Auto |
|---|---|---|
| **lasts** | `create_last`, `confirm_last`, `reclaim_last` | `list_lasts`, `suggest_lasts` |

Schemas (skizziert):

```typescript
create_last: {
  policyHint: 'standard',
  input: { title, category, status?, date?, confidence?, meaning?, note?, personIds?, placeId? }
}
confirm_last: {
  policyHint: 'standard',
  input: { id, date?, whatIKnewThen?, whatIKnowNow?, tenderness?, wouldReclaim? }
}
reclaim_last: {
  policyHint: 'standard',
  input: { id, reclaimedAt, reclaimedNote? }
}
list_lasts: {
  policyHint: 'read',
  input: { status?, category?, sinceDate? }
}
suggest_lasts: {
  policyHint: 'read',                            // liefert Vorschläge, schreibt nicht
  input: { sources?: string[], minMonthsSilent?, limit? }
}
```

`suggest_lasts` schreibt selbst nichts — der Planner kann das Resultat in eine `create_last`-Proposal umwandeln, die der User approved.

## Push-Notifications (M5)

Drei opt-in-Klassen, getrennt umschaltbar in `/lasts/settings`:

1. **Anniversary-Reminder** — "Heute vor X Jahren das letzte Mal …" (nur für `confirmed` mit `date`).
2. **Recognition-Reminder** — "Vor X Jahren als Last erkannt: …" (nutzt `recognisedAt`).
3. **Inbox-Notify** — "3 neue Last-Vorschläge in der Inbox" (max. 1×/Monat nach dem Scan).

Hard-Cap insgesamt: 2 Push pro Monat. Snooze-pro-Item.

Implementierung über das bestehende Notification-System (zu prüfen: existiert das schon zentral, oder ad-hoc pro Modul?). Falls noch nicht vorhanden: M5 als separater Sub-Plan, M1-M4 funktionieren ohne.

## Visibility / Sharing

Default-Visibility: `private`. Anders als `firsts` (oft teilbar — du erzählst gerne von deinem ersten Mal Bungee-Jumping) sind Lasts intim.

Embed-Resolver für Visibility-System (analog `events`/`library` aus `project_visibility_system.md`-Memory): einzelne `lasts` können `unlisted` werden für `/share/[token]`-Routen, mit QR + Expiry. Sinnvolle Public-Aggregate kommen erst in M7+:
- "Lasts of 2026" Year-Recap (anonymisiert/kuratiert)
- Embed auf personal-site: poetische Sammlung kuratierter Lasts

## Refactor `firsts/` (Vorbereitung M1)

Damit `lasts` die geteilten Pieces wirklich nutzen kann, muss `firsts/` minimal umgebaut werden:

1. **Extract Categories**: `CATEGORY_LABELS`, `CATEGORY_COLORS` aus `firsts/types.ts` raus → `data/milestones/categories.ts`. `firsts/types.ts` re-exportiert für Abwärtskompatibilität.
2. **Extract MilestoneCard**: aus `firsts/ListView.svelte` die Listen-Item-Markup-Logik extrahieren in `components/milestones/MilestoneCard.svelte`. `ListView.svelte` rendert dann `<MilestoneCard direction="first">`.
3. **Optional jetzt, sicher später**: ReflectionFields, LifecycleToggle, CategoryPill, PeoplePlaceMediaPicker analog extrahieren. Nicht im kritischen Pfad — kann passieren, wenn `lasts` sie real braucht.

Klassischer **soft-first**-Migrationsstil (siehe Memory `feedback_soft_before_hard_migrations.md`): zuerst extrahieren mit Re-Export-Aliassen, dann später Imports umstellen, dann Aliasse löschen. Aber kein Schema-Change — nur Code-Move, deshalb risikoarm.

## Milestones

### M1 — Refactor + Skelett (~ 1 Tag)
- `data/milestones/categories.ts` extrahieren, `firsts/types.ts` re-exportiert
- `components/milestones/MilestoneCard.svelte` extrahieren, `firsts/ListView.svelte` umstellen
- `lasts/` Modul-Skelett: `module.config.ts`, `types.ts`, `collections.ts`, `index.ts`
- Dexie v51 mit `lasts`-Tabelle
- Encryption-Registry-Eintrag
- Guest-Seed: 1 confirmed Beispiel ("Letzter Tag im alten Job"), 1 suspected ("Vermutlich letztes Mal …")
- Route `/lasts/+page.svelte` mountet leer mit "Noch keine Lasts"

**Done-Definition**: `lasts`-Modul lädt, leere Liste rendert, Dexie-Inspector zeigt Tabelle, `validate:all` grün.

### M2 — CRUD + ListView + DetailView (~ 1 Tag)
- `stores/items.svelte.ts`: createLast, updateLast, confirmLast, reclaimLast, pin/archive/delete
- `queries.ts`: useAllLasts, useLastsByStatus, useLast(id)
- `ListView.svelte`: StatusTabs (Suspected | Confirmed | Reclaimed), MilestoneCard-basierte Liste
- `DetailView.svelte` + Route `/lasts/[id]/+page.svelte`: Reflexionsfelder, Lifecycle-Buttons
- Editor-Component (kann inline oder modal): nutzt geteilten `MilestoneEditor` mit lasts-spezifischen Reflexions-Labels

**Done-Definition**: User kann Last manuell anlegen, von suspected nach confirmed bewegen, reflektieren, reclaimen.

### M3 — Inbox + Inference (~ 1 Tag)
- `inference/scan.ts`: Place-Drop + Contact-Drop + Habit-Drop Heuristiken (erste drei reichen für M3)
- `InboxView.svelte` + Route `/lasts/inbox/+page.svelte`: Liste der suspected mit `inferredFrom != null`, Akzeptieren/Verwerfen
- `suggestLasts()`-Methode im Store (nicht der AI-Tool — direct call), die einen Scan triggern und Suspected-Records anlegen kann
- "Scan jetzt"-Button für Dev/Manual-Trigger
- Cooldown-Liste: Tabelle `lastsInferenceCooldown` oder Feld in einer Settings-Tabelle für die "verworfen, nicht wieder vorschlagen"-Logik

**Done-Definition**: Manueller Scan-Trigger erzeugt sinnvolle Vorschläge basierend auf realen places/contacts/habits-Daten; Verwerfen unterdrückt Wiedervorschlag.

### M4 — AI-Tools (~ 0.5 Tage)
- `tools.ts` mit den fünf Tool-Definitionen
- Eintrag in `AI_TOOL_CATALOG` (`@mana/shared-ai/src/tools/schemas.ts`)
- Server-side Planner-Drift-Check läuft automatisch grün
- `<AiProposalInbox module="lasts" />` in ListView eingebaut
- Tool-Implementierungen in `data/ai/tools/` analog zu existierenden Modulen

**Done-Definition**: AI-Mission "Schau mal, ob es Lasts gibt" generiert Proposals, User kann approven, Eintrag landet als `suspected` mit `inferredFrom`.

### M5 — Push-Notifications + Settings (~ 0.5 Tage, abhängig vom Notification-System)
- `/lasts/settings/+page.svelte` mit drei opt-in-Toggles
- Anniversary-Scan (Cron + match auf `date` mit Jahres-Differenz)
- Recognition-Scan (Cron + match auf `recognisedAt`)
- Inbox-Notify-Hook nach `suggest_lasts`
- Hard-Cap-Logik

**Done-Definition**: Toggles persistent, eine Push-Test-Funktion sendet Beispiel.

### M6 — Visibility + Unlisted-Sharing (~ 0.5 Tage)
- Default-Visibility auf `private`
- VisibilityPicker in DetailView
- Embed-Resolver für `lasts` registrieren (analog `events`/`library`)
- `/share/[token]`-Route lädt einzelnes Last in lesbarem Format

**Done-Definition**: Last kann auf `unlisted` gesetzt werden, Share-Link funktioniert öffentlich ohne Login.

### M7 — Optional: Timeline-Aggregator + Year-Recap
- `data/milestones/timeline-query.ts`: Union-Query firsts ∪ lasts
- `routes/(app)/milestones/+page.svelte`: chronologische Timeline beider, Filter nach Direction
- Year-Recap-Page mit Top-N Lasts + Firsts des Jahres (analog Augur-Year-Recap aus Memory)

**Done-Definition**: Timeline-View zeigt firsts und lasts interleaved, sortierbar, filterbar.

## Per-Space-Seeds

`lasts` ist per-space (analog allen post-spaces-foundation Modulen). Ein Per-Space-Seeder registriert sich in `apps/mana/apps/web/src/lib/data/seeds/lasts.ts`:

```typescript
registerSpaceSeed('lasts-welcome', async (spaceId) => {
  const id = `seed-welcome-${spaceId}`;
  if (await db.table('lasts').get(id)) return;
  await db.table('lasts').add({
    id, spaceId,
    title: 'Willkommen bei Lasts',
    status: 'confirmed',
    category: 'other',
    confidence: 'certain',
    inferredFrom: null,
    date: new Date().toISOString().slice(0, 10),
    meaning: 'Hier fängst du an, deine "letzten Male" festzuhalten.',
    note: null,
    whatIKnewThen: null,
    whatIKnowNow: null,
    tenderness: 3,
    wouldReclaim: null,
    reclaimedAt: null,
    reclaimedNote: null,
    personIds: [], sharedWith: null,
    mediaIds: [], audioNoteId: null, placeId: null,
    recognisedAt: new Date().toISOString(),
    isPinned: false, isArchived: false,
  });
});
```

Side-effect-Import in `data/seeds/index.ts`.

## App-Registry

In `packages/shared-branding/src/mana-apps.ts`:

```typescript
{
  id: 'lasts',
  name: 'Lasts',
  description: 'Letzte Male — bewusst markiert oder rückwirkend erkannt',
  category: 'reflection',  // gleiche Kategorie wie firsts
  requiredTier: 'guest',   // LOCAL TIER PATCH bis Release, dann auf prod-tier setzen
  icon: '…',
  // …
}
```

## Tier-Strategie

Während Entwicklung: `'guest'` mit `// LOCAL TIER PATCH` Marker (Memory `project_tier_patch_resolved.md`). Vor Release auf prod-tier hochziehen — Vorschlag: `beta` analog zu firsts.

## Offene Fragen

1. **`losses` Cross-Link**: Soll ein Last → Loss eskaliert werden können (Button "Das war ein echter Verlust → in losses übernehmen")? Ja, aber `losses` existiert noch nicht als Modul. Hook-Point in DetailView vorbereiten, no-op bis losses gebaut ist.
2. **Audio-First-Eingabe**: Mic → STT → AI-strukturiert → Last-Draft? Würde gut zu Rubberduck/Scribe-Pattern passen. Erstmal nicht in M1-M6, aber DetailView so designen, dass `audioNoteId`-Eingabe leicht später ergänzbar ist (Feld existiert ja schon im Schema).
3. **Persona-Begleitung**: Soll ein dedizierter "Gefährte"-Agent (sanft, kontemplativ) für die Lasts-Begleitung gespawnt werden, oder reicht der Default-Mana-Agent? Vorschlag: in M5 prüfen, fürs Erste Default-Agent.
4. **`recognisedAt` vs. `createdAt`**: In 99% der Fälle gleich. Brauchen wir beide? Ja, weil bei AI-inferred Records der `createdAt` der Scan-Zeitpunkt ist und `recognisedAt` der "User-akzeptiert"-Zeitpunkt — relevant für Recognition-Reminder.
5. **i18n**: Direkt mit echten Keys bauen (nach Memory `project_i18n_hardening.md` ist hardcoded German verboten; validator wird sonst rot). Namespace: `lasts.*`.

## Kosten-Schätzung

| Milestone | Aufwand |
|---|---|
| M1 Refactor + Skelett | 1 Tag |
| M2 CRUD + Views | 1 Tag |
| M3 Inbox + Inference | 1 Tag |
| M4 AI-Tools | 0.5 Tage |
| M5 Push + Settings | 0.5 Tage |
| M6 Visibility + Sharing | 0.5 Tage |
| M7 Timeline (optional) | 0.5 Tage |
| **Total M1-M6** | **4 Tage** |
| **Total inkl. M7** | **4.5 Tage** |

Die ursprüngliche Schätzung "1-2 Tage für M1, +1 Tag Inferenz, +1 Tag Push" war zu knapp — vor allem M3 (Inferenz mit konservativen Schwellen + Cooldown-Mechanik) und der Refactor-Vorlauf in M1 brauchen jeweils ihren vollen Tag.
