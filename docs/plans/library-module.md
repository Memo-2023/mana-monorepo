# Library — Module Plan

## Status (2026-04-17)

**M1 Skelett: DONE.** Modul registriert, Dexie v26 angelegt, Encryption-Registry
eingetragen, Route `/library` mountet einen minimalen Listen-View. Guest-Seed mit
je einem Eintrag pro `kind` (Dune, Arrival, Severance, Saga) vorhanden.
Nächster Schritt: M2 (volles CRUD + Form + Grid + DetailView).

Vor M2 entschieden:
- Audiobooks: `kind='book'` mit `details.format='audio'` (nicht eigener `kind`).
- Manga: in `kind='comic'` ohne Sub-Typ (bis Bedarf für Chapters vs. Issues auftaucht).
- Metadata-Lookup (M7): Endpoint in `apps/api` (`/api/v1/library/lookup?kind=...&q=...`),
  kein eigener Service — Extraktion erst bei Crawler-artigem Bedarf.

---

## Ziel

## Ziel

Ein einziges Modul, mit dem der Nutzer **konsumierte Medien** festhält: Bücher, Filme, Serien, Comics. Kernfrage: *"Habe ich das schon gesehen/gelesen? Wann? Wie fand ich's?"*

Nicht im Scope: Streaming-Integration, Kauf-Tracking, Leseplan-Automatisierung. Kein Ersatz für Goodreads/Letterboxd — eher privates Log mit Rating und Fortschritt.

## Abgrenzung

- **Kein `inventory`**: dort geht's um Besitz (Seriennummer, Garantie, Standort). Hier geht's um Konsum — ein Buch, das man aus der Bibliothek ausgeliehen und gelesen hat, gehört hierher, nicht in `inventory`.
- **Kein `music`**: Musik hat eigene Primitive (Playlists, Projekte). Soundtracks landen weiter in `music/`.
- **Kein `photos`/`picture`**: Fotos und AI-Bilder bleiben getrennt.
- **Cross-Link zu `goals`**: "Lese 20 Bücher 2026" bleibt im Ziel-Modul, liest aber `library.completedAt` über die bestehende Cross-Module-Mechanik.

## Entscheidung: ein Modul, vier Typen

Ein Modul `library` mit Diskriminator `kind: 'book' | 'movie' | 'series' | 'comic'`. Geteiltes Kern-Schema; typ-spezifische Felder in `details: jsonb`. Begründung:

- Ein Sync-Endpoint, eine Encryption-Registry-Zeile, eine Route, ein Settings-Panel
- Quer-Abfragen ("Jahresrückblick über alles") fallen gratis ab
- Konsistenz mit `inventory` (auch ein Typ-übergreifendes "Sammlung"-Modul)
- UI kann trotzdem Tabs pro Typ zeigen und typ-spezifische Listenansichten/Detail-Views laden

Der Tradeoff: pro Typ hat man kein eigenes Launcher-Icon. Falls das später wichtig wird, kann ein Typ als eigenes Modul mit Alias auf dieselbe Tabelle ausgegliedert werden — das Schema muss dafür nicht brechen.

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/library/
├── types.ts                    # LocalLibraryEntry, LibraryEntry, Kind, Status, kind-spezifische Detail-Typen
├── collections.ts              # libraryEntries-Table + Guest-Seed (1 Buch, 1 Film, 1 Serie, 1 Comic)
├── queries.ts                  # useAllEntries, useEntriesByKind, useEntry(id), useStats
├── stores/
│   └── entries.svelte.ts       # createEntry, updateEntry, setStatus, rate, bumpProgress, deleteEntry
├── components/
│   ├── EntryCard.svelte        # kompakter Listeneintrag (Cover + Titel + Rating + Status-Badge)
│   ├── EntryForm.svelte        # Create/Edit — rendert typ-spezifische Felder aus details
│   ├── KindTabs.svelte         # Filter-Tabs (Alle | Bücher | Filme | Serien | Comics)
│   ├── RatingStars.svelte      # 0–5 Sterne
│   ├── StatusBadge.svelte      # geplant / läuft / fertig / abgebrochen
│   ├── EpisodeTracker.svelte   # nur für kind='series': Staffel/Episode checkliste
│   └── CoverImage.svelte       # lazy-load, Fallback-Platzhalter pro Typ
├── views/
│   ├── GridView.svelte         # Cover-Grid (Default)
│   ├── ListView.svelte         # Kompakte Liste mit Filterung
│   └── DetailView.svelte       # Einzelansicht inkl. Review + Re-Watches/Re-Reads
├── tools.ts                    # AI-Tools (später — siehe AI-Integration)
├── constants.ts                # KIND_LABELS, STATUS_LABELS, DEFAULT_TAGS
├── ListView.svelte             # Modul-Root-View (komponiert KindTabs + GridView)
├── module.config.ts            # { appId: 'library', tables: [{ name: 'libraryEntries' }] }
└── index.ts                    # Re-Exports
```

## Daten-Schema

### `LocalLibraryEntry` (Dexie)

```typescript
export type LibraryKind = 'book' | 'movie' | 'series' | 'comic';
export type LibraryStatus = 'planned' | 'active' | 'completed' | 'dropped' | 'paused';

export interface LocalLibraryEntry extends BaseRecord {
  kind: LibraryKind;                         // plaintext — Discriminator, filterbar
  status: LibraryStatus;                      // plaintext — filterbar
  title: string;                              // encrypted
  originalTitle?: string | null;              // encrypted (z.B. engl. Original)
  creators: string[];                         // encrypted — Autor / Regie / Showrunner / Zeichner
  year?: number | null;                       // plaintext
  coverUrl?: string | null;                   // plaintext (externe URL) ODER
  coverMediaId?: string | null;               // plaintext (Referenz in uload/media)
  rating?: number | null;                     // plaintext — 0..5, Schritt 0.5
  review?: string | null;                     // encrypted — Freitext
  tags: string[];                             // encrypted
  genres: string[];                           // plaintext — "Sci-Fi", "Thriller"...
  startedAt?: string | null;                  // plaintext ISO-Datum
  completedAt?: string | null;                // plaintext — für Jahresrückblick / Ziele
  isFavorite: boolean;                        // plaintext
  times: number;                              // plaintext — Zähler "Re-Reads / Re-Watches"
  externalIds?: {                             // plaintext — für spätere Metadata-Sync
    isbn?: string;
    tmdbId?: string;
    openLibraryId?: string;
    comicVineId?: string;
  } | null;
  details: LibraryDetails;                    // typ-spezifische Felder — siehe unten
}
```

### `details` pro `kind`

Diskriminierte Union, damit TypeScript Typ-Sicherheit gibt:

```typescript
export type LibraryDetails =
  | { kind: 'book';   pages?: number; currentPage?: number; format?: 'hardcover' | 'paperback' | 'ebook' | 'audio' }
  | { kind: 'movie';  runtimeMin?: number; director?: string }
  | { kind: 'series'; totalSeasons?: number; totalEpisodes?: number; watched?: Array<{ season: number; episode: number; watchedAt?: string }> }
  | { kind: 'comic';  issueCount?: number; currentIssue?: number; publisher?: string; isOngoing?: boolean };
```

Die `details` bleiben **plaintext** — keine sensiblen Daten drin (Seiten-Zahlen, Episoden-Zähler). Falls sich das ändert (z.B. Spoiler-lastige Episoden-Notizen), Feld nachziehen.

### Encryption-Registry

`apps/mana/apps/web/src/lib/data/crypto/registry.ts` — neuer Eintrag:

```typescript
libraryEntries: {
  fields: ['title', 'originalTitle', 'creators', 'review', 'tags'],
  version: 1,
},
```

## Routing

```
apps/mana/apps/web/src/routes/(app)/library/
├── +page.svelte                # Grid mit KindTabs
├── [kind]/+page.svelte         # Deep-Link: /library/books, /library/movies, ...
└── entry/[id]/+page.svelte     # DetailView
```

## UI-Konzept

### Landing (`/library`)

- **Top**: `KindTabs` (Alle | Bücher | Filme | Serien | Comics) mit Count-Badges
- **Sekundärleiste**: Status-Filter-Chips (Geplant | Läuft | Fertig), Sort (Zuletzt fertig | Rating | Titel), Favoriten-Toggle
- **Grid**: Cover-Kacheln mit Titel + Rating + Status-Badge; Click → DetailView
- **FAB**: "+" öffnet `EntryForm` mit Typ-Vorauswahl basierend auf aktivem Tab

### EntryForm

- Zuerst `kind` wählen (wenn nicht vorgegeben)
- Kern-Felder (Titel, Jahr, Creators, Cover, Status, Rating, Tags, Review) sind identisch
- Unter "Details"-Accordion erscheinen typ-spezifische Felder aus `details`
- Cover: entweder URL einfügen oder Upload via bestehende `uload`-Infrastruktur → `coverMediaId`
- Optional (Phase 2): "Vorschlag abrufen" → OpenLibrary/TMDB lookup → füllt Metadaten + Cover vor

### DetailView

- Cover links, Metadaten rechts
- Unten: Review (Markdown, encrypted), Tags, Status-Verlauf
- Für `kind='series'`: eingebetteter `EpisodeTracker` (Staffeln ausklappbar, Episoden abhakbar, Fortschritts-Balken)
- Für `kind='book'`: Seiten-Slider zum Fortschritt, "Buch fertig"-Button setzt `completedAt` + `times++`
- Unten: "Nochmal gelesen/gesehen"-Button → `times++` und `startedAt`/`completedAt` reset (alte Instanz in `notes` im Activity-Log)

## Stats / Jahresrückblick

`queries.ts` liefert:

- `useStats()` → `{ totalByKind, completedThisYear, avgRating, topGenres, currentlyActive }`
- `useStreak(kind)` → "X Bücher in Folge fertig gemacht" (optional)

Diese Daten kann der Dashboard-Widget-Grid anzeigen (vgl. `drink`/`habits`).

## Registrierung (Checklist)

1. `apps/mana/apps/web/src/lib/modules/library/module.config.ts` anlegen
2. Config in `apps/mana/apps/web/src/lib/data/module-registry.ts` importieren + in `MODULE_CONFIGS` aufnehmen
3. Dexie-Schema-Migration: in `apps/mana/apps/web/src/lib/data/database.ts` neue `db.version(N+1).stores({ libraryEntries: 'id, kind, status, userId, completedAt' })` hinzufügen (NICHT bestehende Versionen ändern)
4. Encryption-Registry-Eintrag (siehe oben)
5. Routes unter `(app)/library/` anlegen
6. App-Eintrag in `packages/shared-branding/src/mana-apps.ts`:
   ```typescript
   { id: 'library', name: 'Bibliothek', description: {...}, icon: APP_ICONS.library, color: '#a855f7', status: 'development', requiredTier: 'guest' }
   ```
7. Icon in `packages/shared-branding/src/app-icons.ts` (SVG as data URL)
8. `docs/MODULE_REGISTRY.md` unter "Kreativität & Medien" ergänzen
9. Guest-Seed in `collections.ts` (1 Eintrag pro `kind`, damit neue Nutzer sofort was sehen)
10. Vitest-Tests für store-Mutationen + encryption roundtrip

## AI-Integration (Phase 2)

Nachdem das Modul steht, Tools in `tools.ts` registrieren und in `@mana/shared-ai/src/policy/proposable-tools.ts` aufnehmen:

| Tool | Policy | Beschreibung |
|------|--------|--------------|
| `list_library_entries` | auto | Liefert Einträge gefiltert nach `kind`/`status`, read-only |
| `create_library_entry` | propose | User muss jeden neuen Eintrag bestätigen |
| `complete_library_entry` | propose | Status → `completed`, `completedAt` = heute |
| `rate_library_entry` | propose | Rating setzen |

Missionen wie *"Trage meine letzten 5 gesehenen Filme ein"* können dann über den Runner laufen.

## Offene Fragen

- **Externe Metadata-Quellen**: OpenLibrary (Bücher, frei) + TMDB (Filme/Serien, API-Key nötig) + Comic Vine (Comics, API-Key nötig). Lohnt sich ein neuer `services/mana-metadata`-Service, der die Quellen proxyed, oder reicht ein Endpoint in `apps/api`? Vorschlag: **Endpoint in `apps/api`** zuerst (`/api/v1/library/lookup?kind=...&q=...`), service-Extraktion nur wenn's Crawler-artig wird.
- **Goodreads/Letterboxd-Import**: Phase 3. CSV-Upload reicht fürs erste, später GoodReads-API (sobald die offen ist) oder Screen-Scraping via mana-crawler.
- **Serien-Episoden**: in `details.watched` als flaches Array reicht für die meisten Fälle. Falls detaillierte Episoden-Metadaten (Titel, Runtime) benötigt werden, TMDB-Sync in Phase 2 nachziehen.
- **Audiobooks**: als `kind='book'` mit `details.format='audio'` oder als eigener `kind='audiobook'`? **Vorschlag**: format-Feld. Kernlogik bleibt "Buch".
- **Manga**: in `kind='comic'` einordnen oder separat? **Vorschlag**: comic. Falls Manga-spezifische Features (Chapters statt Issues) wichtig werden, `details` um ein Manga-Variant erweitern.

## Reihenfolge (Milestones)

1. **M1 — Skelett [DONE 2026-04-17]**: types, collections, module.config, Registry-Eintrag, Dexie-Migration (v26), leere Route. *Ziel: App zeigt leeres Modul an, nichts crasht.*
2. **M2 — CRUD**: entries-Store, EntryForm, GridView, DetailView. Manuelles Anlegen/Editieren funktioniert für alle 4 `kind`s. Cover via URL.
3. **M3 — Fortschritt**: Status-Wechsel, Rating, times-Counter, Episode-Tracker für Serien, Seiten-Slider für Bücher. Guest-Seed komplett.
4. **M4 — Cover-Upload**: Integration mit `uload`. Encryption-Registry final.
5. **M5 — Stats + Dashboard-Widget**: useStats, kleiner Widget für Dashboard.
6. **M6 — AI-Tools**: list/create/complete/rate Tools, Shared-AI-Policy.
7. **M7 — Metadata-Lookup**: `/api/v1/library/lookup` gegen OpenLibrary + TMDB.
8. **M8 — Import**: CSV-Upload (Goodreads/Letterboxd-Export-Formate).
