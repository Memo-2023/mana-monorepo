# Mana Search Service - Design Document

> **Status**: Entwurf - Zur Überprüfung
> **Erstellt**: 2025-01-28
> **Autor**: Claude Code
> **Abhängigkeit**: questions-app.md

---

## 1. Übersicht

### 1.1 Was ist der Mana Search Service?

Ein zentraler Microservice, der **Web-Suche und Content-Extraktion** für alle ManaCore Apps bereitstellt.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MANA SEARCH SERVICE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                   │
│  │  Questions  │   │    Chat     │   │   Future    │                   │
│  │     App     │   │     App     │   │    Apps     │                   │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘                   │
│         │                 │                 │                           │
│         └────────────┬────┴────────────────┘                           │
│                      ▼                                                  │
│         ┌────────────────────────┐                                     │
│         │   mana-search (3021)   │  ◄── NestJS API                     │
│         │   ┌────────────────┐   │                                     │
│         │   │  Search API    │   │  ◄── Unified Interface              │
│         │   │  Extract API   │   │  ◄── Content Extraction             │
│         │   │  Cache Layer   │   │  ◄── Redis Caching                  │
│         │   └───────┬────────┘   │                                     │
│         └───────────┼────────────┘                                     │
│                     ▼                                                   │
│         ┌────────────────────────┐                                     │
│         │   SearXNG (internal)   │  ◄── Meta-Suchmaschine              │
│         │   Port 8080 (Docker)   │                                     │
│         └───────────┬────────────┘                                     │
│                     ▼                                                   │
│    ┌────────────────────────────────────────┐                          │
│    │  Google │ Bing │ DuckDuckGo │ Brave... │                          │
│    └────────────────────────────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Warum ein zentraler Service?

| Vorteil | Beschreibung |
|---------|--------------|
| **Einmalige Konfiguration** | SearXNG nur einmal aufsetzen und optimieren |
| **Caching** | Ergebnisse über alle Apps hinweg cachen |
| **Rate Limiting** | Zentrale Kontrolle über Anfragen an Suchmaschinen |
| **Content Extraction** | Einheitliche Extraktion, einmal optimiert |
| **Monitoring** | Zentrale Metriken für Suche |
| **Wartung** | Updates nur an einer Stelle |
| **Kostenersparnis** | Falls später paid APIs hinzukommen → zentral |

### 1.3 Consumer Apps

| App | Use Case |
|-----|----------|
| **Questions** | Recherche zu Nutzer-Fragen |
| **Chat** | Web-Grounding für AI-Antworten |
| **Project Doc Bot** | Technische Dokumentations-Suche |
| **Future Apps** | Jede App mit Recherche-Bedarf |

---

## 2. Architektur

### 2.1 Service-Struktur

```
services/mana-search/
├── src/
│   ├── main.ts                      # NestJS Entry Point
│   ├── app.module.ts                # Root Module
│   │
│   ├── config/
│   │   └── configuration.ts         # Environment Config
│   │
│   ├── search/
│   │   ├── search.module.ts
│   │   ├── search.controller.ts     # /api/v1/search
│   │   ├── search.service.ts        # Business Logic
│   │   ├── dto/
│   │   │   ├── search-request.dto.ts
│   │   │   └── search-response.dto.ts
│   │   └── providers/
│   │       ├── search-provider.interface.ts
│   │       ├── searxng.provider.ts   # SearXNG Implementation
│   │       └── brave.provider.ts     # Fallback (optional)
│   │
│   ├── extract/
│   │   ├── extract.module.ts
│   │   ├── extract.controller.ts    # /api/v1/extract
│   │   ├── extract.service.ts       # Content Extraction
│   │   └── extractors/
│   │       ├── article.extractor.ts  # News/Blog Articles
│   │       ├── docs.extractor.ts     # Documentation Sites
│   │       └── generic.extractor.ts  # Fallback
│   │
│   ├── cache/
│   │   ├── cache.module.ts
│   │   └── cache.service.ts         # Redis Caching
│   │
│   ├── health/
│   │   ├── health.module.ts
│   │   └── health.controller.ts     # /health
│   │
│   └── metrics/
│       ├── metrics.module.ts
│       └── metrics.service.ts       # Prometheus Metrics
│
├── searxng/
│   ├── Dockerfile                   # SearXNG Container
│   ├── settings.yml                 # Engine Config
│   └── limiter.toml                 # Rate Limits
│
├── Dockerfile                       # NestJS Service
├── docker-compose.yml               # Local Development
├── package.json
├── tsconfig.json
├── nest-cli.json
└── CLAUDE.md
```

### 2.2 Docker Compose Setup

```yaml
# services/mana-search/docker-compose.yml
version: '3.8'

services:
  # NestJS API Service
  mana-search:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3021:3021"
    environment:
      NODE_ENV: development
      PORT: 3021
      SEARXNG_URL: http://searxng:8080
      REDIS_HOST: redis
      REDIS_PORT: 6379
      CACHE_TTL: 3600  # 1 hour
    depends_on:
      - searxng
      - redis
    networks:
      - manacore-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3021/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # SearXNG Meta-Suchmaschine
  searxng:
    image: searxng/searxng:latest
    volumes:
      - ./searxng/settings.yml:/etc/searxng/settings.yml:ro
      - ./searxng/limiter.toml:/etc/searxng/limiter.toml:ro
    environment:
      SEARXNG_BASE_URL: http://localhost:8080
      SEARXNG_SECRET: ${SEARXNG_SECRET:-change-me-in-production}
    networks:
      - manacore-network
    # Kein Port-Mapping - nur intern erreichbar
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8080/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - manacore-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  redis-data:

networks:
  manacore-network:
    external: true
```

### 2.3 SearXNG Konfiguration

```yaml
# services/mana-search/searxng/settings.yml
use_default_settings: true

general:
  instance_name: "ManaCore Search"
  debug: false
  privacypolicy_url: false
  donation_url: false
  contact_url: false
  enable_metrics: true

search:
  safe_search: 0
  autocomplete: "google"
  default_lang: "de-DE"
  formats:
    - html
    - json  # Wichtig für API-Nutzung

server:
  secret_key: ${SEARXNG_SECRET}
  limiter: true
  image_proxy: false
  method: "GET"
  # Nur lokaler Zugriff
  bind_address: "0.0.0.0"
  port: 8080

ui:
  static_use_hash: true
  default_theme: simple
  theme_args:
    simple_style: dark

# Aktivierte Suchmaschinen
engines:
  # Web Search
  - name: google
    engine: google
    shortcut: g
    disabled: false
    weight: 1.2

  - name: bing
    engine: bing
    shortcut: b
    disabled: false
    weight: 1.0

  - name: duckduckgo
    engine: duckduckgo
    shortcut: d
    disabled: false
    weight: 0.9

  - name: brave
    engine: brave
    shortcut: br
    disabled: false
    weight: 1.0

  - name: qwant
    engine: qwant
    shortcut: q
    disabled: false
    weight: 0.8

  # IT/Developer Search
  - name: github
    engine: github
    shortcut: gh
    disabled: false
    categories: [it]

  - name: stackoverflow
    engine: stackoverflow
    shortcut: so
    disabled: false
    categories: [it]

  - name: npm
    engine: npm
    shortcut: npm
    disabled: false
    categories: [it]

  # Wissenschaft
  - name: arxiv
    engine: arxiv
    shortcut: ar
    disabled: false
    categories: [science]

  - name: google scholar
    engine: google_scholar
    shortcut: gs
    disabled: false
    categories: [science]

  - name: semantic scholar
    engine: semantic_scholar
    shortcut: ss
    disabled: false
    categories: [science]

  - name: pubmed
    engine: pubmed
    shortcut: pm
    disabled: false
    categories: [science, health]

  # Wikipedia
  - name: wikipedia
    engine: wikipedia
    shortcut: w
    disabled: false
    weight: 1.1

  # News
  - name: google news
    engine: google_news
    shortcut: gn
    disabled: false
    categories: [news]

  - name: bing news
    engine: bing_news
    shortcut: bn
    disabled: false
    categories: [news]

outgoing:
  # Timeouts
  request_timeout: 5.0
  max_request_timeout: 15.0
  # User Agent Rotation
  useragent_suffix: ""
  # Proxy (optional)
  # proxies:
  #   http: "socks5://tor:9050"
  #   https: "socks5://tor:9050"

# Kategorien
categories_as_tabs:
  general:
  images:
  videos:
  news:
  science:
  it:
```

### 2.4 Rate Limiter

```toml
# services/mana-search/searxng/limiter.toml
[botdetection.ip_limit]
# Limit pro IP-Adresse
link_token = true
# Suchen pro Minute pro IP
limit = 30
# Burst erlaubt
burst = 10

[botdetection.ip_lists]
# Interne IPs (Docker) erlauben
pass_ip = [
    "172.16.0.0/12",   # Docker internal
    "192.168.0.0/16",  # Private networks
    "10.0.0.0/8",      # Private networks
    "127.0.0.1",       # Localhost
]
```

---

## 3. API-Endpoints

### 3.1 Search API

```typescript
// ============================================
// SEARCH ENDPOINTS
// ============================================

/**
 * Web-Suche durchführen
 * POST /api/v1/search
 */
interface SearchRequest {
  query: string;                    // Suchbegriff (required)
  options?: {
    categories?: SearchCategory[];  // ['general', 'news', 'science', 'it']
    engines?: string[];             // ['google', 'bing', 'duckduckgo']
    language?: string;              // 'de-DE', 'en-US'
    timeRange?: TimeRange;          // 'day', 'week', 'month', 'year'
    safeSearch?: 0 | 1 | 2;         // 0=off, 1=moderate, 2=strict
    limit?: number;                 // Max results (default: 10, max: 50)
  };
  cache?: {
    enabled?: boolean;              // Default: true
    ttl?: number;                   // Cache TTL in seconds
  };
}

interface SearchResponse {
  results: SearchResult[];
  meta: {
    query: string;
    totalResults: number;
    engines: string[];              // Welche Engines geantwortet haben
    duration: number;               // Dauer in ms
    cached: boolean;
    cacheKey?: string;
  };
}

interface SearchResult {
  url: string;
  title: string;
  snippet: string;                  // Kurzer Textauszug
  engine: string;                   // Welche Engine
  score: number;                    // Relevanz-Score (0-1)
  publishedDate?: string;           // Falls verfügbar
  thumbnail?: string;               // Vorschaubild URL
  category: string;                 // 'general', 'news', etc.
}

type SearchCategory = 'general' | 'news' | 'science' | 'it' | 'images' | 'videos';
type TimeRange = 'day' | 'week' | 'month' | 'year';

// ============================================
// Beispiel-Aufruf
// ============================================

POST /api/v1/search
{
  "query": "quantum computing basics",
  "options": {
    "categories": ["general", "science"],
    "engines": ["google", "bing", "wikipedia"],
    "language": "en-US",
    "limit": 10
  }
}

// Response
{
  "results": [
    {
      "url": "https://en.wikipedia.org/wiki/Quantum_computing",
      "title": "Quantum computing - Wikipedia",
      "snippet": "Quantum computing is a type of computation that harnesses...",
      "engine": "wikipedia",
      "score": 0.95,
      "category": "general"
    },
    // ...
  ],
  "meta": {
    "query": "quantum computing basics",
    "totalResults": 10,
    "engines": ["google", "bing", "wikipedia"],
    "duration": 1234,
    "cached": false
  }
}
```

### 3.2 Extract API

```typescript
// ============================================
// CONTENT EXTRACTION ENDPOINTS
// ============================================

/**
 * Inhalt einer URL extrahieren
 * POST /api/v1/extract
 */
interface ExtractRequest {
  url: string;                      // URL zum Extrahieren
  options?: {
    includeHtml?: boolean;          // Original HTML mitliefern
    includeMarkdown?: boolean;      // Als Markdown konvertieren
    maxLength?: number;             // Max Zeichen (default: unlimited)
    extractImages?: boolean;        // Bilder extrahieren
    extractLinks?: boolean;         // Links extrahieren
    timeout?: number;               // Timeout in ms (default: 10000)
  };
}

interface ExtractResponse {
  success: boolean;
  content?: ExtractedContent;
  error?: string;
  meta: {
    url: string;
    duration: number;
    cached: boolean;
    contentType: string;
  };
}

interface ExtractedContent {
  title: string;
  description?: string;
  author?: string;
  publishedDate?: string;
  siteName?: string;

  // Content
  text: string;                     // Plain text
  markdown?: string;                // Markdown (wenn angefordert)
  html?: string;                    // Original HTML (wenn angefordert)

  // Word/Read Stats
  wordCount: number;
  readingTime: number;              // Minuten

  // Media
  images?: ExtractedImage[];
  links?: ExtractedLink[];

  // Open Graph / Meta
  ogImage?: string;
  ogType?: string;
  language?: string;
}

interface ExtractedImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface ExtractedLink {
  url: string;
  text: string;
  isExternal: boolean;
}

// ============================================
// Beispiel-Aufruf
// ============================================

POST /api/v1/extract
{
  "url": "https://example.com/article",
  "options": {
    "includeMarkdown": true,
    "extractImages": true,
    "maxLength": 5000
  }
}

// Response
{
  "success": true,
  "content": {
    "title": "Understanding Quantum Computing",
    "author": "Dr. Jane Smith",
    "publishedDate": "2025-01-15",
    "text": "Quantum computing represents a fundamental...",
    "markdown": "# Understanding Quantum Computing\n\nQuantum computing...",
    "wordCount": 1523,
    "readingTime": 7,
    "images": [
      { "url": "https://...", "alt": "Qubit diagram" }
    ]
  },
  "meta": {
    "url": "https://example.com/article",
    "duration": 856,
    "cached": false,
    "contentType": "text/html"
  }
}
```

### 3.3 Bulk Operations

```typescript
// ============================================
// BULK ENDPOINTS
// ============================================

/**
 * Mehrere URLs gleichzeitig extrahieren
 * POST /api/v1/extract/bulk
 */
interface BulkExtractRequest {
  urls: string[];                   // Max 20 URLs
  options?: ExtractOptions;         // Gleiche Optionen für alle
  concurrency?: number;             // Parallele Requests (default: 5)
}

interface BulkExtractResponse {
  results: Array<{
    url: string;
    success: boolean;
    content?: ExtractedContent;
    error?: string;
  }>;
  meta: {
    total: number;
    successful: number;
    failed: number;
    duration: number;
  };
}

/**
 * Suche + Extraktion in einem Schritt
 * POST /api/v1/search-and-extract
 */
interface SearchAndExtractRequest {
  query: string;
  searchOptions?: SearchOptions;
  extractOptions?: ExtractOptions;
  extractLimit?: number;            // Wie viele Results extrahieren (default: 5)
}

interface SearchAndExtractResponse {
  results: Array<SearchResult & {
    extracted?: ExtractedContent;
    extractError?: string;
  }>;
  meta: SearchMeta & {
    extracted: number;
    extractFailed: number;
  };
}
```

### 3.4 Admin/Health Endpoints

```typescript
// ============================================
// ADMIN ENDPOINTS
// ============================================

// Health Check
GET /health
Response: {
  status: "ok" | "degraded" | "error",
  service: "mana-search",
  version: "1.0.0",
  timestamp: "2025-01-28T12:00:00Z",
  components: {
    searxng: { status: "ok", latency: 45 },
    redis: { status: "ok", latency: 2 },
    extraction: { status: "ok" }
  }
}

// SearXNG Engine Status
GET /api/v1/admin/engines
Response: {
  engines: [
    { name: "google", status: "ok", avgLatency: 234 },
    { name: "bing", status: "ok", avgLatency: 189 },
    { name: "duckduckgo", status: "degraded", avgLatency: 1234 },
    // ...
  ]
}

// Cache Stats
GET /api/v1/admin/cache/stats
Response: {
  hits: 12453,
  misses: 3421,
  hitRate: 0.78,
  size: "45MB",
  keys: 8234
}

// Cache leeren
DELETE /api/v1/admin/cache
Response: { cleared: true, keysRemoved: 8234 }

// Prometheus Metrics
GET /metrics
Response: # Prometheus format
mana_search_requests_total{endpoint="/search"} 12453
mana_search_latency_seconds{quantile="0.5"} 1.2
mana_search_cache_hits_total 9842
mana_search_extraction_success_total 8234
...
```

---

## 4. Implementierung

### 4.1 Search Service

```typescript
// src/search/search.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { SearxngProvider } from './providers/searxng.provider';
import { SearchRequest, SearchResponse } from './dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly searxngProvider: SearxngProvider,
  ) {}

  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    // 1. Cache prüfen
    const cacheKey = this.buildCacheKey(request);
    if (request.cache?.enabled !== false) {
      const cached = await this.cacheService.get<SearchResponse>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for: ${request.query}`);
        return { ...cached, meta: { ...cached.meta, cached: true } };
      }
    }

    // 2. SearXNG abfragen
    const results = await this.searxngProvider.search({
      q: request.query,
      categories: request.options?.categories?.join(','),
      engines: request.options?.engines?.join(','),
      language: request.options?.language || 'de-DE',
      time_range: request.options?.timeRange,
      safesearch: request.options?.safeSearch ?? 0,
      format: 'json',
    });

    // 3. Results normalisieren & ranken
    const normalizedResults = this.normalizeResults(results, request.options?.limit);

    // 4. Response bauen
    const response: SearchResponse = {
      results: normalizedResults,
      meta: {
        query: request.query,
        totalResults: normalizedResults.length,
        engines: [...new Set(normalizedResults.map(r => r.engine))],
        duration: Date.now() - startTime,
        cached: false,
        cacheKey,
      },
    };

    // 5. Cachen
    if (request.cache?.enabled !== false) {
      const ttl = request.cache?.ttl || this.configService.get('cache.ttl', 3600);
      await this.cacheService.set(cacheKey, response, ttl);
    }

    return response;
  }

  private buildCacheKey(request: SearchRequest): string {
    const parts = [
      'search',
      request.query,
      request.options?.categories?.sort().join('-') || 'all',
      request.options?.engines?.sort().join('-') || 'all',
      request.options?.language || 'de-DE',
      request.options?.timeRange || 'any',
    ];
    return parts.join(':');
  }

  private normalizeResults(
    rawResults: SearxngResult[],
    limit = 10,
  ): SearchResult[] {
    return rawResults
      .map((r) => ({
        url: r.url,
        title: r.title,
        snippet: r.content || '',
        engine: r.engine,
        score: r.score || 0.5,
        publishedDate: r.publishedDate,
        thumbnail: r.thumbnail,
        category: r.category || 'general',
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(limit, 50));
  }
}
```

### 4.2 SearXNG Provider

```typescript
// src/search/providers/searxng.provider.ts
import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SearxngQuery {
  q: string;
  categories?: string;
  engines?: string;
  language?: string;
  time_range?: string;
  safesearch?: number;
  format: 'json';
}

interface SearxngResponse {
  query: string;
  results: SearxngResult[];
  suggestions: string[];
  infoboxes: any[];
}

export interface SearxngResult {
  url: string;
  title: string;
  content?: string;
  engine: string;
  score?: number;
  category?: string;
  publishedDate?: string;
  thumbnail?: string;
}

@Injectable()
export class SearxngProvider {
  private readonly logger = new Logger(SearxngProvider.name);
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('searxng.url', 'http://searxng:8080');
  }

  async search(query: SearxngQuery): Promise<SearxngResult[]> {
    const url = new URL('/search', this.baseUrl);

    // Query-Parameter setzen
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    this.logger.debug(`SearXNG request: ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (!response.ok) {
        throw new HttpException(
          `SearXNG error: ${response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      const data: SearxngResponse = await response.json();
      return data.results;
    } catch (error) {
      this.logger.error(`SearXNG search failed: ${error.message}`);
      throw new HttpException(
        'Search service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/healthz`, {
        signal: AbortSignal.timeout(5000),
      });
      return {
        status: response.ok ? 'ok' : 'error',
        latency: Date.now() - start,
      };
    } catch {
      return { status: 'error', latency: Date.now() - start };
    }
  }
}
```

### 4.3 Content Extractor

```typescript
// src/extract/extract.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { extract } from '@extractus/article-extractor';
import { CacheService } from '../cache/cache.service';
import { ExtractRequest, ExtractResponse, ExtractedContent } from './dto';
import TurndownService from 'turndown';

@Injectable()
export class ExtractService {
  private readonly logger = new Logger(ExtractService.name);
  private readonly turndown = new TurndownService();

  constructor(private readonly cacheService: CacheService) {
    // Turndown konfigurieren
    this.turndown.addRule('codeBlocks', {
      filter: ['pre', 'code'],
      replacement: (content) => `\`\`\`\n${content}\n\`\`\``,
    });
  }

  async extract(request: ExtractRequest): Promise<ExtractResponse> {
    const startTime = Date.now();

    // Cache prüfen
    const cacheKey = `extract:${request.url}`;
    const cached = await this.cacheService.get<ExtractResponse>(cacheKey);
    if (cached) {
      return { ...cached, meta: { ...cached.meta, cached: true } };
    }

    try {
      // Artikel extrahieren
      const article = await extract(request.url, {
        timeout: request.options?.timeout || 10000,
      });

      if (!article) {
        return {
          success: false,
          error: 'Could not extract content from URL',
          meta: {
            url: request.url,
            duration: Date.now() - startTime,
            cached: false,
            contentType: 'unknown',
          },
        };
      }

      // Content aufbereiten
      let text = article.content || '';
      text = this.cleanText(text);

      // Optional: Länge begrenzen
      if (request.options?.maxLength && text.length > request.options.maxLength) {
        text = text.substring(0, request.options.maxLength) + '...';
      }

      const content: ExtractedContent = {
        title: article.title || '',
        description: article.description,
        author: article.author,
        publishedDate: article.published,
        siteName: article.source,

        text,
        wordCount: text.split(/\s+/).length,
        readingTime: Math.ceil(text.split(/\s+/).length / 200),

        ogImage: article.image,
        language: article.language,
      };

      // Markdown generieren
      if (request.options?.includeMarkdown) {
        content.markdown = this.turndown.turndown(article.content || '');
      }

      // HTML beibehalten
      if (request.options?.includeHtml) {
        content.html = article.content;
      }

      const response: ExtractResponse = {
        success: true,
        content,
        meta: {
          url: request.url,
          duration: Date.now() - startTime,
          cached: false,
          contentType: 'text/html',
        },
      };

      // Cachen (24h)
      await this.cacheService.set(cacheKey, response, 86400);

      return response;
    } catch (error) {
      this.logger.error(`Extraction failed for ${request.url}: ${error.message}`);
      return {
        success: false,
        error: error.message,
        meta: {
          url: request.url,
          duration: Date.now() - startTime,
          cached: false,
          contentType: 'unknown',
        },
      };
    }
  }

  private cleanText(html: string): string {
    // HTML-Tags entfernen, aber Struktur erhalten
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
```

### 4.4 Cache Service

```typescript
// src/cache/cache.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis;

  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.client = new Redis({
      host: this.configService.get('redis.host', 'redis'),
      port: this.configService.get('redis.port', 6379),
      keyPrefix: 'mana-search:',
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (data) {
        this.stats.hits++;
        return JSON.parse(data);
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<number> {
    const keys = await this.client.keys('mana-search:*');
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
    return keys.length;
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.client.ping();
      return { status: 'ok', latency: Date.now() - start };
    } catch {
      return { status: 'error', latency: Date.now() - start };
    }
  }
}
```

---

## 5. Client-Integration

### 5.1 Shared Package

```typescript
// packages/shared-search-client/src/index.ts
export * from './search-client';
export * from './types';

// packages/shared-search-client/src/types.ts
export interface SearchOptions {
  categories?: ('general' | 'news' | 'science' | 'it')[];
  engines?: string[];
  language?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year';
  limit?: number;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  engine: string;
  score: number;
  publishedDate?: string;
}

export interface ExtractOptions {
  includeMarkdown?: boolean;
  maxLength?: number;
}

export interface ExtractedContent {
  title: string;
  text: string;
  markdown?: string;
  wordCount: number;
  author?: string;
  publishedDate?: string;
}

// packages/shared-search-client/src/search-client.ts
export class ManaSearchClient {
  constructor(private readonly baseUrl: string) {}

  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const response = await fetch(`${this.baseUrl}/api/v1/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, options }),
    });

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  }

  async extract(url: string, options?: ExtractOptions): Promise<ExtractedContent> {
    const response = await fetch(`${this.baseUrl}/api/v1/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, options }),
    });

    if (!response.ok) {
      throw new Error(`Extract failed: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    return data.content;
  }

  async searchAndExtract(
    query: string,
    searchOptions?: SearchOptions,
    extractOptions?: ExtractOptions,
    extractLimit = 5,
  ): Promise<Array<SearchResult & { content?: ExtractedContent }>> {
    const response = await fetch(`${this.baseUrl}/api/v1/search-and-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        searchOptions,
        extractOptions,
        extractLimit,
      }),
    });

    if (!response.ok) {
      throw new Error(`Search-and-extract failed: ${response.status}`);
    }

    const data = await response.json();
    return data.results;
  }
}
```

### 5.2 Nutzung in Questions App

```typescript
// apps/questions/apps/backend/src/research/research.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManaSearchClient } from '@manacore/shared-search-client';

@Injectable()
export class ResearchService {
  private readonly searchClient: ManaSearchClient;

  constructor(private readonly configService: ConfigService) {
    this.searchClient = new ManaSearchClient(
      this.configService.get('MANA_SEARCH_URL', 'http://mana-search:3021'),
    );
  }

  async research(question: Question, depth: ResearchDepth) {
    // 1. Suchen + Extrahieren in einem Schritt
    const results = await this.searchClient.searchAndExtract(
      question.title,
      {
        categories: ['general', 'science'],
        limit: this.getLimit(depth),
      },
      { includeMarkdown: true },
      this.getExtractLimit(depth),
    );

    // 2. AI Synthesis mit extrahiertem Content
    const synthesis = await this.aiService.synthesize(
      question,
      results.map(r => ({
        url: r.url,
        title: r.title,
        content: r.content?.text || r.snippet,
      })),
    );

    return synthesis;
  }

  private getLimit(depth: ResearchDepth): number {
    return { quick: 5, standard: 10, deep: 20 }[depth];
  }

  private getExtractLimit(depth: ResearchDepth): number {
    return { quick: 2, standard: 5, deep: 10 }[depth];
  }
}
```

### 5.3 Nutzung in Chat App

```typescript
// apps/chat/apps/backend/src/ai/web-grounding.service.ts
import { Injectable } from '@nestjs/common';
import { ManaSearchClient } from '@manacore/shared-search-client';

@Injectable()
export class WebGroundingService {
  private readonly searchClient: ManaSearchClient;

  constructor() {
    this.searchClient = new ManaSearchClient(
      process.env.MANA_SEARCH_URL || 'http://mana-search:3021',
    );
  }

  async groundWithWebSearch(userMessage: string): Promise<string> {
    // Suche durchführen
    const results = await this.searchClient.search(userMessage, {
      categories: ['general'],
      limit: 5,
    });

    // Context für AI bauen
    const context = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.url}`)
      .join('\n\n');

    return context;
  }
}
```

---

## 6. Deployment

### 6.1 Production Docker Compose

```yaml
# docker-compose.yml (Root-Level, Production)
services:
  mana-search:
    image: ghcr.io/manacore/mana-search:latest
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3021
      SEARXNG_URL: http://searxng:8080
      REDIS_HOST: redis
      REDIS_PORT: 6379
      CACHE_TTL: 3600
    depends_on:
      - searxng
      - redis
    networks:
      - manacore-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.search.rule=Host(`search.mana.internal`)"
      - "traefik.http.services.search.loadbalancer.server.port=3021"

  searxng:
    image: searxng/searxng:latest
    restart: unless-stopped
    volumes:
      - ./services/mana-search/searxng/settings.yml:/etc/searxng/settings.yml:ro
      - ./services/mana-search/searxng/limiter.toml:/etc/searxng/limiter.toml:ro
    environment:
      SEARXNG_SECRET: ${SEARXNG_SECRET}
    networks:
      - manacore-network
    # Kein externes Port-Mapping - nur intern
```

### 6.2 Development Script

```bash
# Root package.json scripts
{
  "scripts": {
    "dev:search": "docker-compose -f services/mana-search/docker-compose.yml up -d",
    "dev:search:logs": "docker-compose -f services/mana-search/docker-compose.yml logs -f",
    "dev:search:stop": "docker-compose -f services/mana-search/docker-compose.yml down"
  }
}
```

### 6.3 Environment Variables

```env
# .env.development
MANA_SEARCH_URL=http://localhost:3021

# Production
MANA_SEARCH_URL=http://mana-search:3021
SEARXNG_SECRET=your-production-secret
```

---

## 7. Monitoring

### 7.1 Prometheus Metrics

```typescript
// src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();

  // Request Counter
  private readonly requestsTotal = new Counter({
    name: 'mana_search_requests_total',
    help: 'Total number of search requests',
    labelNames: ['endpoint', 'status'],
    registers: [this.registry],
  });

  // Latency Histogram
  private readonly latency = new Histogram({
    name: 'mana_search_latency_seconds',
    help: 'Request latency in seconds',
    labelNames: ['endpoint'],
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [this.registry],
  });

  // Cache Metrics
  private readonly cacheHits = new Counter({
    name: 'mana_search_cache_hits_total',
    help: 'Total cache hits',
    registers: [this.registry],
  });

  private readonly cacheMisses = new Counter({
    name: 'mana_search_cache_misses_total',
    help: 'Total cache misses',
    registers: [this.registry],
  });

  // SearXNG Engine Status
  private readonly engineStatus = new Gauge({
    name: 'mana_search_engine_status',
    help: 'SearXNG engine status (1=ok, 0=error)',
    labelNames: ['engine'],
    registers: [this.registry],
  });

  recordRequest(endpoint: string, status: number, duration: number) {
    this.requestsTotal.inc({ endpoint, status: String(status) });
    this.latency.observe({ endpoint }, duration / 1000);
  }

  recordCacheHit() {
    this.cacheHits.inc();
  }

  recordCacheMiss() {
    this.cacheMisses.inc();
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

### 7.2 Grafana Dashboard

```json
{
  "title": "Mana Search Service",
  "panels": [
    {
      "title": "Requests/min",
      "type": "graph",
      "targets": [
        {
          "expr": "rate(mana_search_requests_total[1m])",
          "legendFormat": "{{endpoint}}"
        }
      ]
    },
    {
      "title": "Latency p95",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(mana_search_latency_seconds_bucket[5m]))",
          "legendFormat": "{{endpoint}}"
        }
      ]
    },
    {
      "title": "Cache Hit Rate",
      "type": "gauge",
      "targets": [
        {
          "expr": "rate(mana_search_cache_hits_total[5m]) / (rate(mana_search_cache_hits_total[5m]) + rate(mana_search_cache_misses_total[5m]))"
        }
      ]
    }
  ]
}
```

---

## 8. Implementierungs-Roadmap

### Phase 1: Core Setup (3-4 Tage)

```
[ ] Projekt-Struktur erstellen
    [ ] services/mana-search/
    [ ] NestJS Basis-Setup
    [ ] Docker Compose

[ ] SearXNG Setup
    [ ] Dockerfile/Image
    [ ] settings.yml mit Engines
    [ ] limiter.toml
    [ ] Health-Check

[ ] Redis Setup
    [ ] Docker Container
    [ ] Connection Service
```

### Phase 2: Search API (2-3 Tage)

```
[ ] SearXNG Provider
    [ ] API-Integration
    [ ] Error Handling
    [ ] Retry Logic

[ ] Search Service
    [ ] Query-Verarbeitung
    [ ] Result-Normalisierung
    [ ] Caching

[ ] Search Controller
    [ ] POST /api/v1/search
    [ ] Validation (DTOs)
```

### Phase 3: Extract API (2-3 Tage)

```
[ ] Article Extractor
    [ ] @extractus/article-extractor Integration
    [ ] Markdown Conversion
    [ ] Error Handling

[ ] Extract Service
    [ ] URL-Verarbeitung
    [ ] Caching

[ ] Bulk Operations
    [ ] POST /api/v1/extract/bulk
    [ ] POST /api/v1/search-and-extract
```

### Phase 4: Shared Package (1-2 Tage)

```
[ ] @manacore/shared-search-client
    [ ] ManaSearchClient Klasse
    [ ] TypeScript Types
    [ ] NPM Package Config
```

### Phase 5: Monitoring & Polish (1-2 Tage)

```
[ ] Health Endpoints
[ ] Prometheus Metrics
[ ] Grafana Dashboard
[ ] Dokumentation (CLAUDE.md)
[ ] Root package.json Scripts
```

---

## 9. Offene Fragen

1. **Tor-Integration**: Soll SearXNG über Tor laufen für mehr Anonymität?
2. **API-Key-Auth**: Braucht der Service Authentifizierung oder ist er nur intern?
3. **Fallback-Provider**: Soll bei SearXNG-Ausfall automatisch auf Brave API gewechselt werden?
4. **Content-Limits**: Maximale Textlänge für Extraktion?

---

## 10. Ressourcen-Schätzung

| Komponente | RAM | CPU | Storage |
|------------|-----|-----|---------|
| mana-search (NestJS) | 256MB | 0.25 | - |
| SearXNG | 512MB | 0.5 | - |
| Redis | 128MB | 0.1 | 100MB |
| **Total** | **~1GB** | **~1 vCPU** | **100MB** |

Passt problemlos auf bestehende Infrastruktur (Mac Mini).

---

*Dokument-Status: Entwurf - Zur Überprüfung*
