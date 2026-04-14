# Mana Microservices - API Overview

Dieses Dokument gibt einen Überblick über alle Microservices im Mana-Monorepo und beschreibt Optionen, diese als öffentliche APIs anzubieten.

## Inhaltsverzeichnis

1. [Service-Übersicht](#service-übersicht)
2. [Core Services (API-fähig)](#core-services-api-fähig)
3. [Bot Services](#bot-services)
4. [Aktuelle Architektur](#aktuelle-architektur)
5. [API-Strategien](#api-strategien)
6. [Empfehlung](#empfehlung)

---

## Service-Übersicht

| Service | Port | Typ | API-Ready | Beschreibung |
|---------|------|-----|-----------|--------------|
| **mana-auth** | 3001 | NestJS | ✅ | Zentrale Authentifizierung & Credits |
| **mana-search** | 3021 | NestJS | ✅ | Web-Suche & Content-Extraktion |
| **mana-stt** | 3020 | FastAPI | ✅ | Speech-to-Text (Whisper, Voxtral) |
| **mana-tts** | 3022 | FastAPI | ✅ | Text-to-Speech (Kokoro, F5-TTS) |
| Matrix Bots | 3310-3318 | NestJS | ❌ | Matrix-basierte Bots |
| Telegram Bots | 3300-3304 | NestJS | ❌ | Telegram-basierte Bots |

---

## Core Services (API-fähig)

Diese Services haben bereits REST-APIs und eignen sich für öffentliche Bereitstellung:

### 1. mana-auth (Port 3001)

**Zweck:** Zentrale Authentifizierung, JWT-Tokens, Credit-System

**Endpoints:**
```
POST /api/v1/auth/register     - Benutzer registrieren
POST /api/v1/auth/login        - Login (JWT erhalten)
POST /api/v1/auth/validate     - Token validieren
POST /api/v1/auth/refresh      - Token erneuern
GET  /api/v1/auth/jwks         - JWKS für Token-Verifikation
GET  /api/v1/credits/balance   - Credit-Guthaben
POST /api/v1/credits/use       - Credits verbrauchen
```

**Stack:** NestJS + Better Auth + Drizzle + PostgreSQL + Redis

---

### 2. mana-search (Port 3021)

**Zweck:** Meta-Suchmaschine mit Content-Extraktion

**Endpoints:**
```
POST /api/v1/search            - Web-Suche (Google, Bing, DuckDuckGo, etc.)
POST /api/v1/extract           - URL-Inhalt extrahieren (Markdown)
POST /api/v1/extract/bulk      - Bulk-Extraktion (max 20 URLs)
GET  /api/v1/search/engines    - Verfügbare Suchmaschinen
GET  /health                   - Health Check
GET  /metrics                  - Prometheus Metriken
```

**Stack:** NestJS + SearXNG + Redis (Cache: 1h Suche, 24h Extraktion)

**Beispiel-Request:**
```json
POST /api/v1/search
{
  "query": "machine learning",
  "options": {
    "categories": ["general", "science"],
    "engines": ["google", "wikipedia"],
    "limit": 10
  }
}
```

---

### 3. mana-stt (Port 3020)

**Zweck:** Audio-Transkription (optimiert für Deutsch)

**Endpoints:**
```
POST /transcribe               - Whisper Large V3 Turbo
POST /transcribe/voxtral       - Voxtral Mini (3B)
POST /transcribe/auto          - Automatische Modellwahl
GET  /models                   - Verfügbare Modelle
GET  /health                   - Health Check
```

**Unterstützte Formate:** MP3, WAV, M4A, FLAC, OGG, WebM, MP4 (max 100MB)

**Stack:** Python + FastAPI + MLX (Apple Silicon optimiert)

**Beispiel-Request:**
```bash
curl -X POST http://localhost:3020/transcribe \
  -F "file=@audio.mp3" \
  -F "language=de"
```

---

### 4. mana-tts (Port 3022)

**Zweck:** Text-zu-Sprache Synthese

**Endpoints:**
```
POST /synthesize/kokoro        - Schnelle Preset-Stimmen (30+)
POST /synthesize               - F5-TTS Voice Cloning
POST /synthesize/auto          - Automatische Modellwahl
GET  /voices                   - Alle verfügbaren Stimmen
POST /voices                   - Custom Voice registrieren
DELETE /voices/{id}            - Custom Voice löschen
GET  /health                   - Health Check
```

**Modelle:**
- Kokoro-82M (~300MB): 30+ Preset-Stimmen, schnell
- F5-TTS (~6GB): Voice Cloning mit Referenz-Audio

**Stack:** Python + FastAPI + MLX (Apple Silicon optimiert)

**Beispiel-Request:**
```json
POST /synthesize/kokoro
{
  "text": "Hallo Welt",
  "voice": "af_heart",
  "speed": 1.0,
  "output_format": "mp3"
}
```

---

## Bot Services

Diese Services sind für Matrix/Telegram konzipiert, nicht als direkte APIs:

| Bot | Port | Funktion |
|-----|------|----------|
| matrix-mana-bot | 3310 | All-in-One (AI, Todos, Kalender) |
| matrix-ollama-bot | 3311 | LLM Chat (lokales Ollama) |
| matrix-stats-bot | 3312 | Analytics Reports |
| matrix-project-doc-bot | 3313 | Blog-Generierung |
| matrix-todo-bot | 3314 | Task Management |
| matrix-calendar-bot | 3315 | Kalender/Events |
| matrix-food-bot | 3316 | Ernährungs-Tracking |
| matrix-zitare-bot | 3317 | Zitate |
| matrix-clock-bot | 3318 | Timer/Alarme |
| matrix-tts-bot | 3023 | Sprachausgabe |

---

## Aktuelle Architektur

```
                    ┌──────────────────────────────────┐
                    │         Clients                   │
                    │  (Web, Mobile, Bots)             │
                    └────────────┬─────────────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │ mana-auth│   │  mana-search  │   │   mana-stt    │
    │   Port 3001   │   │   Port 3021   │   │   Port 3020   │
    │               │   │               │   │               │
    │ • Auth/JWT    │   │ • Web Search  │   │ • Whisper     │
    │ • Credits     │   │ • Extraction  │   │ • Voxtral     │
    │ • Stripe      │   │ • SearXNG     │   │               │
    └───────────────┘   └───────────────┘   └───────────────┘
            │                                        │
            │                    ┌───────────────────┤
            │                    │                   │
            ▼                    ▼                   ▼
    ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
    │   mana-tts    │   │  Matrix Bots  │   │ Telegram Bots │
    │   Port 3022   │   │  (10 Bots)    │   │  (6 Bots)     │
    │               │   │               │   │               │
    │ • Kokoro      │   │ • GDPR-konform│   │ • Cloud-based │
    │ • F5-TTS      │   │ • Self-hosted │   │               │
    └───────────────┘   └───────────────┘   └───────────────┘
```

---

## API-Strategien

### Option 1: Direkte Exposition (Einfach)

**Beschreibung:** Jeden Service direkt über eigenen Port/Subdomain exponieren.

```
api.mana.how/auth     → mana-auth:3001
api.mana.how/search   → mana-search:3021
api.mana.how/stt      → mana-stt:3020
api.mana.how/tts      → mana-tts:3022
```

**Vorteile:**
- Schnell umzusetzen
- Kein zusätzlicher Service
- Einfaches Debugging

**Nachteile:**
- Keine zentrale Rate-Limiting
- Keine einheitliche Auth
- Kein API-Key Management
- Schwierige Abrechnung

**Aufwand:** ~1-2 Tage (Nginx/Traefik Konfiguration)

---

### Option 2: API Gateway (Kong, Traefik, etc.)

**Beschreibung:** Zentraler Gateway vor allen Services.

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Kong/Traefik)│
                    │                 │
                    │ • Rate Limiting │
                    │ • API Keys      │
                    │ • Logging       │
                    │ • Metrics       │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
    mana-auth           mana-search           mana-stt
```

**Vorteile:**
- Zentrale Authentifizierung
- Rate Limiting pro API-Key
- Request/Response Logging
- Einfache Abrechnung möglich
- SSL-Terminierung

**Nachteile:**
- Zusätzliche Infrastruktur
- Mehr Komplexität
- Single Point of Failure

**Empfohlene Tools:**
| Tool | Beschreibung | Aufwand |
|------|--------------|---------|
| **Kong** | Enterprise-ready, Plugin-System | Mittel |
| **Traefik** | Kubernetes-nativ, einfach | Gering |
| **APISIX** | High-performance, Lua-Plugins | Mittel |
| **Tyk** | Open Source, Dashboard | Mittel |

**Aufwand:** ~3-5 Tage

---

### Option 3: Custom API Service (NestJS)

**Beschreibung:** Eigener API-Service als Facade vor den Microservices.

```typescript
// api-gateway/src/app.module.ts
@Module({
  imports: [
    AuthModule,      // API Key Validation
    RateLimitModule, // Redis-based rate limiting
    SearchModule,    // Proxy zu mana-search
    SttModule,       // Proxy zu mana-stt
    TtsModule,       // Proxy zu mana-tts
    BillingModule,   // Credit/Usage tracking
  ],
})
export class AppModule {}
```

**Features:**
- API-Key Management (eigene DB-Tabelle)
- Usage Tracking pro Key
- Credit-System Integration
- Flexible Rate Limits
- Custom Transformationen

**Vorteile:**
- Volle Kontrolle
- Integration mit mana-auth
- TypeScript/NestJS Konsistenz
- Einfache Erweiterung

**Nachteile:**
- Mehr Entwicklungsaufwand
- Eigene Wartung

**Aufwand:** ~1-2 Wochen

---

### Option 4: Serverless/Edge (Cloudflare Workers)

**Beschreibung:** Edge-basierter API-Proxy mit Cloudflare Workers.

```javascript
// workers/api-proxy/src/index.ts
export default {
  async fetch(request, env) {
    const apiKey = request.headers.get('X-API-Key');

    // Rate limiting via KV
    const rateLimit = await env.RATE_LIMITS.get(apiKey);
    if (rateLimit > 1000) {
      return new Response('Rate limit exceeded', { status: 429 });
    }

    // Route to backend
    const url = new URL(request.url);
    if (url.pathname.startsWith('/v1/search')) {
      return fetch(`https://search.internal.mana.how${url.pathname}`, request);
    }
    // ...
  }
};
```

**Vorteile:**
- Global verteilt (Edge)
- Sehr schnell
- Auto-Scaling
- DDoS-Schutz inklusive

**Nachteile:**
- Vendor Lock-in
- Begrenzte Rechenzeit (50ms CPU)
- Nicht für lange Requests (STT/TTS)

**Aufwand:** ~3-5 Tage

---

### Option 5: Managed API Platform (Rapid API, etc.)

**Beschreibung:** APIs auf Marketplace-Plattform veröffentlichen.

**Plattformen:**
| Plattform | Vorteile | Nachteile |
|-----------|----------|-----------|
| **RapidAPI** | Große Reichweite, Abrechnung | 20% Commission |
| **AWS API Gateway** | AWS-Integration | Komplexität |
| **Google Cloud Endpoints** | GCP-Integration | Vendor Lock-in |
| **Azure API Management** | Enterprise Features | Kosten |

**Vorteile:**
- Sofortige Monetarisierung
- Bestehendes Billing
- Marketing/Discovery

**Nachteile:**
- Hohe Gebühren (15-20%)
- Weniger Kontrolle
- Vendor Lock-in

**Aufwand:** ~1 Woche

---

## Empfehlung

### Kurzfristig (MVP): Option 2 - Traefik API Gateway

```yaml
# docker-compose.api.yml
services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.websecure.address=:443"
    ports:
      - "443:443"
    labels:
      - "traefik.http.middlewares.api-auth.plugin.apikey.headerName=X-API-Key"
      - "traefik.http.middlewares.rate-limit.ratelimit.average=100"

  mana-search:
    labels:
      - "traefik.http.routers.search.rule=Host(`api.mana.how`) && PathPrefix(`/v1/search`)"
      - "traefik.http.routers.search.middlewares=api-auth,rate-limit"
```

**Warum Traefik?**
- Bereits im Stack (Docker-native)
- Einfache Konfiguration via Labels
- Built-in Rate Limiting
- Let's Encrypt Integration
- Dashboard für Monitoring

**Aufwand:** ~2-3 Tage

---

### Mittelfristig: Option 3 - Custom NestJS Gateway

Sobald komplexere Anforderungen entstehen:
- Flexible Pricing Tiers
- Usage-based Billing
- Webhook-Integrationen
- SDK-Generierung

**Struktur:**
```
services/
  mana-api-gateway/
    src/
      modules/
        auth/           # API Key Management
        billing/        # Usage Tracking
        proxy/          # Service Proxying
      guards/
        api-key.guard.ts
        rate-limit.guard.ts
```

---

## Nächste Schritte

1. **Entscheidung:** Welche Option passt am besten?
2. **API Design:** OpenAPI Spec für alle Endpoints
3. **Pricing:** Tier-Modell definieren (Free/Pro/Enterprise)
4. **Documentation:** API-Docs mit Redoc/Swagger
5. **SDK:** Client-Libraries generieren (TypeScript, Python)

---

## Anhang: Port-Übersicht

| Port | Service | Typ |
|------|---------|-----|
| 3001 | mana-auth | Auth |
| 3020 | mana-stt | AI/ML |
| 3021 | mana-search | Search |
| 3022 | mana-tts | AI/ML |
| 3023 | matrix-tts-bot | Bot |
| 3300 | telegram-stats-bot | Bot |
| 3301 | telegram-ollama-bot | Bot |
| 3304 | telegram-todo-bot | Bot |
| 3310 | matrix-mana-bot | Bot |
| 3311 | matrix-ollama-bot | Bot |
| 3312 | matrix-stats-bot | Bot |
| 3313 | matrix-project-doc-bot | Bot |
| 3314 | matrix-todo-bot | Bot |
| 3315 | matrix-calendar-bot | Bot |
| 3316 | matrix-food-bot | Bot |
| 3317 | matrix-zitare-bot | Bot |
| 3318 | matrix-clock-bot | Bot |
