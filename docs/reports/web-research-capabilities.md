# Web-Recherche im Mana-System — Bestandsaufnahme & Vergleich

**Datum:** 2026-04-17
**Scope:** Wie recherchiert das System heute im Internet, wie gut ist das, und welche Alternativen gibt es?

---

## 1. TL;DR

Mana hat eine **vollständig selbstgehostete, RSS-zentrierte Recherche-Pipeline**:

```
User / AI-Mission
      ↓
research_news Tool (Frontend)  bzw.  NewsResearchClient (mana-ai Backend)
      ↓
mana-api /api/v1/news-research/{discover,search,extract}
      ↓
mana-search (Go, SearXNG-Proxy)  +  @mana/shared-rss (RSS + Readability)
      ↓
SearXNG (lokal, Port 8080)  →  Google / Bing / DDG / Brave / Wikipedia / arXiv / GitHub / ...
```

**Stärken:** Null API-Kosten, voller Datenschutz, kein Vendor-Lock-in, robuste Inhaltsextraktion (Mozilla Readability), RSS-First-Ansatz liefert strukturierte, zitierbare Quellen.

**Schwächen:** Kein semantisches Ranking (nur Keyword-TF), keine agentische Multi-Step-Recherche, keine Paywall-/JS-Heavy-Site-Handling, keine Cross-Source-Synthese, SearXNG ist fragil gegen Provider-Blocks (Google blockt ihn regelmäßig). Ergebnisqualität liegt etwa bei **30–50 %** dessen, was Perplexity/Exa/OpenAI Deep Research heute liefern.

**Empfehlung:** Hybrid-Modell. Self-Hosting als Default behalten, aber eine **optionale API-Bridge** (Tavily, Exa, oder Brave Search API) als Fallback bzw. "Premium-Recherche" einbauen. Siehe §6.

---

## 2. Was das System HEUTE kann

### 2.1 Service-Landschaft

| Service | Port | Sprache | Rolle |
|---|---|---|---|
| `mana-search` | 3021 | Go | SearXNG-Proxy + Readability-Extract (zentral) |
| `mana-crawler` | 3023 | Go | Deep-Crawls mit Depth/Selector-Support (**wird nicht** von Research genutzt) |
| `mana-api` | 3060 | Bun/Hono | Orchestriert News-Research-Endpoints |
| `mana-ai` | 3067 | Bun | Background Mission Runner mit Pre-Planning Research Step |
| `mana-llm` | 3025 | Python | LLM-Gateway (Ollama-First, Gemini-Fallback) |
| `news-ingester` | 3066 | Bun | Cron-basiertes Vorab-Pooling kuratierter RSS-Quellen (passiv) |
| SearXNG | 8080 | — | Meta-Such-Frontend über ~15 Engines |

### 2.2 Die vier Primitive

**1. Web-Suche** (`mana-search` → SearXNG)
- File: `services/mana-search/internal/search/searxng.go`
- Kategorien: `general` (Google, Bing, DDG, Brave, Wikipedia), `news` (Google/Bing News), `science` (arXiv, Scholar, PubMed), `it` (GitHub, StackOverflow, NPM, MDN)
- Redis-Cache (TTL 1h), Prometheus-Metriken, Graceful-Degradation
- **Limitation:** SearXNG wird von Google regelmäßig per CAPTCHA geblockt; Fallback auf DDG/Bing

**2. Inhaltsextraktion** (`mana-search` + `@mana/shared-rss`)
- go-shiori/go-readability (Go-Port von Mozilla Readability) im Service
- `@mozilla/readability` + jsdom in der shared-rss Lib
- Bulk-Extract bis 20 URLs parallel (`POST /api/v1/extract/bulk`)
- Redis-Cache 24h, Max-Length 50k chars
- **Limitation:** Kein JS-Rendering (Playwright fehlt in Research-Pfad), Paywalls werden nicht umgangen, keine PDF-Extraktion

**3. RSS-Feed-Discovery** (`packages/shared-rss`)
- File: `packages/shared-rss/src/discover.ts`
- Strategy: `<link rel="alternate">` scannen → Fallback auf Common-Paths (`/feed`, `/rss.xml`, `/atom.xml`, `/feeds/posts/default`, ...)
- `rss-parser` für RSS 1.0/2.0 und Atom
- **Stärke:** Trifft strukturierte Inhalte direkt von der Quelle (keine HTML-Extraktion nötig)

**4. AI-Research-Tool** (`research_news`)
- File: `apps/mana/apps/web/src/lib/modules/news-research/tools.ts:48`
- Policy: `auto` (Tool läuft ohne User-Approval)
- Pipeline: Query → `discover` (Web-Search nach "query rss feed") → `search` (Top 10 Feeds parsen + rank) → formatter Markdown-Context
- Ranking: Keyword-Frequency (title +3, excerpt +2, content +1) + Recency-Boost (<24h: +2, <7d: +1)
- **Limitation:** Kein BM25, keine Embeddings, keine Query-Expansion, keine Cross-Source-Deduplication

### 2.3 Integration in AI-Missions

Der `mana-ai` Tick-Runner hat einen **Pre-Planning-Step** (`services/mana-ai/src/cron/tick.ts:282`):

```typescript
if (RESEARCH_TRIGGER.test(m.objective) || RESEARCH_TRIGGER.test(m.conceptMarkdown)) {
  const research = await nrc.research(m.objective, { language: 'de', limit: 8 });
  resolvedInputs.push({
    id: '__web-research__',
    module: 'news-research',
    table: 'web',
    title: `Web-Research: "${m.objective.slice(0, 60)}"`,
    content: research.contextMarkdown,
  });
}
```

Regex triggert auf: `recherchier|research|news|finde|suche|aktuelle|neueste|today|history|historisch|on this day`. Ergebnis wird als ResolvedInput in den Planner-Prompt injiziert → Planner sieht echte URLs + Excerpts, soll nur diese zitieren.

### 2.4 LLM-Integration (mana-llm)

Router unterstützt: Ollama (primary, lokal), Google Gemini (Fallback), OpenRouter, Groq, Together.

**Wichtig:** Weder OpenAI noch Anthropic sind konfiguriert. Das heißt:
- **Kein** Claude `web_search` / `fetch_url` Tool-Use
- **Kein** OpenAI Browsing / Deep Research
- **Kein** Gemini Grounding mit Google Search
- Die gesamte Research-Logik ist **explizit in mana-api kodiert** — kein LLM macht hier eigenständig Tool-Calls ins Web.

---

## 3. Qualitätseinschätzung

### Bewertungsmatrix (1 = schwach, 5 = state-of-the-art)

| Dimension | Score | Begründung |
|---|---|---|
| **Coverage** (wie viel vom Web) | 2/5 | Nur Quellen mit RSS + was SearXNG liefert (<30 % typisch für News, <5 % für Fachwissen) |
| **Recency** | 3/5 | RSS-Feeds meist ≤ 1h Verzögerung, SearXNG liefert tagesaktuell. Aber: Pre-Pool (`news-ingester`) ist 15-min-Cron |
| **Inhaltsqualität** | 4/5 | Mozilla Readability ist best-in-class OSS-Extraktion. Schwach bei Paywalls, JS-SPAs, PDFs |
| **Semantisches Ranking** | 1/5 | Nur TF + Recency-Boost. Keine Embeddings, kein BM25, keine Reranker |
| **Multi-Hop-Recherche** | 1/5 | Ein Shot: Query → Feeds → Artikel. Keine Iteration, kein "ich hab X gefunden, jetzt suche ich Y" |
| **Synthese & Zusammenfassung** | 2/5 | Wird dem LLM überlassen (gemma3:4b). Keine spezialisierten Research-Prompts, keine Quellen-Cross-Validierung |
| **Grounding / Zitierbarkeit** | 4/5 | URLs + Excerpts werden strukturiert übergeben; Planner-Prompt warnt explizit gegen URL-Halluzination |
| **Latenz** | 2/5 | Discover + Search + Extract in Serie: 3–15 s typisch. Bei Timeouts: deutlich langsamer |
| **Kosten** | 5/5 | Null API-Kosten, nur Infrastruktur |
| **Datenschutz** | 5/5 | Keine Queries verlassen die eigene Infra (bis auf den SearXNG → Google/Bing Roundtrip, der aber über SearXNG anonymisiert ist) |
| **Robustheit** | 2/5 | SearXNG wird von Google regelmäßig geblockt, Fallbacks sind vorhanden, aber Qualität fällt dann stark |

**Gesamt-Score: ~2.8/5** — solide für das, was es ist (ein RSS-getriebener News-Aggregator mit AI-Integration), aber weit entfernt von dem, was moderne Research-Agents (Perplexity Sonar, Claude mit `web_search`, OpenAI Deep Research, Gemini Deep Research) leisten.

### Konkrete Qualitäts-Gaps

1. **Kein semantisches Matching.** Query "Auswirkungen von Zinssenkungen auf Immobilienmarkt" → findet nur Artikel, die genau diese Keywords haben, nicht solche mit "EZB senkt Leitzins, Hypotheken werden billiger".
2. **Kein Multi-Step.** "Was sagt Studie X zu Thema Y?" erfordert: 1) Studie finden, 2) Autoren identifizieren, 3) Original-Paper lesen, 4) Kritikpunkte recherchieren. System macht nur Schritt 1–2 rudimentär.
3. **Keine Inhalts-Synthese.** Wenn 8 Quellen dasselbe Ereignis berichten, werden 8 Texte ans LLM gegeben — keine automatische Dedup oder Consensus-Extraktion.
4. **Paywall-Problem.** FAZ, NYT, Spiegel+ etc. liefern nur Teaser. Kein Bypass (wäre rechtlich auch problematisch).
5. **Kein PDF/Paper-Access.** arXiv-Links werden gelistet, aber das PDF wird nicht geladen/extrahiert.
6. **Keine Wissensgraph-Anbindung.** Entities (Personen, Firmen, Orte) werden nicht extrahiert oder verknüpft.

---

## 4. Marktübersicht: Alternativen & Ergänzungen

### 4.1 Search APIs (ersetzen SearXNG)

| API | Stärken | Schwächen | Preis (Stand 2026) |
|---|---|---|---|
| **Brave Search API** | Unabhängiger Index (kein Google-Relay), gute Privacy-Story, gutes Preis/Leistung | Kleinere Coverage als Google | $3–5 / 1k Queries |
| **Tavily** | Explizit für LLM-Agents gebaut, liefert extrahierten Content statt nur Links, eingebaute Answer-Synthese | Black-Box-Ranking | $0.008 / Query (Basic), ab $30/Monat |
| **Exa** (früher Metaphor) | Semantische Suche auf Embedding-Basis, "find me similar to this URL", beste Coverage für akademische/technische Quellen | Nicht optimal für News | $0.001–0.01 / Query |
| **Serper / SerpAPI** | Google-SERP als JSON (inkl. Knowledge Panels, People-Also-Ask, Shopping, Images) | Nur Google-Relay (nicht unabhängig) | $0.30–1 / 1k Queries |
| **You.com API** | Multi-Engine + integriertes LLM | Kleiner | $10–50/Monat |
| **Kagi Search API** | Bester Qualitäts-Index laut Reviews | Teuer, Wartelisten | $25/Monat Basic |
| **Bing Web Search API** | Große Coverage, stabil | Wird 2025 eingestellt (Microsoft deprecation) | — |
| **Google Custom Search** | Offizieller Google-Zugang | 100 Queries/Tag gratis, dann teuer; Custom-Engine-Setup nötig | $5 / 1k ab 101. Query |

**Empfehlung:** **Tavily** für Agentic-Research (gibt bereits extrahierten Content + Answer), **Brave Search API** für Privacy-freundlichen Default, **Exa** für semantische / Paper-Recherche.

### 4.2 Extraction & Scraping APIs (ersetzen/ergänzen Readability)

| API | Stärken | Schwächen | Preis |
|---|---|---|---|
| **Firecrawl** | JS-Rendering via Playwright, LLM-ready Markdown, Crawl-Jobs, Sitemap, Schema-Extraktion | Selbst-hostbar (OSS), oder Cloud | $16–99/Monat, oder OSS gratis |
| **Jina Reader** (`r.jina.ai`) | Free-Tier großzügig, `https://r.jina.ai/<URL>` gibt Markdown | Rate-Limits ohne Key | Free + $0.02/1M tokens |
| **Diffbot** | KI-basierte Extraktion, strukturierte Entities, Knowledge-Graph | Teuer | $300+/Monat |
| **ScrapingBee / ScraperAPI** | Proxy + JS-Render | Generisch, nicht LLM-optimiert | $49–299/Monat |
| **Crawl4AI** (OSS) | Playwright + LLM-friendly Markdown, lokal self-hostbar, Python | Selbst betreiben | Free |
| **Trafilatura** (OSS Python lib) | Best-in-class Text-Extraktion (besser als Readability laut Benchmarks) | Nur Library, kein Service | Free |

**Empfehlung für Mana:** **Jina Reader** als drop-in Replacement für Readability-Timeouts (1 Zeile HTTP-Call, extrem robust). Oder **Firecrawl self-hosted** für volle Kontrolle + JS-Support.

### 4.3 All-in-One Research Agents (ersetzen die gesamte Pipeline)

| Service | Was es tut | Preis | Hinweis |
|---|---|---|---|
| **Perplexity Sonar API** | Endpoint: "frage eine Frage, bekomm Antwort + Zitate". Multi-Step-Research eingebaut. `sonar-large-online`, `sonar-small-online`, `sonar-pro`, `sonar-reasoning` | $1–5 / 1M tokens + $5 / 1k searches | Beste "plug&play" Research-API am Markt |
| **OpenAI Deep Research API** | Async Jobs die 5–30 Min laufen, autonome Agentic-Research, Report als Ergebnis | $10+ / Task | Premium, nicht Echtzeit |
| **Gemini Deep Research** | Ähnlich OpenAI DR, in Gemini Advanced / Vertex AI | In Abos enthalten | Nur über Gemini-API |
| **Claude mit `web_search` Tool** | Claude-API hat server-seitiges Web-Search Tool seit 2025 | $10 / 1k searches + Token-Kosten | Integriert sich nahtlos in existierende Agents |
| **You.com Research API** | Ähnlich Perplexity | $ pro Query | Kleiner Anbieter |

**Empfehlung:** **Perplexity Sonar** ist der direkteste Ersatz für das, was Mana heute tut — mit deutlich höherer Qualität. **Claude `web_search`** ist die natürlichste Integration, wenn Claude sowieso schon als LLM genutzt wird (aktuell nicht der Fall in Mana, siehe §2.4).

### 4.4 Open-Source Research-Frameworks

| Framework | Was es ist | Eignung für Mana |
|---|---|---|
| **Perplexica** | Self-hosted Perplexity-Clone (SearXNG + LLM + UI) | **Sehr hohe** Übereinstimmung mit Mana-Stack; könnte als Vorbild für eine verbesserte Research-UX dienen |
| **GPT Researcher** | LangChain-basiert, führt autonome Multi-Step-Research durch | Passt nicht direkt zu Mana's Tool-Architektur, aber Konzepte übertragbar |
| **SearXNG + LiteLLM + Self-Extract** | Was Mana im Wesentlichen schon hat | — |
| **llm.datasette.io + mwmbl** | Extrem minimalistisch, OSS-Index | Zu klein für Produktivnutzung |
| **Open WebUI + Tool-Servers** | UI-Layer für LLMs mit Tool-Ecosystem | Orthogonal |
| **crawl4ai + rag-stack** | Python-Pipelines für Deep-Research | Nur als inspirativer Input |

---

## 5. Vergleichs-Matrix: Mana heute vs. Alternativen

| Dimension | Mana (heute) | + Tavily | + Perplexity Sonar | Claude `web_search` | OpenAI DR |
|---|---|---|---|---|---|
| Coverage | 2/5 | 4/5 | 5/5 | 5/5 | 5/5 |
| Semantisches Ranking | 1/5 | 4/5 | 5/5 | 5/5 | 5/5 |
| Multi-Hop | 1/5 | 2/5 (mit Agent-Loop) | 4/5 | 5/5 | 5/5 |
| Synthese & Zitate | 2/5 | 4/5 | 5/5 | 5/5 | 5/5 |
| Latenz | 2/5 (3–15s) | 4/5 (<2s) | 4/5 (2–8s) | 3/5 (5–30s) | 1/5 (5–30 min) |
| Datenschutz | 5/5 | 3/5 | 2/5 | 3/5 | 2/5 |
| Kosten | 5/5 | 4/5 | 3/5 | 3/5 | 2/5 |
| Self-Hosting möglich | 5/5 | 0/5 | 0/5 | 0/5 | 0/5 |
| Produktionsreife | 3/5 | 5/5 | 5/5 | 5/5 | 5/5 |

---

## 6. Empfehlungen — vom Minimum zum Maximum

### 6.1 Quick-Wins ohne externe APIs (Null zusätzliche Kosten)

1. **BM25-Ranking** statt Keyword-Frequency. 1 Tag Arbeit, 20–30 % Qualitätssprung.
   - File: `apps/api/src/modules/news-research/routes.ts:160` (`scoreAndRank`)
2. **Query-Expansion via lokalem LLM.** Vor dem Search-Call: `gemma3:4b` generiert 2–3 Varianten der Query → mehr Coverage. ~0.5 s Latenz extra.
3. **Embedding-Dedup.** Vor dem Ranking: MiniLM-Embeddings (via `@mana/local-llm` oder mana-llm) für Cluster-Dedup gleicher News. Halbiert Redundanz.
4. **PDF-Extraktion** für arXiv & Paper-Links. `pdf-parse` npm-lib, ~2 h Arbeit.
5. **SearXNG hardenen.** `settings.yml` reviewen, Engines auf stabile (Brave, DDG, Qwant) fokussieren, Google deprioritisieren.
6. **Playwright-Fallback** in `mana-crawler` für JS-heavy Sites (ist da, aber nicht im Research-Pfad). Nutzen, wenn Readability leeren Text zurückgibt.

**Aufwand gesamt:** ~3–5 Tage, Qualitätssprung von 2.8/5 auf ~3.5/5.

### 6.2 Hybrid-Modell (empfohlen für Release)

**Architektur:** `mana-search` behält SearXNG als Default, aber akzeptiert einen optionalen Provider-Switch:

```typescript
// apps/api/src/lib/search.ts
async function webSearch(opts) {
  const provider = opts.provider ?? env.DEFAULT_SEARCH_PROVIDER; // 'searxng' | 'brave' | 'tavily'
  switch (provider) {
    case 'tavily':   return tavilySearch(opts);   // agentic, gibt Content + Answer
    case 'brave':    return braveSearch(opts);    // privacy-freundlich, stabil
    case 'searxng':  return searxngSearch(opts);  // self-hosted, free
  }
}
```

**Tier-Mapping** (nutzt existierendes `requiredTier`-System):
- `guest` / `public` → SearXNG (self-hosted, free)
- `beta` / `alpha` / `founder` → Tavily/Brave (Premium-Recherche)

**Konkret:**
- Neues `research_news_deep` Tool mit `auto`-Policy für Premium-Tiers
- SearXNG bleibt für alles andere
- Env-Var: `TAVILY_API_KEY`, `BRAVE_SEARCH_API_KEY` (beide optional)

**Kosten:** ~$30–100/Monat für moderate Nutzung (geschätzt 5k–20k Queries).

**Qualitätssprung:** 2.8/5 → 4.2/5.

### 6.3 Max-Quality-Setup (wenn Tier-Premium-Feature)

Für zahlende Nutzer oder besonders wichtige Missionen:

1. **Perplexity Sonar API** als Default-Agent (`sonar-pro` für Standard, `sonar-reasoning` für Deep-Dives).
2. **Jina Reader** als Extraction-Fallback für alles, was Readability nicht schafft.
3. **Exa** für akademische/technische Queries (detektiert über Query-Klassifikation).
4. **Langchain-style Multi-Step-Agent** in `mana-ai`: Query → initial search → identify gaps → follow-up searches → synthesis. Mit Token-Budget (bereits vorhanden).

**Kosten:** ~$200–500/Monat für intensive Nutzung.

**Qualitätssprung:** 4.2/5 → 4.7/5 (auf Augenhöhe mit Perplexity-UI).

### 6.4 Was NICHT gemacht werden sollte

- **Nicht** OpenAI Deep Research als Default einbauen — zu langsam (5–30 min), zu teuer, zu wenig Kontrolle.
- **Nicht** SearXNG komplett rauswerfen — bleibt der beste Free-Tier-Default und wichtig für Privacy-Positioning.
- **Nicht** `mana-crawler` zum News-Fetcher umfunktionieren — er ist für Tiefen-Scans gebaut, falsches Tool.
- **Nicht** Paywall-Umgehung einbauen — rechtlich riskant, schadet dem Ruf.

---

## 7. Datenschutz & "Self-Hosting"-Positioning

Mana positioniert sich als **Self-Hosted & Independent**. Eine Hybrid-Lösung ist damit vereinbar, wenn:

1. Default-Verhalten = 100 % self-hosted (SearXNG).
2. Externe APIs sind **opt-in** pro User (Settings → "Premium-Recherche aktivieren").
3. API-Keys sind **pro User** oder **pro Tier** — nicht geshared.
4. Transparente Anzeige im UI: *"Diese Recherche wurde via Tavily durchgeführt (externer Dienst)"*.
5. Dokumentation in `docs/TECH_STACK_INDEPENDENCE.md` entsprechend erweitern.

Alternativ: **Nur Brave Search API** (unabhängiger Index, Privacy-Fokus) als einzige externe Option — behält die "unabhängig vom Big-Tech-Stack"-Story.

---

## 8. Nächste Schritte (konkret)

**Phase 1 — Quick-Wins** (1 Woche)
- [ ] BM25 in `apps/api/src/modules/news-research/routes.ts:160`
- [ ] Query-Expansion via `gemma3:4b` im `research_news`-Pfad
- [ ] SearXNG-`settings.yml` reviewen + dokumentieren
- [ ] Playwright-Fallback in Extraction-Chain (nur wenn Readability leer)

**Phase 2 — Hybrid-Provider** (1–2 Wochen)
- [ ] `webSearch()` Abstraktion mit Provider-Switch in `apps/api/src/lib/search.ts`
- [ ] Brave Search API als Fallback-Provider
- [ ] Tier-Gating in `packages/shared-branding/src/mana-apps.ts`
- [ ] UI: Settings → "Premium-Recherche"

**Phase 3 — Agentic Research** (3–4 Wochen)
- [ ] Multi-Step-Loop in `mana-ai` mit Follow-Up-Queries
- [ ] Embedding-Dedup + semantisches Clustering
- [ ] Perplexity Sonar als optionaler `research_deep` Tool
- [ ] Zitations-UI im Frontend (Inline-Footnotes in AI-Antworten)

---

## 9. Referenzen im Code

| Funktion | Datei | Zeile |
|---|---|---|
| Web-Search Client | `apps/api/src/lib/search.ts` | `webSearch()` |
| News-Research Routes | `apps/api/src/modules/news-research/routes.ts` | 1–220 |
| SearXNG Integration | `services/mana-search/internal/search/searxng.go` | — |
| Readability Extract | `services/mana-search/internal/extract/extractor.go` | — |
| RSS-Discovery | `packages/shared-rss/src/discover.ts` | 1–129 |
| Research-Tool (Frontend) | `apps/mana/apps/web/src/lib/modules/news-research/tools.ts` | 48–102 |
| Pre-Planning Research Step | `services/mana-ai/src/cron/tick.ts` | 282–297 |
| LLM Router | `services/mana-llm/src/providers/router.py` | — |
| News Ingester | `services/news-ingester/src/sources.ts` | — |

---

**Zusammenfassung in einem Satz:** Mana hat eine solide, self-hosted RSS+SearXNG+Readability-Pipeline, die bei ~60 % der Use-Cases ausreicht — für echten agentischen Research-Qualitätsanspruch braucht es entweder Phase-1-Optimierungen (BM25, Query-Expansion, Embedding-Dedup) oder eine optionale Brücke zu Brave/Tavily/Perplexity Sonar als Premium-Feature.
