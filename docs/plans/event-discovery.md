# Event Discovery — Implementierungsplan

## Status (2026-04-17)

Planung, noch kein Code.

## Ziel

Eine KI im Events-Modul, die automatisch öffentliche Veranstaltungen in den Regionen des Nutzers findet, strukturiert und als kuratierten Feed vorschlägt. Der Nutzer konfiguriert Städte/Gebiete + Interessen; das System scannt Event-Kalender, Venue-Websites und Vereinsseiten, dedupliziert und rankt nach Relevanz.

## Abgrenzung

- **Eigene Events** (socialEvents, RSVP, Bring-Liste) bleiben unberührt — Discovery ist ein paralleler Read-only-Feed
- **mana-research** wird als Provider-Schicht genutzt (Web-Suche, Extraktion), aber Discovery-Logik lebt in mana-events
- **mana-crawler** wird NICHT direkt genutzt — Firecrawl/Jina über mana-research reichen für Event-Extraktion
- **mana-ai Missions** kommen erst in Phase 3 — Phase 1-2 läuft als dedizierter Cron/API ohne Mission-Runner

---

## Architektur

```
Nutzer (Events-Modul, Tab "Entdecken")
         │
         ▼
  apps/mana web  ──→  mana-events (3065)
                           │
              ┌────────────┼────────────────┐
              ▼            ▼                ▼
      Discovery API   Source Manager    Crawl Scheduler
              │            │                │
              ▼            ▼                ▼
      PostgreSQL      mana-research     mana-geocoding
      (event_discovery   (Web-Suche,      (Region →
       Schema)          Extraktion)       BoundingBox)
```

### Neue DB-Tabellen (PostgreSQL, Schema `event_discovery` in `mana_platform`)

```sql
-- Quellen, die regelmäßig gescannt werden
discovery_sources
  id            uuid PK
  user_id       text NOT NULL          -- Besitzer
  type          text NOT NULL          -- 'ical' | 'website' | 'api' | 'search_query'
  url           text                   -- Feed-URL oder Website-URL
  name          text NOT NULL          -- "Jazzhaus Freiburg", "VHS Konstanz"
  region_id     uuid FK → discovery_regions
  crawl_interval_hours  int DEFAULT 24
  last_crawled_at       timestamptz
  last_success_at       timestamptz
  error_count   int DEFAULT 0
  last_error    text
  is_active     boolean DEFAULT true
  created_at    timestamptz DEFAULT now()
  updated_at    timestamptz DEFAULT now()

-- Regionen des Nutzers
discovery_regions
  id            uuid PK
  user_id       text NOT NULL
  label         text NOT NULL          -- "Freiburg", "Basel"
  lat           double precision
  lon           double precision
  radius_km     int DEFAULT 25
  is_active     boolean DEFAULT true
  created_at    timestamptz DEFAULT now()

-- Nutzer-Interessen für Relevanz-Scoring
discovery_interests
  id            uuid PK
  user_id       text NOT NULL
  category      text NOT NULL          -- 'music' | 'tech' | 'sport' | 'art' | ...
  freetext      text                   -- "Impro-Theater", "Rust Meetups"
  weight        real DEFAULT 1.0       -- Nutzer kann priorisieren
  created_at    timestamptz DEFAULT now()

-- Gefundene Events (dedupliziert, normalisiert)
discovered_events
  id            uuid PK
  source_id     uuid FK → discovery_sources (CASCADE)
  external_id   text                   -- Dedupe-Anker (URL oder Hash)
  dedupe_hash   text NOT NULL          -- sha256(lower(title) + date + location)
  title         text NOT NULL
  description   text
  location      text
  lat           double precision
  lon           double precision
  start_at      timestamptz NOT NULL
  end_at        timestamptz
  all_day       boolean DEFAULT false
  image_url     text
  source_url    text NOT NULL          -- Link zur Original-Seite
  source_name   text                   -- "Jazzhaus Freiburg"
  category      text                   -- LLM-klassifiziert
  price_info    text                   -- "Frei", "12 €", "VVK 15 / AK 18"
  raw_extracted jsonb                  -- Rohdaten der LLM-Extraktion
  crawled_at    timestamptz DEFAULT now()
  expires_at    timestamptz            -- start_at + 1 Tag (für Cleanup)
  UNIQUE(dedupe_hash)                  -- Idempotenz

-- Nutzer-Interaktion mit entdeckten Events
discovery_user_actions
  id            uuid PK
  user_id       text NOT NULL
  event_id      uuid FK → discovered_events (CASCADE)
  action        text NOT NULL          -- 'save' | 'dismiss' | 'hide_source'
  acted_at      timestamptz DEFAULT now()
  UNIQUE(user_id, event_id)

-- Indizes
CREATE INDEX idx_discovered_events_start ON discovered_events(start_at);
CREATE INDEX idx_discovered_events_source ON discovered_events(source_id);
CREATE INDEX idx_discovery_sources_user ON discovery_sources(user_id, is_active);
CREATE INDEX idx_discovery_regions_user ON discovery_regions(user_id);
CREATE INDEX idx_discovery_actions_user ON discovery_user_actions(user_id);
```

### Lokale Tabellen (Dexie) — nur Cache + Offline

Discovery-Daten sind **nicht** local-first (sie entstehen auf dem Server). Dexie dient nur als Offline-Cache:

```
discoveryRegions       — id, label, lat, lon, radiusKm, isActive
discoveryInterests     — id, category, freetext, weight
discoveredEvents       — id, title, description, location, lat, lon,
                         startAt, endAt, sourceUrl, sourceName,
                         imageUrl, category, priceInfo, relevanceScore,
                         userAction (null|save|dismiss), crawledAt
```

Keine Verschlüsselung nötig — das sind öffentliche Event-Daten, keine User-Inhalte.

Kein Sync über mana-sync — der Server ist die Source of Truth, Client pollt/cached.

---

## Phase 1 — Regionen, iCal-Feeds, Discovery-Tab

**Ziel:** Nutzer kann Regionen + iCal-Feeds manuell konfigurieren. Events werden geparst und im "Entdecken"-Tab angezeigt.

### 1.1 Backend: DB-Schema + CRUD-Routen (mana-events)

**Dateien:**

```
services/mana-events/src/db/schema/
  discovery.ts              ← NEU: Drizzle-Schema für alle 5 Tabellen

services/mana-events/src/routes/
  discovery.ts              ← NEU: CRUD für regions, interests, sources
  discovery-feed.ts         ← NEU: Feed-Endpoint (paginiert, gefiltert)

services/mana-events/src/app.ts
  → Neue Routen registrieren unter /api/v1/discovery/*
```

**API-Endpunkte (alle JWT-authentifiziert):**

```
# Regionen
GET    /api/v1/discovery/regions              → [{id, label, lat, lon, radiusKm}]
POST   /api/v1/discovery/regions              ← {label, lat, lon, radiusKm}
PUT    /api/v1/discovery/regions/:id          ← {label?, radiusKm?, isActive?}
DELETE /api/v1/discovery/regions/:id

# Interessen
GET    /api/v1/discovery/interests            → [{id, category, freetext, weight}]
POST   /api/v1/discovery/interests            ← {category, freetext?, weight?}
DELETE /api/v1/discovery/interests/:id

# Quellen (Phase 1: nur iCal)
GET    /api/v1/discovery/sources              → [{id, type, url, name, region, status}]
POST   /api/v1/discovery/sources              ← {type: 'ical', url, name, regionId}
DELETE /api/v1/discovery/sources/:id
POST   /api/v1/discovery/sources/:id/crawl    → Sofort-Crawl auslösen

# Feed
GET    /api/v1/discovery/feed                 → {events: [...], total, hasMore}
       ?from=ISO&to=ISO&category=music&limit=20&offset=0
POST   /api/v1/discovery/feed/:eventId/action ← {action: 'save' | 'dismiss'}
```

### 1.2 Backend: iCal-Parser + Crawl-Loop

**Dateien:**

```
services/mana-events/src/discovery/
  ical-parser.ts            ← iCal → discovered_events (ical.js oder node-ical)
  crawl-scheduler.ts        ← Interval-basierter Crawl-Loop (wie rateBucketSweeper)
  deduplicator.ts           ← sha256(lower(title) + startAt.toISODate() + lower(location))
  types.ts                  ← NormalizedEvent, CrawlResult, SourceStatus
```

**Ablauf eines Crawl-Zyklus:**

```
crawl-scheduler.ts (runs every 15 min)
  │
  ├─ SELECT sources WHERE is_active AND last_crawled_at < now() - interval_hours
  │
  ├─ Für jede fällige Source:
  │   ├─ fetch(source.url) mit 10s Timeout
  │   ├─ ical-parser.ts: VEVENT → NormalizedEvent[]
  │   ├─ deduplicator.ts: dedupe_hash berechnen
  │   ├─ UPSERT INTO discovered_events ON CONFLICT(dedupe_hash)
  │   │   → Bestehende: title/description/location updaten falls geändert
  │   │   → Neue: INSERT
  │   ├─ UPDATE source SET last_crawled_at, last_success_at, error_count=0
  │   └─ Bei Fehler: error_count++, last_error setzen
  │       → Nach 5 Fehlern: is_active = false (Nutzer wird informiert)
  │
  └─ DELETE FROM discovered_events WHERE expires_at < now()
      (Cleanup abgelaufener Events)
```

**Dependency:** `node-ical` (Bun-kompatibel, ~50KB, parst VEVENT/VTODO/VFREEBUSY)

### 1.3 Frontend: Discovery-Tab + Regionen-Setup

**Dateien:**

```
apps/mana/apps/web/src/lib/modules/events/
  discovery/
    api.ts                  ← HTTP-Client (fetchWithAuth, analog events/api.ts)
    types.ts                ← DiscoveredEvent, DiscoveryRegion, DiscoveryInterest, etc.
    queries.svelte.ts       ← Reactive state ($state) für Feed, Regionen, Interessen
    stores.svelte.ts        ← Mutationen (addRegion, addSource, saveEvent, dismissEvent)

  components/
    DiscoveryTab.svelte     ← Der neue Tab-Inhalt
    DiscoverySetup.svelte   ← Onboarding: Regionen + Interessen konfigurieren
    DiscoveredEventCard.svelte  ← Karte mit Titel, Datum, Ort, Quelle, Aktionen
    SourceManager.svelte    ← iCal-Feed-URLs verwalten (hinzufügen, Status, löschen)
    RegionPicker.svelte     ← Stadt-Suche via mana-geocoding + Radius-Slider

  ListView.svelte           ← Tab-Navigation ergänzen: "Meine Events" | "Entdecken"
```

**ListView.svelte — Tab-Erweiterung:**

```svelte
<script>
  let activeTab = $state<'mine' | 'discover'>('mine');
</script>

<div class="tab-bar">
  <button class:active={activeTab === 'mine'} onclick={() => activeTab = 'mine'}>
    Meine Events
  </button>
  <button class:active={activeTab === 'discover'} onclick={() => activeTab = 'discover'}>
    Entdecken
  </button>
</div>

{#if activeTab === 'mine'}
  <!-- bestehender Inhalt (upcoming/past/create) -->
{:else}
  <DiscoveryTab {navigate} />
{/if}
```

**DiscoveryTab.svelte — Aufbau:**

```svelte
{#if !hasRegions}
  <DiscoverySetup onComplete={reload} />
{:else}
  <div class="discovery-controls">
    <RegionPicker regions={regions.value} />
    <CategoryFilter interests={interests.value} />
    <button onclick={refreshFeed}>Aktualisieren</button>
  </div>

  {#if feed.value.length === 0}
    <p class="empty">Noch keine Events gefunden. Füge iCal-Feeds hinzu oder warte auf den nächsten Scan.</p>
  {:else}
    {#each feed.value as event (event.id)}
      <DiscoveredEventCard
        {event}
        onSave={() => actions.save(event.id)}
        onDismiss={() => actions.dismiss(event.id)}
        onOpen={() => window.open(event.sourceUrl, '_blank')}
      />
    {/each}
  {/if}

  <SourceManager sources={sources.value} regionId={activeRegionId} />
{/if}
```

**DiscoveredEventCard.svelte — Felder:**

- Titel (fett)
- Datum + Uhrzeit (formatiert, relativ: "Morgen, 19:00" / "Sa 26. Apr, 20:00")
- Ort + Entfernung zum nächsten Region-Zentrum
- Quelle (Link zur Original-Seite)
- Kategorie-Badge (Musik, Tech, Sport, ...)
- Preis-Info falls vorhanden
- Aktionen: "Merken" (→ eigenes socialEvent anlegen), "Nicht interessant", "Zur Quelle"

**"Merken"-Flow:**

```
Nutzer klickt "Merken"
  → discoveryStore.saveEvent(discoveredEvent)
  → eventsStore.createEvent({
      title: event.title,
      startTime: event.startAt,
      endTime: event.endAt,
      location: event.location,
      description: `${event.description}\n\nQuelle: ${event.sourceUrl}`,
      locationLat: event.lat,
      locationLon: event.lon,
    })
  → POST /api/v1/discovery/feed/:eventId/action {action: 'save'}
  → Karte zeigt "Gespeichert ✓"
```

### 1.4 Module-Integration

**module.config.ts** — Neue Dexie-Tabellen registrieren (Cache-only, kein Sync):

```typescript
// events/module.config.ts — erweitert
tables: [
  { name: 'socialEvents', syncName: 'events' },
  { name: 'eventGuests' },
  { name: 'eventInvitations' },
  { name: 'eventItems' },
  // NEU: Discovery-Cache (nicht gesynct, rein lokal)
  { name: 'discoveryRegions' },
  { name: 'discoveryInterests' },
  { name: 'discoveredEvents' },
],
```

**database.ts** — Indizes:

```typescript
discoveryRegions: 'id, isActive',
discoveryInterests: 'id, category',
discoveredEvents: 'id, startAt, category, userAction, [startAt+category]',
```

**Keine Encryption-Registry** — öffentliche Daten.

### 1.5 Deliverables Phase 1

- [ ] Drizzle-Schema `event_discovery` + `bun run db:push`
- [ ] CRUD-Routen für Regionen, Interessen, Quellen
- [ ] iCal-Parser mit Dedup + Cleanup
- [ ] Crawl-Scheduler (15-Min-Intervall)
- [ ] Feed-Endpoint (paginiert, nach Datum gefiltert)
- [ ] Frontend: Tab-Navigation in ListView
- [ ] Frontend: DiscoverySetup (Regionen + Interessen)
- [ ] Frontend: RegionPicker mit mana-geocoding Autocomplete
- [ ] Frontend: SourceManager (iCal-URLs CRUD)
- [ ] Frontend: DiscoveredEventCard + Feed-Ansicht
- [ ] Frontend: "Merken" → socialEvent anlegen
- [ ] Tests: iCal-Parser Unit-Tests, Feed-Route Integration-Tests

---

## Phase 2 — Automatische Quellen-Entdeckung + LLM-Extraktion

**Ziel:** Die KI findet selbst Event-Quellen für die Regionen des Nutzers und extrahiert Events von unstrukturierten Websites.

### 2.1 Quellen-Entdeckung (Meta-Crawl)

**Neue Datei:** `services/mana-events/src/discovery/source-discoverer.ts`

**Ablauf:**

```
Nutzer fügt Region "Freiburg" hinzu
  │
  ├─ Trigger: source-discoverer.discoverForRegion(region)
  │
  ├─ Schritt 1: Web-Suche via mana-research
  │   Queries (parallel, via mana-research POST /api/v1/search):
  │     "Veranstaltungskalender Freiburg ical"
  │     "Events Freiburg 2026"
  │     "Kulturzentren Freiburg Programm"
  │     "Vereine Freiburg Veranstaltungen"
  │     "Konzerte Theater Freiburg Termine"
  │
  ├─ Schritt 2: Ergebnisse filtern
  │   → URLs die auf .ics enden → Typ 'ical'
  │   → URLs mit /kalender, /programm, /events, /veranstaltungen → Typ 'website'
  │   → Bekannte Plattformen (eventbrite.*/freiburg, meetup.com/*freiburg) → Typ 'api'
  │
  ├─ Schritt 3: LLM-Klassifikation (optional, via mana-llm)
  │   Prompt: "Ist diese URL eine Event-Quelle? Wenn ja: Name, Typ, Region."
  │   → Filtert Noise (Nachrichtenartikel über Events, generische Stadtseiten)
  │
  ├─ Schritt 4: Vorschläge speichern
  │   → INSERT INTO discovery_sources (status: 'suggested')
  │   → Nutzer sieht Vorschläge im SourceManager und kann aktivieren/ablehnen
  │
  └─ Schritt 5: Sofort-Crawl für aktivierte Quellen
```

**API-Erweiterung:**

```
POST /api/v1/discovery/regions/:id/discover-sources
  → Triggert Meta-Crawl, returns {suggestedCount}

GET  /api/v1/discovery/sources?status=suggested
  → Vorgeschlagene Quellen die der Nutzer noch bestätigen muss

PUT  /api/v1/discovery/sources/:id/activate
PUT  /api/v1/discovery/sources/:id/reject
```

### 2.2 Website-Extraktion (LLM-basiert)

**Neue Datei:** `services/mana-events/src/discovery/website-extractor.ts`

**Ablauf für Typ `website`:**

```
Source: { type: 'website', url: 'https://jazzhaus.de/programm' }
  │
  ├─ Schritt 1: Seite crawlen via mana-research
  │   POST mana-research /api/v1/extract
  │     { url: source.url, provider: 'jina' }  (oder 'firecrawl')
  │   → Markdown-Text der Seite
  │
  ├─ Schritt 2: LLM-Extraktion via mana-llm
  │   System-Prompt:
  │     "Du bist ein Event-Extractor. Extrahiere ALLE kommenden
  │      Veranstaltungen von dieser Seite. Pro Event:
  │      - title (string, required)
  │      - date (ISO 8601, required)
  │      - endDate (ISO 8601, optional)
  │      - location (string, optional — Venue-Name + Adresse)
  │      - description (string, max 300 Zeichen)
  │      - category (music|theater|art|tech|sport|food|family|other)
  │      - priceInfo (string, optional — z.B. 'VVK 15€ / AK 18€')
  │      - imageUrl (string, optional)
  │      Antwort als JSON-Array. Ignoriere vergangene Events.
  │      Heutiges Datum: {today}"
  │   User-Prompt: <Markdown der gecrawlten Seite>
  │   → JSON-Array von NormalizedEvents
  │
  ├─ Schritt 3: Validierung + Normalisierung
  │   → Datum parsen (LLMs machen manchmal "25. April 2026" statt ISO)
  │   → Geocoding via mana-geocoding falls location vorhanden
  │   → dedupe_hash berechnen
  │
  └─ Schritt 4: UPSERT INTO discovered_events
```

**LLM-Kosten:** ~500-2000 Input-Tokens pro Seite + ~200-500 Output-Tokens. Bei Haiku-Klasse: ~0.001-0.003 $ pro Seite. Bei täglichem Crawl von 50 Quellen: ~$0.05-0.15/Tag.

### 2.3 Relevanz-Scoring

**Neue Datei:** `services/mana-events/src/discovery/scorer.ts`

```typescript
function scoreEvent(
  event: DiscoveredEvent,
  interests: DiscoveryInterest[],
  regions: DiscoveryRegion[],
  userActions: Map<string, 'save' | 'dismiss'>
): number {
  let score = 50; // Basis

  // Kategorie-Match: +20 pro Match mit Nutzer-Interesse (gewichtet)
  for (const interest of interests) {
    if (event.category === interest.category) score += 20 * interest.weight;
    if (interest.freetext && event.title.toLowerCase().includes(interest.freetext.toLowerCase()))
      score += 15 * interest.weight;
  }

  // Entfernung: -1 pro km über 5km (nah = besser)
  const nearestRegion = findNearestRegion(event, regions);
  if (nearestRegion) {
    const distKm = haversine(event.lat, event.lon, nearestRegion.lat, nearestRegion.lon);
    score -= Math.max(0, distKm - 5);
  }

  // Zeitnähe: +10 wenn innerhalb 7 Tagen, +5 wenn innerhalb 14 Tagen
  const daysUntil = (new Date(event.startAt).getTime() - Date.now()) / 86400000;
  if (daysUntil <= 7) score += 10;
  else if (daysUntil <= 14) score += 5;

  // Wochenende-Bonus: +5 wenn Sa/So (die meisten Nutzer sind freier)
  const dow = new Date(event.startAt).getDay();
  if (dow === 0 || dow === 6) score += 5;

  // Source-Qualität: +5 wenn Source hohe Erfolgsquote hat
  // (Phase 3: implizites Feedback aus save/dismiss-Ratio)

  return Math.max(0, Math.min(100, score));
}
```

**Feed-Endpoint erweitert:** `ORDER BY relevance_score DESC, start_at ASC`

### 2.4 Frontend-Erweiterungen

**SourceManager.svelte — erweitert:**

```svelte
<!-- Bestehend: manuelle iCal-Eingabe -->
<!-- NEU: "Quellen automatisch finden" Button -->
<button onclick={discoverSources}>
  Quellen automatisch finden für {activeRegion.label}
</button>

{#if suggestedSources.length > 0}
  <h3>Vorgeschlagene Quellen</h3>
  {#each suggestedSources as source}
    <SourceSuggestionCard
      {source}
      onActivate={() => activateSource(source.id)}
      onReject={() => rejectSource(source.id)}
    />
  {/each}
{/if}
```

**DiscoveredEventCard.svelte — erweitert:**

- Relevanz-Indikator (farbiger Dot: grün >70, gelb >40, grau <40)
- "Warum vorgeschlagen?"-Tooltip (Kategorie-Match, Nähe, Zeitnähe)
- Kategorie-Badge prominenter

### 2.5 Deliverables Phase 2

- [ ] Source-Discoverer: Web-Suche → iCal/Website-URLs → Vorschläge
- [ ] Website-Extractor: Crawl → LLM-Extraktion → normalisierte Events
- [ ] Relevanz-Scorer mit Kategorie/Distanz/Zeit-Gewichtung
- [ ] API: `/discover-sources`, `/activate`, `/reject`
- [ ] Frontend: "Quellen automatisch finden" + Vorschlags-UI
- [ ] Frontend: Relevanz-Indikator + "Warum vorgeschlagen?"
- [ ] Crawl-Scheduler erweitert: Website-Typ + Fehlerhandling
- [ ] Tests: Website-Extractor mit Mock-HTML, Scorer Unit-Tests

---

## Phase 3 — mana-ai Integration + Proaktive Vorschläge

**Ziel:** Discovery wird zu einem AI-Tool. Mana-AI-Missions können proaktiv Events finden und vorschlagen.

### 3.1 AI-Tool: `discover_events`

**In `@mana/shared-ai`:**

```typescript
{
  name: 'discover_events',
  description: 'Suche öffentliche Veranstaltungen in den konfigurierten Regionen des Nutzers',
  parameters: {
    query: { type: 'string', description: 'Optionaler Suchtext (z.B. "Jazz Konzerte")' },
    category: { type: 'string', description: 'Kategorie-Filter' },
    days_ahead: { type: 'number', description: 'Wie viele Tage voraus (default 14)' },
  },
  defaultPolicy: 'auto',  // Read-only, kann im Reasoning-Loop laufen
}
```

**Server-side (mana-ai):** Ruft `mana-events /api/v1/discovery/feed` auf, injiziert Ergebnisse als ResolvedInput.

### 3.2 AI-Tool: `suggest_event`

```typescript
{
  name: 'suggest_event',
  description: 'Schlage dem Nutzer ein entdecktes Event vor (erscheint als Proposal)',
  parameters: {
    discovered_event_id: { type: 'string', required: true },
    reason: { type: 'string', description: 'Warum dieses Event relevant ist' },
  },
  defaultPolicy: 'propose',  // Nutzer muss bestätigen
}
```

**Approve-Handler:** Führt den "Merken"-Flow aus (discoveredEvent → socialEvent).

### 3.3 Proaktive Mission: "Event-Scout"

Als **Agent-Template** (analog Recherche-Agent):

```typescript
{
  name: 'Event-Scout',
  description: 'Findet regelmäßig Events in deinen Regionen und schlägt passende vor',
  defaultMissions: [
    {
      objective: 'Prüfe neue Events in meinen Regionen. Schlage die 3-5 relevantesten vor, die ich noch nicht gesehen habe.',
      cadence: 'daily',
      isPaused: false,
    }
  ],
  policy: {
    discover_events: 'auto',
    suggest_event: 'propose',
  }
}
```

### 3.4 Feedback-Loop

**Implizites Profil aus Nutzer-Aktionen:**

```
save_count(category=music)  / total_music_shown  →  music_affinity
dismiss_count(source=X)     / total_from_X       →  source_quality

→ Gewichtung in scorer.ts anpassen:
  - Kategorien mit hoher Affinity: weight * 1.5
  - Quellen mit niedriger Qualität: weight * 0.5
  - Quellen mit >80% dismiss: deaktivieren + Nutzer informieren
```

### 3.5 Notifications

Via `mana-notify`:

- **Täglicher Digest** (optional): "5 neue Events in Freiburg diese Woche"
- **Highlight-Alert** (optional): Push bei Events mit Score >90
- **Source-Status**: "iCal-Feed von Jazzhaus ist seit 3 Tagen nicht erreichbar"

### 3.6 Deliverables Phase 3

- [ ] AI-Tools `discover_events` + `suggest_event` in shared-ai + mana-ai
- [ ] Agent-Template "Event-Scout"
- [ ] Feedback-Loop: implizites Profil → Scorer-Gewichtung
- [ ] Notification-Integration (täglicher Digest, Highlight-Alert)
- [ ] Tests: AI-Tool Unit-Tests, Feedback-Aggregation

---

## Phase 4 — Event-Plattform-APIs + Social

**Ziel:** Strukturierte APIs von Event-Plattformen anbinden für höhere Datenqualität.

### 4.1 Provider-Adapter

```
services/mana-events/src/discovery/providers/
  base.ts                   ← Interface: fetchEvents(region, dateRange) → NormalizedEvent[]
  ical.ts                   ← Bestehender iCal-Parser (refactored)
  website.ts                ← Bestehender Website-Extractor (refactored)
  eventbrite.ts             ← Eventbrite API (OAuth, kostenlos für Reads)
  meetup.ts                 ← Meetup GraphQL API
  facebook-events.ts        ← Meta Graph API (eingeschränkt, braucht App Review)
```

### 4.2 Stadt-Portale

Viele Städte haben halbstrukturierte Event-Kalender:

- freiburg.de/veranstaltungen → RSS/Atom wo vorhanden, sonst Website-Extractor
- basel.ch/events → Ähnlich
- Tourismus-Seiten (Schwarzwald-Tourismus, Basel-Tourismus)

→ Diese werden als `type: 'website'` Quellen mit spezifischen Crawl-Hinweisen angelegt.

### 4.3 Deliverables Phase 4

- [ ] Provider-Adapter-Interface + Refactoring bestehender Parser
- [ ] Eventbrite-Provider
- [ ] Meetup-Provider
- [ ] Stadt-Portal-Unterstützung (optimierte Extraktion)

---

## Abhängigkeiten

| Service | Rolle | Schon vorhanden? |
|---------|-------|-------------------|
| mana-events (3065) | Hosting der Discovery-Logik + DB | Ja, wird erweitert |
| mana-research (3068) | Web-Suche + Extraktion | Ja |
| mana-geocoding (3018) | Region-Geocoding + Distanzberechnung | Ja |
| mana-llm | LLM-Aufrufe für Extraktion + Klassifikation | Ja |
| mana-credits | Kosten-Tracking für LLM + Research-Calls | Ja |
| mana-notify (3024) | Push-Notifications für Digests | Ja |
| mana-ai (3067) | Mission-Runner für proaktive Vorschläge | Ja, Phase 3 |

**Neue npm-Dependencies:**

- `node-ical` — iCal-Parsing (Phase 1)
- Keine weiteren — alles andere ist über bestehende Services abgedeckt

---

## Risiken + Mitigationen

| Risiko | Mitigation |
|--------|------------|
| iCal-Feeds kaputt / nicht-standard | Robuster Parser + error_count + Auto-Deaktivierung nach 5 Fehlern |
| LLM-Extraktion unzuverlässig | Structured Output (JSON-Mode), Validierung, Fallback auf Regex-Extraktion für bekannte Formate |
| Zu viele irrelevante Events | Relevanz-Scoring + Dismiss-Feedback + Source-Qualitäts-Tracking |
| Hohe LLM-Kosten bei vielen Quellen | Haiku-Klasse nutzen, Caching (gleiche Seite → kein Re-Extract wenn unverändert), Rate-Limits pro User |
| Geocoding-Ungenauigkeit | Fallback: Events ohne Koordinaten bekommen Region-Zentrum + maximalen Radius |
| DSGVO: öffentliche Events speichern | Events sind öffentlich publiziert, kein personenbezogener Inhalt. User-Actions (save/dismiss) sind personal data → Löschung bei Account-Delete |

---

## Empfehlung

**Phase 1 zuerst bauen.** Das allein ist schon wertvoll — ein Nutzer, der 10 iCal-Feeds seiner Lieblings-Venues einträgt, bekommt einen aggregierten Event-Feed ohne dass je eine KI laufen muss. Phase 2 macht es dann intelligent (automatische Quellen-Entdeckung + unstrukturierte Seiten). Phase 3 macht es proaktiv (KI schlägt Events vor). Phase 4 ist nice-to-have.

Geschätzter Aufwand Phase 1: Backend ~1.5 Tage, Frontend ~1.5 Tage, Tests ~0.5 Tage = **~3.5 Tage**.
