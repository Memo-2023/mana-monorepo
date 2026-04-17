# Mana Research Service — Plan

## Status (2026-04-17)

Planung, noch kein Code. Neuer Service `services/mana-research` (Bun/Hono, Port 3068), der 16+ Web-Research-Provider hinter einer einheitlichen Schnittstelle bündelt. Ziel: Vergleichbarkeit zwischen Anbietern + beste verfügbare Research-Qualität je nach Query-Typ.

**Vorausgegangene Analyse:** [`docs/reports/web-research-capabilities.md`](../reports/web-research-capabilities.md)
**Verwandtes Modul:** [`docs/plans/news-research-module.md`](./news-research-module.md) (das bestehende RSS-Modul, wird in Phase 3 auf den neuen Service migriert)

## Ziel

Eine zentrale Research-Schicht, die:

1. **Viele Anbieter bündelt** hinter einer gemeinsamen Schnittstelle (Search, Extract, Agent).
2. **Side-by-Side-Vergleich** erlaubt (gleiche Query → N Provider parallel, normalisierte + rohe Ergebnisse in PostgreSQL).
3. **Auto-Routing** nach Query-Typ macht (News → Tavily, Paper → Exa, komplexe Frage → Perplexity, …).
4. **Pay-per-use-only**: keine Services mit Monats-Abo, nur API-Call-basierte Abrechnung.
5. **mana-credits** integriert ist — jeder Call kostet je nach Provider + Operation.
6. **Hybrid-Keys** unterstützt — Server-Keys als Default (charged via credits), BYO-Keys pro User optional (kein Credit-Verbrauch).
7. **Frontend Research Lab** liefert — UI zum Eingeben von Queries, Auswahl von Providern, Side-by-Side-Review, manuelles Rating.

## Abgrenzung

- **`mana-search`** (Go, Port 3021) bleibt als SearXNG+Readability-Primitive bestehen und wird *ein* Provider im neuen Service. Keine Ablösung, nur Umfassung.
- **`mana-crawler`** (Go, Port 3023) bleibt als Deep-Crawl-Tool separat. Wird nicht Teil der Research-Pipeline.
- **`news-research`-Modul** im Frontend und die `/api/v1/news-research/*`-Routen in mana-api bleiben zunächst parallel bestehen und werden in Phase 3 als dünner Adapter auf den neuen Service umgestellt.
- **`mana-ai`** behält seinen eigenen NewsResearchClient, wird in Phase 3 auf `mana-research` umgestellt.

---

## 1. Architektur

```
                 apps/mana web  /  apps/api  /  mana-ai
                                  │
                                  ▼
                       mana-research (3068)
                                  │
               ┌──────────────────┼──────────────────┐
               ▼                  ▼                  ▼
          SearchProvider    ExtractProvider     ResearchAgent
               │                  │                  │
    ┌──────────┼──────────┐       │       ┌──────────┼──────────┐
    │          │          │       │       │          │          │
 SearXNG    Brave       Tavily  Readab   Perplex    Claude      OpenAI
 DDG        Exa         Serper  Jina     Sonar      Web-Search  Responses
 Mojeek     SerpAPI             Firecr   Gemini                 DR (async)
                                ScrapBee Ground

           ┌──────────────────────────────────┐
           │  Redis Cache (query+provider)    │
           │  Postgres  research.{eval_runs,  │
           │            eval_results,         │
           │            provider_configs,     │
           │            provider_stats}       │
           │  mana-credits  (cost tracking)   │
           │  mana-llm  (query classification) │
           └──────────────────────────────────┘
```

### Service-Grenze

- **Eigener Hono-Server** in `services/mana-research/src/server.ts`.
- **Auth:** `@mana/shared-hono` authMiddleware wie alle anderen Services. Interne Service-to-Service-Calls (mana-ai) nutzen weiterhin den vorhandenen Muster ohne User-Auth.
- **CORS-Origins:** `*.mana.how` + `localhost:5173` — wird in Phase 1 gesetzt.
- **Dependencies:** `mana-llm` (für Query-Klassifikation), `mana-credits` (für Cost-Tracking), `mana-search` (als Provider gewrappt), PostgreSQL (`mana_platform`), Redis (Cache).

### Provider-Interfaces (TypeScript, exportiert aus `packages/shared-research`)

Neues Shared-Package `@mana/shared-research` für Typen, die vom Frontend (research-lab Modul) und Backend (mana-research + mana-api) gemeinsam genutzt werden.

```ts
// Gemeinsame Metadaten jedes Provider-Calls
export interface ProviderMeta {
  provider: ProviderId;              // 'brave' | 'tavily' | ...
  category: 'search' | 'extract' | 'agent';
  latencyMs: number;
  costCredits: number;               // via creditsPerCall mapping
  cacheHit: boolean;
  billingMode: 'server-key' | 'byo-key';
  errorCode?: string;                // wenn success=false
}

export interface SearchHit {
  url: string;
  title: string;
  snippet: string;
  publishedAt?: string;
  author?: string;
  score?: number;                    // provider-eigenes Ranking
  content?: string;                  // wenn Provider direkt Text liefert (Tavily)
  providerRaw: unknown;              // roh für Debug
}

export interface ExtractedContent {
  url: string;
  title: string;
  content: string;                   // Markdown oder plain text
  excerpt?: string;
  author?: string;
  siteName?: string;
  publishedAt?: string;
  wordCount: number;
  providerRaw: unknown;
}

export interface AgentAnswer {
  query: string;
  answer: string;                    // synthetisierte Antwort, Markdown
  citations: Array<{ url: string; title: string; snippet?: string }>;
  followUpQueries?: string[];
  tokenUsage?: { input: number; output: number };
  providerRaw: unknown;
}

export interface SearchProvider {
  id: ProviderId;
  capabilities: {
    webSearch: boolean;
    newsSearch: boolean;
    scholarSearch: boolean;
    semanticSearch: boolean;
    contentInResults: boolean;       // true wenn Tavily-style
  };
  search(query: string, opts: SearchOptions): Promise<{
    results: SearchHit[];
    meta: ProviderMeta;
  }>;
}

export interface ExtractProvider {
  id: ProviderId;
  capabilities: {
    jsRendering: boolean;
    pdfSupport: boolean;
    markdownOutput: boolean;
  };
  extract(url: string, opts: ExtractOptions): Promise<{
    content: ExtractedContent;
    meta: ProviderMeta;
  }>;
}

export interface ResearchAgent {
  id: ProviderId;
  capabilities: {
    multiStep: boolean;
    async: boolean;
    withCitations: boolean;
  };
  research(query: string, opts: AgentOptions): Promise<{
    answer: AgentAnswer;
    meta: ProviderMeta;
  }>;
}
```

### Service-Modi (HTTP-Endpoints)

| Endpoint | Zweck |
|---|---|
| `POST /v1/search` | Single-Provider-Search. Body: `{ query, provider?, options }`. Wenn provider fehlt → Auto-Router. |
| `POST /v1/search/compare` | Fan-Out an N Provider, speichert Run in `research.eval_runs`. Body: `{ query, providers: [...], options }`. |
| `POST /v1/extract` | Single-Provider-Extract. Body: `{ url, provider? }`. |
| `POST /v1/extract/compare` | Fan-Out für Extract. |
| `POST /v1/research` | Agent-Mode. Query → synthesierte Antwort + Zitate. Body: `{ query, agent?, options }`. |
| `POST /v1/research/compare` | Fan-Out an N Agents. |
| `GET /v1/providers` | Liste aller registrierten Provider + Capabilities + aktuelle Kosten. |
| `GET /v1/providers/health` | Welche Provider sind aktuell erreichbar / haben gültige Keys? |
| `GET /v1/runs` | User's gespeicherte Eval-Runs (paginiert). |
| `GET /v1/runs/:id` | Einzelner Run mit allen Results. |
| `POST /v1/runs/:id/results/:resultId/rate` | User-Rating für Eval. |
| `GET /health`, `/metrics` | Standard |

---

## 2. Provider-Inventar

Alle Provider nur mit **Pay-per-use**-Abrechnung, kein fester Monatsbetrag nötig.

### 2.1 Search Providers (6)

| Provider | Stärke | Kosten-Modell | Key nötig? | `costCredits` (geschätzt) |
|---|---|---|---|---|
| `searxng` | Self-hosted, unabhängig | Infrastruktur only | Nein | 0 |
| `brave` | Unabhängiger Index, Privacy | $5/1k Queries (PAYG) | Ja | 5 (≈ $0.005) |
| `tavily` | Agent-optimiert, liefert Content + Answer | Credit-Packs, kein Abo-Zwang ($30 = 4k credits, persistent) | Ja | 8 |
| `exa` | Semantische/Embedding-basierte Suche, Papers | $0.001-0.01/Query PAYG | Ja | 3–10 je nach Modus |
| `serper` | Google-SERP als JSON (inkl. People-Also-Ask, Knowledge Panel) | $0.30-1/1k (PAYG) | Ja | 1 |
| `duckduckgo` | Free Instant-Answer API | Kostenlos, rate-limited | Nein | 0 |

Optional später: `mojeek` (unabhängiger Index, PAYG), `serpapi` (Alternative zu Serper, höhere Coverage $5/1k).

### 2.2 Extract Providers (5)

| Provider | Stärke | Kosten-Modell | Key nötig? | `costCredits` |
|---|---|---|---|---|
| `readability` | Mozilla Readability via `mana-search` | Kostenlos (self-hosted) | Nein | 0 |
| `jina-reader` | `r.jina.ai`, extrem robust, Markdown out | Free-Tier 1M tokens/Monat, dann $0.02/1M tokens | Optional (höheres Rate-Limit mit Key) | 1 |
| `firecrawl` | JS-Rendering via Playwright, Batch-Crawls | PAYG Credits (oder self-host via Docker, dann 0) | Ja (bzw. intern für self-host) | 10 |
| `scrapingbee` | Proxy + JS-Render | PAYG Credits | Ja | 8 |
| `crawl4ai` | Self-hosted OSS (Python + Playwright) | Infrastruktur only | Nein | 0 |

### 2.3 Research Agents (5)

| Provider | Stärke | Kosten-Modell | Key nötig? | `costCredits` |
|---|---|---|---|---|
| `perplexity-sonar` | Beste Plug-and-Play-Research-API, 4 Modelle (`sonar`, `sonar-pro`, `sonar-reasoning`, `sonar-deep-research`) | Token-based PAYG ($1-15/1M input + search fees) | Ja | 50–500 je nach Modell |
| `claude-web-search` | Claude-API mit server-seitigem `web_search`-Tool | Token-based + $10/1k searches | Ja (Anthropic) | 100–300 |
| `openai-responses` | OpenAI Responses API mit `web_search_preview`-Tool | Token-based + per-tool-call | Ja (OpenAI) | 100–300 |
| `gemini-grounding` | Gemini + Google Search Grounding | Token-based + per-grounding-query | Ja (Google) | 80–200 |
| `openai-deep-research` | Async, autonomer Multi-Step-Agent | Pay-per-task (~$0.10-1/task) | Ja | 1000+ (async via Job-Queue) |

**Preise sind Stand 2026-04-17** und werden zentral in `services/mana-research/src/providers/pricing.ts` gepflegt und im Service-Startup aus einer JSON-Datei gezogen (updatebar ohne Redeploy).

---

## 3. Daten-Modell

Neues PostgreSQL-Schema `research` in `mana_platform`. Drizzle-Schema in `services/mana-research/src/db/schema.ts`.

```ts
export const researchSchema = pgSchema('research');

// Ein Run = eine Query, ein oder mehrere Provider
export const evalRuns = researchSchema.table('eval_runs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  userId:           text('user_id'),           // null für Service-to-Service
  query:            text('query').notNull(),
  queryType:        text('query_type'),        // 'news' | 'general' | 'semantic' | 'academic' | 'code'
  mode:             text('mode').notNull(),    // 'single' | 'compare' | 'auto'
  category:         text('category').notNull(),// 'search' | 'extract' | 'agent'
  providersRequested: text('providers_requested').array().notNull(),
  billingMode:      text('billing_mode').notNull(), // 'server-key' | 'byo-key' | 'mixed'
  totalCostCredits: integer('total_cost_credits').notNull().default(0),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
});

// Ein Result = Antwort von genau einem Provider
export const evalResults = researchSchema.table('eval_results', {
  id:               uuid('id').primaryKey().defaultRandom(),
  runId:            uuid('run_id').notNull().references(() => evalRuns.id, { onDelete: 'cascade' }),
  providerId:       text('provider_id').notNull(),
  success:          boolean('success').notNull(),
  latencyMs:        integer('latency_ms').notNull(),
  costCredits:      integer('cost_credits').notNull().default(0),
  billingMode:      text('billing_mode').notNull(),
  cacheHit:         boolean('cache_hit').notNull().default(false),
  rawResponse:      jsonb('raw_response'),     // Provider-spezifisch, für Debug
  normalizedResult: jsonb('normalized_result'),// SearchHit[] | ExtractedContent | AgentAnswer
  errorCode:        text('error_code'),
  errorMessage:     text('error_message'),
  userRating:       integer('user_rating'),    // 1-5, null wenn nicht bewertet
  userNotes:        text('user_notes'),
  createdAt:        timestamp('created_at').notNull().defaultNow(),
});

// Per-User Provider-Config (API-Keys, Limits)
export const providerConfigs = researchSchema.table('provider_configs', {
  id:                uuid('id').primaryKey().defaultRandom(),
  userId:            text('user_id'),          // null = server-wide default
  providerId:        text('provider_id').notNull(),
  apiKeyEncrypted:   text('api_key_encrypted'),// verschlüsselt via shared-crypto (KEK-wrapped, AES-GCM)
  enabled:           boolean('enabled').notNull().default(true),
  dailyBudgetCredits:   integer('daily_budget_credits'),
  monthlyBudgetCredits: integer('monthly_budget_credits'),
  createdAt:         timestamp('created_at').notNull().defaultNow(),
  updatedAt:         timestamp('updated_at').notNull().defaultNow(),
}, (t) => ({
  userProvider: uniqueIndex('user_provider_unique').on(t.userId, t.providerId),
}));

// Aggregierte Stats für Admin-Dashboard & Auto-Router
export const providerStats = researchSchema.table('provider_stats', {
  providerId:      text('provider_id').notNull(),
  day:             date('day').notNull(),
  totalCalls:      integer('total_calls').notNull().default(0),
  totalLatencyMs:  bigint('total_latency_ms', { mode: 'number' }).notNull().default(0),
  totalCostCredits:integer('total_cost_credits').notNull().default(0),
  successCount:    integer('success_count').notNull().default(0),
  errorCount:      integer('error_count').notNull().default(0),
  avgUserRating:   real('avg_user_rating'),
  ratingCount:     integer('rating_count').notNull().default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.providerId, t.day] }),
}));
```

**Encryption:** `providerConfigs.apiKeyEncrypted` wird via `shared-crypto` (existierendes AES-GCM + KEK-Pattern) verschlüsselt. Eintrag in `apps/mana/apps/web/src/lib/data/crypto/registry.ts` nötig, falls Client-Cache der Keys kommt — sonst serverseitig über `mana-auth` KEK.

---

## 4. Credits-Integration

**Prinzip:** Jeder Provider-Call hat festen `costCredits`-Preis (siehe §2). Bei Server-Key-Mode → Credits werden via `mana-credits` vom User abgezogen. Bei BYO-Key → 0 Credits, aber wir loggen den Call trotzdem (Usage-Transparenz).

### Flow pro Call

```ts
// services/mana-research/src/middleware/credits.ts
async function chargeForCall(userId, providerId, operation) {
  const config = await loadUserConfig(userId, providerId);
  const isByoKey = !!config?.apiKeyEncrypted;

  if (isByoKey) {
    return { billingMode: 'byo-key', costCredits: 0, apiKey: decrypt(config.apiKeyEncrypted) };
  }

  // Server-Key-Mode: Credits prüfen + reservieren
  const price = PROVIDER_PRICING[providerId][operation];  // aus pricing.ts
  const balance = await manaCredits.getBalance(userId);
  if (balance < price) throw new HTTPException(402, 'Insufficient credits');

  // Soft-Reserve (atomic decrement)
  await manaCredits.reserve(userId, price, `research:${providerId}:${operation}`);

  return { billingMode: 'server-key', costCredits: price, apiKey: SERVER_KEYS[providerId] };
}

// Nach erfolgreichem Call: commit (bei Fehler: refund)
async function finalizeCharge(userId, reservationId, success) {
  if (success) await manaCredits.commit(reservationId);
  else         await manaCredits.refund(reservationId);
}
```

### mana-credits API (zu verifizieren / ggf. zu erweitern)

Erwartete Endpoints:
- `GET  /api/v1/credits/balance?userId=...`
- `POST /api/v1/credits/reserve`      `{ userId, amount, reason }` → `{ reservationId }`
- `POST /api/v1/credits/commit`       `{ reservationId }`
- `POST /api/v1/credits/refund`       `{ reservationId }`
- `GET  /api/v1/credits/usage?userId=...&since=...&filter=research:*`

**Falls** `mana-credits` diese Granularität noch nicht hat → Task in Phase 1 ergänzen: Reserve/Commit/Refund-Pattern einführen.

### Budget-Enforcement

Pro User konfigurierbar in `providerConfigs.dailyBudgetCredits` / `monthlyBudgetCredits`. Default: unlimited (nur von `mana-credits`-Balance limitiert). UI in Settings → "Research Providers" (Phase 4).

---

## 5. BYO-Keys (Hybrid-Modus)

### UX

Settings-Seite `/settings/research-providers` (Phase 4):
- Liste aller Provider mit Toggle "Server-Key nutzen" vs. "Eigener Key"
- Eingabefeld für API-Key (wird nicht angezeigt, nur `••••••`)
- Pro Provider optional tägliches/monatliches Budget setzen

### Storage

- Keys verschlüsselt via bestehender `shared-crypto`-Pipeline (AES-GCM-256, KEK aus `mana-auth`)
- Tabelle `research.provider_configs` mit `userId` + `providerId` unique constraint
- Beim Call: wenn User-Config existiert → verwende deren Key → `billingMode = 'byo-key'` → kein Credit-Verbrauch

### Server-Keys

- Zentral in Env-Vars: `BRAVE_API_KEY`, `TAVILY_API_KEY`, `EXA_API_KEY`, `SERPER_API_KEY`, `PERPLEXITY_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENAI_API_KEY`, `FIRECRAWL_API_KEY`, `SCRAPINGBEE_API_KEY`, `JINA_API_KEY`
- Einheitlich via `services/mana-research/src/config.ts`
- In `.env.development` dokumentiert + `scripts/generate-env.mjs` ergänzt

---

## 6. Query-Klassifikation & Auto-Router

Für `mode: 'auto'`: Query wird via `mana-llm` (gemma3:4b) klassifiziert → bester Provider je Typ.

```ts
// services/mana-research/src/router/classify.ts
export type QueryType = 'news' | 'general' | 'semantic' | 'academic' | 'code' | 'conversational';

const ROUTE_MAP: Record<QueryType, ProviderId[]> = {
  news:           ['tavily', 'brave', 'searxng'],          // Tavily first (News-strong)
  general:        ['brave', 'tavily', 'serper'],
  semantic:       ['exa', 'tavily'],                       // Exa für "find similar to"
  academic:       ['exa', 'searxng'],                      // Exa findet Papers am besten
  code:           ['exa', 'serper', 'searxng'],
  conversational: ['perplexity-sonar', 'claude-web-search'],// agent mode für Frage-Antwort
};

// Fallback-Chain: wenn Primary fehlschlägt, nächster in Liste
```

Klassifikation ist optional und fällt bei LLM-Timeout auf `'general'` zurück.

---

## 7. Phasen-Plan

### Phase 1 — Foundation + Core Providers ✅ (2026-04-17)

**Ziel:** Service läuft mit 4 Search-Providern + grundlegender Cache, Credits-Integration, `/search` + `/search/compare` Endpoints.

- [ ] Service-Scaffold `services/mana-research/` (Bun/Hono + Drizzle + `@mana/shared-hono`)
- [ ] Shared-Package `packages/shared-research` für Provider-Typen
- [ ] DB-Migration: `research` schema (4 Tabellen)
- [ ] Provider-Adapter:
  - `SearXNGProvider` (wrapt `mana-search`)
  - `BraveSearchProvider`
  - `TavilyProvider`
  - `DuckDuckGoProvider` (als kostenloser Fallback)
- [ ] `POST /v1/search` + `POST /v1/search/compare`
- [ ] Redis-Cache (key: `research:${category}:${provider}:${sha256(query+opts)}`, TTL 1h)
- [ ] Credits-Middleware mit Reserve/Commit/Refund
- [ ] `pricing.ts` + `PROVIDER_PRICING`-Map
- [ ] Docker-Compose-Eintrag (`docker-compose.yml` + `docker-compose.macmini.yml`)
- [ ] Port-Eintrag in [`docs/PORT_SCHEMA.md`](../PORT_SCHEMA.md)
- [ ] Env-Vars: `BRAVE_API_KEY`, `TAVILY_API_KEY` in `.env.development`
- [ ] `services/mana-research/CLAUDE.md`
- [ ] Eintrag im Root-CLAUDE.md "Active services"
- [ ] **Falls nötig:** Erweiterung `mana-credits` um Reserve/Commit/Refund
- [ ] Integration-Tests: `tests/search-providers.spec.ts` (Mock-HTTP)

### Phase 2 — Extraction + semantische Suche ✅ (2026-04-17)

- [x] Provider-Adapter:
  - `ReadabilityProvider` (wrapt `mana-search /extract`)
  - `JinaReaderProvider` (zero-auth, optionaler Key für höheres Rate-Limit)
  - `FirecrawlProvider` (PAYG + self-hostbar via `FIRECRAWL_API_URL`)
  - ~~`ScrapingBeeProvider`~~ — deferred: liefert raw HTML, braucht zusätzlichen Readability-Pass. Wird als Phase-3-Addition behandelt.
  - `ExaProvider` (semantische Suche in Phase 2 gelandet)
  - `SerperProvider` (Google SERP als JSON)
- [x] `POST /v1/extract` + `POST /v1/extract/compare`
- [x] Query-Klassifikation: `classify.ts` mit Regex-Fast-Path + optionalem `mana-llm`-Call (`useLlmClassifier: true`)
- [x] Auto-Router in `POST /v1/search` (wenn `provider` nicht gesetzt) + Auto-Router für Extract
- [x] Provider-Health-Check-Endpoint `GET /v1/providers/health`
- [x] Run-Listen-Endpoints bereits in Phase 1 geliefert
- [x] ~~Nightly-Job~~: Live-Aggregation im `addResult()`-Pfad via `onConflictDoUpdate` genügt für Phase 2.

### Phase 3 — Research Agents + mana-ai Migration (≈ 1–2 Wochen)

- [ ] Provider-Adapter:
  - `PerplexitySonarProvider` (4 Modelle: sonar, sonar-pro, sonar-reasoning, sonar-deep-research)
  - `ClaudeWebSearchProvider` (via Anthropic SDK + tool-use)
  - `OpenAIResponsesProvider` (via OpenAI SDK + `web_search_preview` tool)
  - `GeminiGroundingProvider` (via google-genai SDK mit Search-Grounding)
  - `OpenAIDeepResearchProvider` — **async**, via BullMQ/inline Job-Queue, Response-Endpoint `GET /v1/research/tasks/:id`
- [ ] `POST /v1/research` + `POST /v1/research/compare`
- [ ] Auto-Router für `conversational`-Queries → Agent-Mode
- [ ] `mana-llm` um Anthropic- und OpenAI-Provider erweitern (nur für Claude/OpenAI Agents; restlicher LLM-Workflow bleibt Ollama-first)
- [ ] **Migration:** `apps/api/src/modules/news-research/routes.ts` wird zum dünnen Adapter auf `mana-research`
- [ ] **Migration:** `services/mana-ai/src/planner/news-research-client.ts` ruft jetzt `mana-research` direkt statt `mana-api`
- [ ] **Migration:** `research_news`-Tool bekommt Option `depth: 'shallow' | 'deep'`; `deep` ruft Agent-Mode
- [ ] Altes `mana-api/news-research/*` bleibt als Backward-Compat, logged Deprecation-Warning

### Phase 4 — Research Lab UI (≈ 1 Woche)

**Neues Frontend-Modul** `apps/mana/apps/web/src/lib/modules/research-lab/` (tier: `beta`).

- [ ] Routes:
  - `/research-lab` — Main: Query-Input + Provider-Multi-Select + Compare-Button
  - `/research-lab/runs` — Liste gespeicherter Runs mit Filter (query type, datum, provider)
  - `/research-lab/runs/[id]` — Side-by-Side-View: Columns pro Provider, Ratings, Notes, Export
- [ ] Module-Store: `researchLab.svelte.ts` (Runs, Results, aktueller Vergleich)
- [ ] Component: `ProviderPicker.svelte` (gruppiert nach Kategorie, zeigt Kosten + Capabilities)
- [ ] Component: `ResultCard.svelte` (normalisierter Result + Rating-UI + "raw" Toggle)
- [ ] Component: `ComparisonGrid.svelte`
- [ ] Settings-Integration: `/settings/research-providers` für BYO-Keys + Budgets
- [ ] Tool-Schema erweitert: `research_news` mit neuen Options, neues `deep_research` Tool (propose-policy wegen höherer Kosten)
- [ ] Tier-Gate: `beta`+ für Research Lab, `research_news` bleibt `public`+
- [ ] Registrierung in `apps/mana/apps/web/src/lib/app-registry/apps.ts`
- [ ] Seed-Handler für Demo-Runs in `apps/mana/apps/web/src/lib/data/seed-registry.ts`

---

## 8. Offene Fragen

- [ ] **`mana-credits` API-Shape**: hat der Service schon Reserve/Commit/Refund oder nur Debit? Muss geprüft werden in Phase 1 Task 0.
- [ ] **Rate-Limiting**: separate per-User Rate-Limits pro Provider (damit ein Power-User nicht das Quota für alle aufbraucht)? Meine Tendenz: via `provider_configs.dailyBudgetCredits` reicht als Soft-Limit.
- [ ] **Export-Format für Eval-Runs**: JSON-Download reicht, oder brauchen wir CSV/Markdown-Export für manuelle Analyse?
- [ ] **Ollama als Agent?** Wir könnten lokale LLMs mit Tool-Use-Capabilities (z.B. Llama 3.1 tool calling + eigener search-tool-loop) als "self-hosted agent" anbieten — wäre konsistent mit Self-Hosting-Positioning. Phase 5-Kandidat.
- [ ] **Caching-TTL pro Provider**: News sollten kürzer cachen als akademische Papers. Default 1h, aber konfigurierbar pro Provider-Config.
- [ ] **Kosten-Dashboard**: wann bauen wir ein Admin-Dashboard für `provider_stats`? Phase 4 oder später?

---

## 9. Verzeichnisstruktur (Vorschlag)

```
services/mana-research/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── Dockerfile
├── drizzle.config.ts
├── src/
│   ├── server.ts                   # Hono bootstrap
│   ├── config.ts                   # Env-Vars
│   ├── db/
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── providers/
│   │   ├── index.ts                # registerAll()
│   │   ├── types.ts                # re-export @mana/shared-research
│   │   ├── pricing.ts              # PROVIDER_PRICING map
│   │   ├── search/
│   │   │   ├── searxng.ts
│   │   │   ├── brave.ts
│   │   │   ├── tavily.ts
│   │   │   ├── exa.ts
│   │   │   ├── serper.ts
│   │   │   └── duckduckgo.ts
│   │   ├── extract/
│   │   │   ├── readability.ts
│   │   │   ├── jina-reader.ts
│   │   │   ├── firecrawl.ts
│   │   │   └── scrapingbee.ts
│   │   └── agent/
│   │       ├── perplexity-sonar.ts
│   │       ├── claude-web-search.ts
│   │       ├── openai-responses.ts
│   │       ├── gemini-grounding.ts
│   │       └── openai-deep-research.ts
│   ├── routes/
│   │   ├── search.ts
│   │   ├── extract.ts
│   │   ├── research.ts
│   │   ├── runs.ts
│   │   └── providers.ts
│   ├── middleware/
│   │   ├── credits.ts              # Reserve/Commit/Refund
│   │   ├── byo-keys.ts             # Key-Resolution
│   │   └── cache.ts                # Redis wrapper
│   ├── router/
│   │   ├── classify.ts             # Query → QueryType via mana-llm
│   │   └── auto-route.ts           # QueryType → Provider-Chain
│   ├── storage/
│   │   ├── runs.ts                 # persist + retrieve
│   │   └── stats.ts                # aggregation job
│   └── clients/
│       ├── mana-llm.ts
│       ├── mana-credits.ts
│       └── mana-auth.ts
└── tests/
    ├── providers/
    └── integration/

packages/shared-research/
├── package.json
└── src/
    ├── index.ts
    ├── types.ts                    # SearchHit, ExtractedContent, AgentAnswer, ProviderMeta
    ├── options.ts                  # SearchOptions, ExtractOptions, AgentOptions
    └── ids.ts                      # ProviderId union
```

---

## 10. Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| Provider-Pricing ändert sich | Hoch | Mittel | `pricing.ts` updatebar ohne Redeploy, Warnung wenn Kosten > X |
| Provider-Key wird gebannt (z.B. Brave bei zu viel Traffic) | Mittel | Hoch | Multi-Provider-Fallback in Auto-Router, Health-Check |
| `mana-credits` Reserve/Refund-Pattern nicht ready | Mittel | Hoch | Phase 1 Task 0: verifizieren + ggf. implementieren vor allem anderen |
| Kosten-Explosion durch Fan-Out-Compare | Mittel | Hoch | Hartes Limit auf `providers.length` (max 5), UI-Warnung mit Kosten-Preview |
| BYO-Key-Leak durch Logs | Niedrig | Sehr hoch | Keys nur verschlüsselt in DB, Logger-Filter für bekannte Key-Patterns |
| LLM-Klassifikation falsch → schlechter Auto-Route | Mittel | Niedrig | User kann immer explizit Provider wählen, Klassifikation ist nur Hint |

---

## 11. Verwandte Dateien

**Heute existierende Research-Pfade (werden in Phase 3 umgestellt):**
- `apps/api/src/lib/search.ts` — `webSearch()` Wrapper
- `apps/api/src/modules/news-research/routes.ts` — `/discover`, `/search`, `/extract`
- `services/mana-ai/src/planner/news-research-client.ts`
- `services/mana-ai/src/cron/tick.ts:282` — Pre-Planning Research Step
- `apps/mana/apps/web/src/lib/modules/news-research/tools.ts:48` — `research_news` Tool
- `services/mana-search/` — bleibt, wird SearXNG+Readability-Provider
- `packages/shared-rss/` — bleibt unverändert

**Neu zu erstellen:**
- `services/mana-research/**`
- `packages/shared-research/**`
- `apps/mana/apps/web/src/lib/modules/research-lab/**`
- `apps/mana/apps/web/src/routes/(app)/research-lab/**`
