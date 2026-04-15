# News Research — Module Plan

## Status (2026-04-15)

Planung. Noch kein Code. Geschwistermodul zu `news/`, teilt Low-Level-Primitives, eigene Pipeline.

## Ziel

Ein **Research-Tool**, das zu einem Thema passende RSS-Feeds findet, sie filtert, die Artikel nach Relevanz durchsucht und das Ergebnis als **KI-Kontext-Paket** ausliefert. Agent-facing, nicht consumer-facing.

**Abgrenzung zum bestehenden `news/`-Modul:**
- `news/` = kuratierter Consumer-Feed, persistent, verschlüsselt, synced, Lern-Reaktionen.
- `news-research/` = Discovery + Query, ephemer pro Session, eigenes Scoring (Relevanz statt Recency).
- **Brücke**: "Save article" → landet in der bestehenden `newsArticles`-Tabelle (type='saved'). Einzige Reading-List bleibt dort.
- **Brücke**: "Pin feed" → persistiert einen entdeckten Feed in `customFeeds` (Preferences-Erweiterung) — damit ist gleichzeitig die eigene RSS-Abo-Funktion abgedeckt, die zuvor im `news/`-Modul fehlte.

## Shared Primitives zuerst

Vor dem Modul: **`packages/shared-rss`** (neues Workspace-Package) extrahieren.

- `parseFeed(url | xml)` — RSS/Atom Parser (wandert aus `services/news-ingester`)
- `extractArticle(url, html?)` — Readability-Fallback (wandert aus `apps/api/src/modules/news/routes.ts`)
- `discoverFeeds(siteUrl)` — neu: `<link rel="alternate" type="application/rss+xml">`-Discovery + Sitemap-Heuristik
- `validateFeed(url)` — Health-Check (fetchbar, parsebar, min. N Items)
- Typen: `FeedMeta`, `FeedItem`, `ExtractedArticle`

`news-ingester` und der `news/extract`-Endpoint werden migriert, damit nur eine Parser-Implementation existiert.

## Discovery-Strategie (einfache Variante)

Kein Feedly/RSS.app. Alles in-house, zwei Quellen:

1. **Direkte URL**: User pastet Site-URL → Server holt HTML → sucht `<link rel="alternate" type="application/rss+xml">` → validiert → gibt Feed-Metadaten zurück.
2. **Thema-Suche**: Query `"klimawandel" rss` oder ähnlich an eine Websuche (reuse was bei `mana-search`/crawler vorhanden ist), Top-N Ergebnisse filtern → für jedes Top-Result Discovery-Schritt 1 ausführen.

Phase 2 kann später externe APIs hinzufügen.

## Modul-Struktur

```
apps/mana/apps/web/src/lib/modules/news-research/
├── types.ts                 # ResearchSession, DiscoveredFeed, ResearchArticle
├── stores/
│   ├── session.svelte.ts    # Aktuelle Research-Session (ephemer, kein Dexie)
│   └── pinned.svelte.ts     # customFeeds-Verwaltung (persistiert über news-Preferences)
├── engine/
│   ├── relevance.ts         # BM25 / Keyword-Scoring Artikel vs. Query
│   └── filter.ts            # Thema-Filter Feed + Artikel
├── api.ts                   # Client für /api/v1/news-research/*
└── components/              # UI
```

```
apps/api/src/modules/news-research/routes.ts
├── POST /discover           # { query | siteUrl } → DiscoveredFeed[]
├── POST /validate           # { url } → FeedMeta + Sample-Items
├── POST /search             # { feeds[], query, filters } → ScoredArticle[]
└── POST /extract            # { url } → ExtractedArticle (reuse shared-rss)
```

Kein eigener Background-Service. Alles on-demand request/response. Session läuft im Browser-Memory + SessionStorage.

## Data Model

**Ephemer (nur Session):**
```ts
type ResearchSession = {
  id: string
  query: string
  topics: string[]
  discoveredFeeds: DiscoveredFeed[]
  selectedFeedIds: string[]
  results: ScoredArticle[]
  createdAt: number
}
```

**Persistent — Erweiterung von `newsPreferences`:**
```ts
customFeeds: Array<{
  id: string
  url: string
  title: string
  topic?: NewsTopic
  pinnedAt: number
}>
```

Kein neues Dexie-Table. Reading-List-Saves gehen in `newsArticles` wie bisher.

## UI-Flow

1. `/news-research` Landing: Query-Feld + Site-URL-Feld.
2. **Discovery-Ergebnis**: Liste gefundener Feeds (Name, Item-Count, Sample-Topics). User hakt relevante an, kann pinnen.
3. **Filter**: Thema-Chips, Keyword-Filter, Zeitraum.
4. **Ergebnis**: Artikel-Liste sortiert nach Relevanz. Actions pro Artikel: `Save` (→ `newsArticles`), `Open`, `Add to Context`.
5. **Context-Paket**: Button "Export as AI Context" → erzeugt einen strukturierten Markdown-/JSON-Block, der in eine Mission/Chat übernommen werden kann.

## KI-Integration

- Neues LLM-Tool `research_news(query, options)` in `tools.ts` (Geschwister zu `save_news_article`).
- Rückgabe: Context-Paket (Top-N Artikel mit Excerpt + URL + Publish-Date).
- Agent kann eigenständig eine Research-Session fahren, ohne UI.

## Milestones

### M1 — `packages/shared-rss` extrahieren
- [ ] Neues Workspace-Package anlegen
- [ ] Parser aus `news-ingester` verschieben, Service migrieren
- [ ] `extractArticle` aus `apps/api` verschieben, Endpoint migrieren
- [ ] `discoverFeeds` neu implementieren (rel=alternate)
- [ ] `validateFeed` neu

### M2 — API Routes
- [ ] `apps/api/src/modules/news-research/routes.ts` mit `/discover`, `/validate`, `/extract`
- [ ] Websuche-Integration für Query-basierte Discovery
- [ ] `/search` — lädt Feeds parallel, wendet Relevanz-Scoring an

### M3 — Frontend-Modul
- [ ] Modulstruktur + types
- [ ] Session-Store, Pinned-Store
- [ ] `/news-research` Route + UI (Discovery → Filter → Ergebnis)
- [ ] Save-Action in `newsArticles` (reuse `articlesStore.saveFromUrl`)
- [ ] "Export as AI Context"

### M4 — `customFeeds` als Abo-Funktion
- [ ] `newsPreferences.customFeeds` Field + Encryption-Allowlist
- [ ] UI in `news/` zur Verwaltung
- [ ] Optional: `feed-cache` lädt auch `customFeeds` und merged im globalen Feed-Engine

### M5 — KI-Tool
- [ ] `research_news` LLM-Tool
- [ ] Context-Paket-Format dokumentieren
- [ ] Mission-Beispiel in `missions/debug.ts` oder neue Mission

## Offene Fragen

- **Websuche-Backend**: `mana-search` nutzen oder direkt SearXNG/Brave-API? → Entscheidung vor M2.
- **Relevanz-Scoring**: Reicht lokales BM25 über Excerpts, oder Embedding-basiert via `mana-llm`? → Lokal starten, Embeddings als Phase 2.
- **Feed-Caching serverseitig**: Feeds pro Query erneut fetchen (Kaltstart) oder kurzlebiger Redis-Cache? → Ohne Cache starten, messen.
- **Topic-Taxonomie**: Die 7 News-Topics übernehmen oder frei (Tags)? → Frei, mit Vorschlägen aus News-Topics.
