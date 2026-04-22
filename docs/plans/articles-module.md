# Articles — Module Plan

## Status (2026-04-21)

**M1 Skelett: DONE** (commit `3357e88a1`) — Modul registriert, Dexie v33, Encryption-Registry-Einträge (articles + articleHighlights verschlüsselt, articleTags auf Plaintext-Allowlist als FK-Junction ins globale Tag-System), App-Registry + orangefarbenes Icon, Route mountet, Empty-State ListView.

**M2 URL-Save + Reader: DONE** (commit `3357e88a1`) — `POST /api/v1/articles/extract` (ein Endpoint statt zwei — Client cached die Preview und vermeidet doppelten Server-Fetch), AddUrlForm mit scope-aware Dedupe, DetailView mit ReaderView (Serif/Sans, Light/Sepia/Dark, Size-Slider), auto-getrackter Reading-Progress mit Scroll-Restore.

**M3 Highlights: DONE** (commit `3357e88a1`) — TreeWalker-basierte Plain-Text-Offset-Resolution (`lib/offsets.ts`), `highlightsStore`, Floating `HighlightMenu` mit Create/Edit-Modi, `HighlightLayer`-Orchestrator der Overlays bei jedem Highlights- oder HTML-Change unwrap+re-applies (Range.surroundContents pro Text-Node-Slice). Vier Farben mit Dark-Mode-angepassten Alpha-Werten.

**M4 Tags + Filter: DONE** (commit `04293ed5e`) — `useArticleTagIds` / `useArticleTagMap` Live-Queries gegen `articleTagOps`. DetailView bekommt `<TagField>` aus `@mana/shared-ui` mit globalem Tag-Pool; `onChange` → `articleTagOps.setTags(id, ids)`. ListView: 6 Filter-Chips (Alle / Ungelesen / In Arbeit / Gelesen / Favoriten / Archiv) mit Live-Counts, `<TagChip>` auf jeder Karte, neue `.status-reading`-Pill, Favoriten-Stern.

**M5 Migration von news:type='saved': DONE** (commit `04293ed5e`) — Boot-gated Migration in `modules/articles/migrations/from-news.ts` (localStorage-Sentinel `mana:articles:from-news-migration:v1`), decrypt→re-encrypt zwischen den beiden Field-Allowlists, Status-Mapping `isArchived→archived` / `isRead→finished` / sonst `unread`, Source-Rows werden soft-deletet. News-Code deprecated: `saveFromUrl` + `extractFromUrl` entfernt, `save_news_article` AI-Tool behält seinen Namen (wegen Mission-History) und leitet intern aufs `articles`-Modul um. `/news/add` + `/news/saved` sind Redirects. `news-research` „Speichern"-Buttons routen auf `/articles/[id]`.

**M6 AI-Tools: DONE** (commit `5924f4fac`) — 5 neue Einträge im `AI_TOOL_CATALOG` (`shared-ai/src/tools/schemas.ts`): `list_articles` (auto), `save_article` / `archive_article` / `tag_article` / `add_article_highlight` (alle propose). `modules/articles/tools.ts` enthält die `execute`-Funktionen, registriert in `data/tools/init.ts`. `tag_article` dedupliziert case-insensitive über den globalen Pool und legt Tags via `tagMutations.createTag` an falls nötig. `add_article_highlight` snappt auf die erste wörtliche Fundstelle in `article.content` und lehnt den Call ab wenn der Text nicht exakt vorkommt (kein Orphan-Highlight). Policy/Executor/Server-Planner leiten sich automatisch aus dem Katalog ab.

**Hinweis AiProposalInbox:** Der apps/mana/CLAUDE.md-Abschnitt erwähnt `<AiProposalInbox module="articles" />` als Inline-Mount, aber die Komponente existiert im aktuellen Codebase nicht — nach dem `pendingProposals`-Table-Drop in Dexie v29 wurde die Proposal-Darstellung auf `server-iteration-staging` + den Cross-Module-Inbox im Mission-Detail-View umgestellt. Articles-Proposals tauchen dort automatisch auf. Falls die Inline-Komponente wieder reaktiviert wird, muss nur der Mount in `ListView.svelte` ergänzt werden.

**M7 Share-Target + Bookmarklet: DONE** (commit `8a991f7c3`) — `@mana/shared-pwa` bekommt neue Types (`PWAShareTarget`, `PWAShareTargetParams`), `createPWAConfig` threadet `shareTarget` in den Manifest, `ManifestConfig.share_target?` ergänzt. Web-App: `vite.config.ts` setzt `shareTarget: { action: '/articles/add', method: 'GET', params: { title, text, url } }`; `AddUrlForm` liest Query-Params in `onMount` (inkl. URL-Regex-Fallback auf `text` weil Chrome Android / WhatsApp den Link dort reinstecken), triggert auto-Vorschau. Neue Route `/articles/settings` rendert Bookmarklet-Karte (Drag-to-Bookmark + Copy-Snippet + expandable Quellcode) und Share-Target-Erklärung. `ListView` bekommt Zahnrad-Button zum Settings-Aufruf.

Nicht im Scope (bewusst ausgelassen): die „optional" im Plan markierte `_pendingUrls`-Offline-Queue. Kann als M7b nachgereicht werden wenn das Problem auftaucht.

**M8 HighlightsView + Stats + Dashboard-Widget: DONE** (commit pending) — `queries.ts` bekommt `useStats()` (total, pro-Status, savedThisWeek, finishedThisWeek, topSites, totalHighlights) und `useAllHighlights()` (chronologisch, joined mit Artikel-Header-Info). Neue Route `/articles/highlights` mountet `HighlightsView.svelte`: Highlights pro Artikel gruppiert, farbige Akzent-Striche, Click-to-Reader, Copy-Markdown + Download-.md via `lib/markdown-export.ts` (pure Funktion, unit-testbar). Dashboard-Widget `ArticlesUnreadWidget` zeigt Top-3 unread + Stats-Strip; registriert in `widget-registry.ts`, `dashboard.ts` `WidgetType`-Union + `WIDGET_REGISTRY`; i18n-Keys in de.json + en.json (fr/it/es konsistent mit anderen Widgets weggelassen). ListView bekommt ✎-Button zum Highlights-Aufruf neben dem Settings-Zahnrad.

Damit ist der komplette M1–M8-Scope aus diesem Plan umgesetzt. Phase-3-Kandidaten (Highlight→Note-Export mit Backlink, Full-Text-Search, Mercury/archive.org-Fallback, Jahresrückblick) bleiben offen für spätere Iterationen.

## Ziel

Ein dediziertes Pocket-/Instapaper-Ersatzmodul: der Nutzer speichert beliebige Web-URLs, der Inhalt wird serverseitig mit Readability extrahiert, landet verschlüsselt in IndexedDB und ist danach **offline lesbar** im eigenen Reader-View — mit Highlights, Tags, Notizen und Reading-Progress.

Kernfrage: *„Ich will diesen Artikel später in Ruhe lesen."*

Nicht im Scope: Web-Browser-Extension mit automatischem Save (kommt in M7 als PWA-Share-Target/Bookmarklet), Social-Features, Public-Sharing, Full-Text-Search-Index. Kein Highlights-Export in andere Tools (Phase 3).

## Abgrenzung zu bestehenden Modulen

- **`news`**: bleibt der **kuratierte Feed** aus dem server-seitigen `curated_articles`-Pool + Reaktionen/Preferences. Die dortige `type: 'saved'`-Funktion (ad-hoc URL-Save) wird auf `articles` migriert und im News-Modul deprecated. `/news/saved` entfällt, `/news/add` fällt weg (Redirect auf `/articles/add`).
- **`library`**: konsumierte Medien (Bücher, Filme, Serien, Comics). Keine Web-Artikel.
- **`guides`**: eigene strukturierte Schritt-für-Schritt-Anleitungen. Kein Web-Extract.
- **`notes`**: freie Notizen, kein Web-Extract + Reader-View.
- **`kontext`**: URL-Crawl für AI-Kontext (Singleton-Doc, nicht pro Artikel). Überlappt nicht.

## Entscheidungen vorab

- **Name `articles` + appId `articles`** (nicht `pocket` — markenneutral, klar, generisch).
- **Shared Extract statt neuem Code:** `@mana/shared-rss` bietet bereits `extractFromUrl()` (Readability + JSDOM, siehe `packages/shared-rss/src/extract.ts`). Beide Module nutzen dasselbe Package. Kein Refactor der Bibliothek nötig.
- **Eigener API-Endpoint:** `/api/v1/articles/extract/preview` + `/api/v1/articles/extract/save` in `apps/api/src/modules/articles/routes.ts` — dupliziert einen kleinen Handler, damit das articles-Modul nicht auf `news/routes.ts` angewiesen ist. Die eigentliche Extraktion passiert weiterhin in `shared-rss`.
- **Drei Tabellen statt einer:**
  - `articles` — Haupttabelle (extrahierter Inhalt + Reading-State)
  - `articleHighlights` — pro Highlight eine Row (Offset-Range + optionale Notiz)
  - `articleTags` — reine **Junction-Tabelle** `(id, articleId, tagId)` ins globale Tag-System
  Begründung: Highlights brauchen eigene Write-Pfade (Select → Save) und eigene Encryption-Felder. Tags **sind bereits global** als Kern-Infra (`globalTags`/`tagGroups` mit `appId: 'tags'`, siehe `apps/mana/apps/web/src/lib/modules/core/module.config.ts`) — jedes Modul hält nur eine schlanke Junction. Kein eigener Name/Farbe/Sortierung — das lebt zentral.
- **`originalUrl` bleibt plaintext.** Dedupe-Key, gleiche Begründung wie bei `newsArticles.originalUrl` und `uLoad.links.originalUrl` in der Encryption-Registry.
- **Content + Titel + Excerpt + Author + Highlights + Notizen bleiben verschlüsselt.** Reading-Behavior ist GDPR-sensitiv — gleiche Schutzklasse wie `newsArticles`.
- **Kein Client-side Extract im ersten Schritt.** JSDOM läuft nur serverseitig. Offline-gepuffertes Save-Later (z.B. aus PWA-Share-Target ohne Internet) geht in eine lokale `_pendingUrls`-Queue und wird beim nächsten Online-Sync extrahiert. Das kommt in M7.
- **Migration der `news`-saved-Rows:** einmaliger Upgrade-Hook in der Dexie-Schema-Migration — alle `newsArticles` mit `type='saved'` wandern nach `articles`. Danach kann die News-Types um das `type`-Discriminator-Feld und den `saveFromUrl`-Pfad verschlankt werden.

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/articles/
├── types.ts                    # LocalArticle, LocalHighlight, LocalTag, public DTOs
├── collections.ts              # articleTable, highlightTable, tagTable + Defaults
├── queries.ts                  # useAllArticles, useArticle(id), useHighlights(articleId), useTags, toArticle/toHighlight/toTag
├── api.ts                      # fetch wrappers for /api/v1/articles/extract/*
├── stores/
│   ├── articles.svelte.ts      # saveFromUrl, markRead, toggleFavorite, archive, setProgress, delete
│   ├── highlights.svelte.ts    # addHighlight, updateHighlightNote, deleteHighlight
│   └── tags.svelte.ts          # Vier-Zeiler: re-export aus @mana/shared-stores + articleTagOps = createTagLinkOps({...})
├── components/
│   ├── ArticleCard.svelte      # Listeneintrag (Cover + Titel + Excerpt + Reading-Time + Status-Badge)
│   ├── AddUrlForm.svelte       # URL-Paste + Preview + Save
│   ├── ReaderView.svelte       # Reader-Typografie (Serif/Sans, Größe, Zeilenhöhe, Sepia/Dunkel)
│   ├── HighlightLayer.svelte   # Overlay für bestehende Highlights + Selection-Handler
│   ├── HighlightMenu.svelte    # Floating-Menu bei Text-Selection (Farbe + Notiz + Save)
│   ├── TagPicker.svelte        # Multi-Select mit Inline-Create
│   ├── TagChip.svelte          # Farbige Chip-Darstellung
│   ├── ProgressBar.svelte      # Reading-Fortschritt (0..1)
│   └── StatusFilter.svelte     # Alle | Ungelesen | Favoriten | Archiv
├── views/
│   ├── ListView.svelte         # Modul-Root (List + Filter + FAB)
│   ├── DetailView.svelte       # Reader-View + Highlight-Layer + Tag/Action-Bar
│   └── HighlightsView.svelte   # Sammelansicht über alle Artikel (Phase 2)
├── tools.ts                    # AI-Tools — siehe AI-Integration
├── constants.ts                # READER_FONTS, READER_THEMES, DEFAULT_HIGHLIGHT_COLORS
├── module.config.ts            # { appId: 'articles', tables: [...] }
└── index.ts                    # Re-Exports
```

## Daten-Schema

### `LocalArticle`

```typescript
export type ArticleStatus = 'unread' | 'reading' | 'finished' | 'archived';

export interface LocalArticle extends BaseRecord {
  originalUrl: string;                    // plaintext — Dedupe-Key
  title: string;                          // encrypted
  excerpt: string | null;                 // encrypted
  content: string;                        // encrypted — plain text (fallback)
  htmlContent: string | null;             // encrypted — sanitisiertes HTML (Reader)
  author: string | null;                  // encrypted
  siteName: string | null;                // plaintext — Filter (nach Quelle gruppieren)
  imageUrl: string | null;                // plaintext — Externe URL / media-Ref
  wordCount: number | null;               // plaintext — Reading-Time, Stats
  readingTimeMinutes: number | null;      // plaintext
  publishedAt: string | null;             // plaintext ISO — Sort/Filter
  // Reading-State
  status: ArticleStatus;                  // plaintext — Haupt-Filter
  readingProgress: number;                // plaintext 0..1 — Scroll-Position beim Re-Open
  isFavorite: boolean;                    // plaintext
  savedAt: string;                        // plaintext ISO
  readAt: string | null;                  // plaintext ISO — wann zuerst „finished"
  // Organisation — KEIN tagIds: string[] direkt auf dem Record.
  //   Tag-Zuordnung lebt ausschließlich in der Junction-Tabelle `articleTags`.
  //   Gelesen via `articleTagOps.getTagIds(id)` / `getTagIdsForMany(ids)`.
  userNote: string | null;                // encrypted — freie Notiz des Users zum Artikel
  // Meta
  extractedVersion: number;               // plaintext — falls wir später re-extrahieren
}
```

### `LocalHighlight`

```typescript
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export interface LocalHighlight extends BaseRecord {
  articleId: string;                      // plaintext — FK, indexed
  text: string;                           // encrypted — der markierte Text
  note: string | null;                    // encrypted — optionale Notiz
  color: HighlightColor;                  // plaintext
  /** Offsets ins extrahierte `content`-Feld (Plain-Text-Offset). HTML-Rendering
   *  mapped im HighlightLayer von Plain-Offset → DOM-Range. */
  startOffset: number;                    // plaintext
  endOffset: number;                      // plaintext
  /** Kontext-Snippet (ca. 50 chars vorher/nachher), falls das Article-Content
   *  später re-extrahiert wird und die Offsets verrutschen — dann kann man
   *  anhand des Snippets re-anchorn. */
  contextBefore: string | null;           // encrypted
  contextAfter: string | null;            // encrypted
}
```

### `articleTags` (Junction → globalTags)

Keine eigene Tag-Entity. Schema ist identisch zu `noteTags`, `eventTags`, `contactTags` etc.:

```typescript
export interface LocalArticleTag {
  id: string;
  articleId: string;
  tagId: string;            // FK → globalTags.id
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}
```

Tag-Namen, Farben, Gruppen leben zentral in `globalTags` / `tagGroups` und werden via `@mana/shared-stores`-Helpers abgefragt (`useAllTags`, `getTagById`, `getTagsByIds`, `getTagColor`, `tagMutations`).

### Dexie-Indizes

```typescript
// apps/mana/apps/web/src/lib/data/database.ts — neue Version N+1:
articles: 'id, userId, status, savedAt, isFavorite, siteName, originalUrl',
articleHighlights: 'id, userId, articleId, [articleId+startOffset]',
articleTags: 'id, userId, articleId, tagId, [articleId+tagId]',
```

- `originalUrl` indexiert für O(1)-Dedupe beim Save.
- `[articleId+startOffset]` für sortierten Highlight-Render im Reader.
- `status` für den Main-Filter (Unread/Reading/Finished/Archived).
- `[articleId+tagId]` matcht das Pattern aller anderen Tag-Junctions (N+1-freies Batch-Read via `getTagIdsForMany`).

### Encryption-Registry

`apps/mana/apps/web/src/lib/data/crypto/registry.ts` — drei neue Einträge:

```typescript
// ─── Articles ────────────────────────────────────────────
// Pocket-style read-it-later. Same sensitivity class as newsArticles —
// reading behaviour is GDPR-relevant. originalUrl stays plaintext
// (dedupe key, same rationale as newsArticles.originalUrl / links.originalUrl).
// siteName plaintext for the "group by source" view.
articles: entry<LocalArticle>(['title', 'excerpt', 'content', 'htmlContent', 'author', 'userNote']),
// Highlights carry the marked text + an optional user note. The article
// FK stays plaintext (indexed for range scans in the reader). Offsets +
// color are structural. Context snippets are fragments of encrypted
// content and are therefore themselves encrypted.
articleHighlights: entry<LocalHighlight>(['text', 'note', 'contextBefore', 'contextAfter']),
// articleTags ist NICHT registriert — pure FK-Junction (articleId, tagId),
// zero user-typed content. Gleicher Pattern wie noteTags, eventTags,
// contactTags, placeTags, manaLinks: Tag-Namen leben in globalTags und
// haben dort ihre eigene Encryption-Policy. Eintrag in plaintext-allowlist.ts.
```

## Routing

```
apps/mana/apps/web/src/routes/(app)/articles/
├── +page.svelte                # ListView
├── add/+page.svelte            # AddUrlForm — paste URL → preview → save
├── [id]/+page.svelte           # DetailView (Reader + Highlights)
└── highlights/+page.svelte     # HighlightsView (Phase 2)
```

Deep-Links:
- `/articles?status=unread` — vorgefilterte Liste
- `/articles?tag=<tagId>` — nach Tag gefiltert
- `/articles/add?url=...` — aus externem Share-Target (M7) vorbefüllt

## UI-Konzept

### Landing (`/articles`)

- **Top-Bar:** Status-Filter-Segmented-Control (Alle | Ungelesen | In Arbeit | Favoriten | Archiv), Tag-Chips horizontal scrollbar, Sort (Neu gespeichert | Lesezeit | Titel).
- **Liste:** Kachel- oder Zeilen-View (Toggle). Kachel zeigt Cover (16:9), Titel, Excerpt (2 Zeilen), Site-Name, Reading-Time, Status-Badge. Zeile kompakter.
- **FAB:** „+" öffnet `/articles/add`.
- **Empty-State:** „Noch nichts gespeichert" + CTA „Erste URL einfügen" (+ SceneScopeEmptyState wenn Scope aktiv — gleiches Pattern wie andere Module).

### AddUrlForm (`/articles/add`)

- URL-Input (groß, Autofocus).
- „Vorschau abrufen" → Call auf `/api/v1/articles/extract/preview` → zeigt Titel, Excerpt, Cover, Lesezeit.
- „Speichern" → Call auf `/extract/save` + `articlesStore.saveFromUrl(url)`.
- Dedupe: beim Paste sofort `articleTable.where('originalUrl').equals(url).first()` — wenn bereits vorhanden, statt Save direkt auf bestehenden Artikel routen.
- Optional im selben Dialog: Tags vor dem Speichern setzen, Notiz hinzufügen.

### DetailView (`/articles/[id]`)

- **Header:** Titel, Author, Site-Name, Published-Date, Wordcount/Lesezeit.
- **Reader-Body:** rendert `htmlContent` mit sanitisierendem DOMPurify durch eine Reader-Typografie-Schale (Serif-Default, konfigurierbar Größe/Zeilenhöhe/Theme).
- **Action-Bar (sticky):**
  - Als gelesen markieren / entmarkieren
  - Favorit-Toggle
  - Archivieren
  - Tags-Picker
  - „Original öffnen" (external link)
  - Notiz
  - Löschen
- **Highlight-Layer:**
  - Bei Text-Selection erscheint `HighlightMenu` mit 4 Farben + Notiz-Feld.
  - Beim Save: `highlightsStore.addHighlight({ articleId, text, startOffset, endOffset, color, contextBefore, contextAfter })`.
  - Bestehende Highlights werden beim Render als gefärbte Spans überlagert (Plain-Text-Offset → DOM-Range-Resolver).
- **Reading-Progress:** Scroll-Event setzt throttled `articlesStore.setProgress(id, progress)`; beim nächsten Öffnen springt der View auf die letzte Position zurück.
- **Bottom-Drawer (Phase 2):** alle Highlights dieses Artikels in einer Liste, klickbar → springt zur Stelle.

### HighlightsView (`/articles/highlights`, Phase 2)

Sammelansicht: alle Highlights über alle Artikel chronologisch oder nach Artikel gruppiert, mit Notizen + Quell-Link zurück zum Artikel. Export als Markdown (Plain-Text-Export, kein Share).

## Registrierung (Checklist)

1. `apps/mana/apps/web/src/lib/modules/articles/module.config.ts` anlegen:
   ```typescript
   export const articlesModuleConfig: ModuleConfig = {
     appId: 'articles',
     tables: [
       { name: 'articles' },
       { name: 'articleHighlights', syncName: 'highlights' },
       { name: 'articleTags', syncName: 'tags' },
     ],
   };
   ```
2. Config in `apps/mana/apps/web/src/lib/data/module-registry.ts` importieren + in `MODULE_CONFIGS` aufnehmen.
3. Dexie-Schema-Migration: neue `db.version(N+1).stores({ articles: '...', articleHighlights: '...', articleTags: '...' })` + `.upgrade()`-Hook, der `newsArticles` mit `type='saved'` nach `articles` kopiert (siehe Migration unten).
4. Encryption-Registry — drei Einträge (siehe oben). Unit-Test für Crypto-Roundtrip.
5. Routes unter `(app)/articles/` anlegen.
6. App-Registry-Eintrag in `packages/shared-branding/src/mana-apps.ts`:
   ```typescript
   {
     id: 'articles',
     name: 'Artikel',
     description: { de: 'Später lesen', en: 'Read Later' },
     longDescription: {
       de: 'Speichere Web-Artikel und lies sie später offline — mit Highlights, Tags und Notizen.',
       en: 'Save web articles and read them offline later — with highlights, tags, and notes.',
     },
     icon: APP_ICONS.articles,
     color: '#ef4444', // oder ein anderes Rot/Orange, anti-News (Grün)
     status: 'development',
     requiredTier: 'guest',
   }
   ```
7. Icon in `packages/shared-branding/src/app-icons.ts` (SVG als Data-URL — Lesezeichen-Form o.ä.).
8. API-Modul in `apps/api/src/modules/articles/routes.ts` + Mount unter `/api/v1/articles`.
9. `docs/MODULE_REGISTRY.md` unter „Produktivität & Wissen" ergänzen.
10. `docs/PORT_SCHEMA.md` prüfen — neuer Endpoint bekommt keinen neuen Port, läuft im bestehenden `apps/api`.
11. Vitest-Tests:
    - Store-Mutationen (save, highlight, tag)
    - Encryption-Roundtrip (alle drei Tabellen)
    - Dedupe-Pfad in `saveFromUrl`
    - Offset-Mapping im HighlightLayer (unabhängig von DOM)
12. Playwright-Happy-Path (M2 Ende): Artikel speichern → öffnen → Reader sichtbar → Highlight setzen → Tag vergeben → als gelesen markieren.

## Migration von `news`-saved-Rows

Einmaliger Upgrade-Hook in der Dexie-Migration, die `articles` einführt:

```typescript
db.version(N+1).stores({ articles: '...', articleHighlights: '...', articleTags: '...' })
  .upgrade(async (tx) => {
    const saved = await tx.table('newsArticles').where('type').equals('saved').toArray();
    for (const old of saved) {
      await tx.table('articles').add({
        id: crypto.randomUUID(),   // neue ID, alte bleibt verwaist im newsArticles für Sync-Sauberkeit
        originalUrl: old.originalUrl,
        title: old.title,
        excerpt: old.excerpt,
        content: old.content,
        htmlContent: old.htmlContent,
        author: old.author,
        siteName: old.siteName,
        imageUrl: old.imageUrl,
        wordCount: old.wordCount,
        readingTimeMinutes: old.readingTimeMinutes,
        publishedAt: old.publishedAt,
        status: old.isRead ? 'finished' : (old.isArchived ? 'archived' : 'unread'),
        readingProgress: 0,
        isFavorite: old.isFavorite ?? false,
        savedAt: old.createdAt,
        readAt: old.isRead ? old.updatedAt : null,
        tagIds: [],
        userNote: null,
        extractedVersion: 1,
        userId: old.userId,
        createdAt: old.createdAt,
        updatedAt: new Date().toISOString(),
      });
      // Alte Row soft-deleten, damit sie nicht mehr im /news/saved auftaucht
      // und der Sync-Engine den Delete propagiert:
      await tx.table('newsArticles').update(old.id, {
        deletedAt: new Date().toISOString(),
      });
    }
  });
```

**Hinweis Encryption:** Die `newsArticles`-Rows sind beim Upgrade-Hook-Lauf **noch verschlüsselt** (Dexie-Upgrade läuft unterhalb der Store-Abstraktion). Zwei Optionen:

- **A (bevorzugt):** Migration läuft nicht im `.upgrade()`, sondern als Boot-Task *nach* Crypto-Init — in `apps/mana/apps/web/src/lib/data/migrations/articles-from-news.ts` mit einer `_migrationFlags`-Dexie-Tabelle, die markiert, dass die Migration einmal lief. Dann ist `decryptRecords` verfügbar und die Daten wandern korrekt decrypted → re-encrypted unter den neuen Feld-Allowlists.
- **B:** Migration bei der *Store-Ebene* — beim ersten Mount von `/articles` einmalig ausführen. Einfacher, aber User sieht beim ersten Öffnen eine kurze Ladephase.

Empfehlung: **A**. Entkoppelt Dexie-Version von der Crypto-abhängigen Daten-Bewegung; folgt demselben Muster wie die `companion` → `ai-agents`-Migration.

**Nach-Migration im `news`-Modul:**
- `saveFromUrl` in `articles.svelte.ts` (news) entfernen.
- `type: 'curated' | 'saved'` → `type: 'curated'` (Discriminator entfällt, da alle Rows curated sind).
- Route `/news/add` → Redirect auf `/articles/add`.
- Route `/news/saved` entfällt (oder redirectet auf `/articles?status=unread`).
- AI-Tool `save_news_article` bleibt als **Alias** für `save_article` (ruft intern `articlesStore.saveFromUrl`). Begründung: bestehende Missionen/Workbench-Events in der DB beziehen sich auf den Namen — hartes Löschen würde historische Iterations brechen.

## AI-Integration

Tools in `apps/mana/apps/web/src/lib/modules/articles/tools.ts` + Katalog-Eintrag in `@mana/shared-ai/src/tools/schemas.ts` (Single Source of Truth — webapp + mana-ai leiten daraus ab):

| Tool                    | Policy  | Beschreibung                                                         |
|-------------------------|---------|----------------------------------------------------------------------|
| `list_articles`         | auto    | Filter nach `status`/`tag`, read-only; für Recherche-Missionen.     |
| `save_article`          | propose | URL → Readability-Extract → User bestätigt im Proposal-Dialog.       |
| `archive_article`       | propose | Status → `archived`.                                                 |
| `tag_article`           | propose | Tag-ID(s) setzen.                                                    |
| `add_article_highlight` | propose | Textausschnitt + optionale Notiz; User bestätigt Stelle + Farbe.    |

Der Runner injiziert `articles` in der Pool-Filterung zusätzlich zu `news`/`news-research`, damit Missionen wie *„Speichere die drei meistzitierten Artikel zu Thema X"* nativ gehen.

`AiProposalInbox` wird im `/articles` Hauptview eingebettet (`<AiProposalInbox module="articles" />`) — gleiches Pattern wie `/todo`, `/calendar`, `/places`.

## Scene Scope

Standardpattern wie in library/notes: `scopeTagIds` auf der aktiven Scene filtert Artikel via `filterBySceneScopeBatch`. Wenn der Scope alles ausblendet → `<ScopeEmptyState label="Artikel" />` anzeigen.

## Cross-Modul-Hooks

- **Tags:** articles klinkt sich in das **globale Tag-System** ein (`globalTags` + `tagGroups` unter `appId: 'tags'`). Derselbe Tag-Pool wie notes/calendar/contacts/chat/picture/places/… — Umbenennen und Farbwechsel propagieren automatisch. Scene-Scope via `scopeTagIds` funktioniert sofort, ohne zusätzlichen Code (gleicher Tag-Raum).
- **Notizen aus Highlights:** Später (Phase 3) Button „Highlight als Note speichern" → erzeugt `note` im notes-Modul mit Backlink.
- **Goals:** „X Artikel pro Woche lesen" kann der goals-Modul über die `completedAt`-Äquivalent `readAt` abfragen (cross-module-mechanik wie bei library).

## Offene Fragen

- **Site-Favicon als Source-Indikator:** lohnt sich der Aufwand (Favicon fetch + cache)? Für M1/M2 weglassen, aus `siteName` Text-Badge rendern. Kommt ggf. in M6+.
- **Kein Content-Refresh:** was, wenn ein Artikel aktualisiert wurde? Vorschlag: Button „neu extrahieren" im Detail-View, setzt `extractedVersion++`, Highlights bleiben per Kontext-Snippet re-anchored. Erste Version: keine automatische Aktualisierung.
- **PDF/Mobilizer:** Paywall-Artikel → kein Extract. Erste Version: Fehlermeldung „nicht extrahierbar" + Link zum Original. Mercury-/archive.org-Fallback später.
- **YouTube/Video:** URLs mit YouTube/Vimeo → out-of-scope oder als Special-Case mit Title+Description+Embed? **Vorschlag:** Für M1 kein Special-Case, `extractFromUrl` liefert `null` → Fehler. Wenn Bedarf, separater Handler in `shared-rss`.
- **Share-Target Trigger:** PWA-Manifest braucht `share_target`-Eintrag (Web Share Target Level 2). Funktioniert nur für installierte PWAs auf Android/Chromium. Für iOS bleibt Bookmarklet.
- **Encryption-Phase für Migrations-Pfad:** wenn der User zero-knowledge-Mode hat, ist der Crypto-State beim Boot erst verfügbar, sobald das Recovery-Code-Unlock passiert. Migration muss dahinter laufen — siehe DATA_LAYER_AUDIT.md §Encryption Rollout.

## Milestones

1. **M1 — Skelett**: types, collections, module.config, Registry-Einträge, Dexie-Migration (Tabellen anlegen, **noch keine** news-Migration), API-Modul leer, Routes mit Empty-State. App registry + Icon. *Ziel: `/articles` mountet, zeigt „Noch nichts gespeichert", nichts crasht, encryption-Audit grün.*
2. **M2 — URL-Save + Reader**: AddUrlForm, `/api/v1/articles/extract/*`, `articlesStore.saveFromUrl`, ArticleCard-Liste, DetailView mit Reader-Typografie (Serif default + Size-Slider + Light/Dark/Sepia). *Ziel: manueller Workflow „URL einfügen → lesen" geht durchgängig, offline-reload funktioniert.*
3. **M3 — Highlights**: HighlightLayer, HighlightMenu, `highlightsStore`, Offset-Resolver. *Ziel: Text markieren + Notiz anheften + beim Re-Open wieder sehen.*
4. **M4 — Tags + Filter + Progress**: `articleTagOps` + TagPicker (re-use bestehender Komponenten aus notes/calendar wenn vorhanden, sonst minimal neu), Status-Filter-Chips in ListView, Reading-Progress-Scroll-Restore, Favorit-Toggle, Archivieren. *Ziel: Volle organisatorische UX steht.* Kleiner Scope als ursprünglich geplant — kein Tag-CRUD im Modul (gehört ins globale Tag-System).
5. **M5 — Migration von news:type='saved'**: Boot-Migration nach Option A, News-Code-Deprecation (`saveFromUrl` raus, Route-Redirects, AI-Tool-Alias). *Ziel: Alle bestehenden saved-Artikel im neuen Modul, `/news/saved` leer/redirect.*
6. **M6 — AI-Tools**: list/save/tag/highlight/archive Tools, Katalog-Eintrag, Policy, AiProposalInbox-Mount. *Ziel: Missionen können URLs speichern und taggen.*
7. **M7 — Share-Target + Bookmarklet**: PWA-Manifest `share_target` + Bookmarklet-Snippet in Settings (`javascript:` → öffnet `/articles/add?url=...`). Offline-Queue für Share ohne Internet (`_pendingUrls`). *Ziel: „Seite im Browser → drei Clicks → in Mana gespeichert" geht.*
8. **M8 — HighlightsView + Stats + Dashboard-Widget**: `/articles/highlights` Sammelansicht, Markdown-Export, `useStats()` (Artikel/Woche, gelesen/gespeichert, Lieblings-Sites), Dashboard-Widget „Ungelesene Artikel" im widget-grid. *Ziel: Modul steht auf Augenhöhe mit notes/library auf dem Dashboard.*

Phase-3-Kandidaten (kein fester Milestone):
- Highlight → Note-Export mit Backlink
- Full-Text-Search (sqlite-wasm oder Dexie-Minisearch)
- Mercury/archive.org-Fallback für Paywalls
- Goodreads-ähnlicher Jahresrückblick („Du hast 142 Artikel gelesen, 28 Stunden Lesezeit …")
