---
title: 'Bot-Offensive: 3 Telegram Bots + Matrix Self-Hosting für DSGVO-Compliance'
description: 'Telegram Calendar/Contacts/Chat Bots, Matrix Synapse Self-Hosting, Model Comparison Feature, Guest Welcome Modal und Local STT Integration'
date: 2026-01-27
author: 'Till Schneider'
category: 'feature'
tags:
  [
    'telegram-bot',
    'matrix',
    'synapse',
    'dsgvo',
    'gdpr',
    'self-hosting',
    'chat',
    'ai',
    'speech-to-text',
    'guest-mode',
  ]
featured: true
commits: 20
readTime: 12
---

Intensiver Tag (und Nacht) mit Fokus auf **Bot-Entwicklung** und **DSGVO-konforme Messaging-Infrastruktur**. Die wichtigsten Errungenschaften:

- **3 neue Telegram Bots** (Calendar, Contacts, Chat)
- **Matrix Self-Hosting** mit Synapse + Element Web
- **4 Matrix Bots** für DSGVO-Compliance
- **Model Comparison** Feature in Chat App
- **Guest Welcome Modal** für alle Apps
- **Local STT Integration** für Project Doc Bot
- **Codebase Cleanup** (Maerchenzauber entfernt)

---

## Telegram Bots

### telegram-calendar-bot

Neuer Bot für Kalender-Integration via Telegram:

```
services/telegram-calendar-bot/
├── src/
│   ├── bot/           # Telegraf Bot Logic
│   ├── calendar/      # Calendar API Client
│   ├── reminder/      # Reminder Scheduler
│   └── user/          # User Linking Service
```

**Commands:**

| Command             | Beschreibung             |
| ------------------- | ------------------------ |
| `/today`            | Heutige Termine          |
| `/tomorrow`         | Termine für morgen       |
| `/week`             | Wochenübersicht          |
| `/next [n]`         | Nächste n Termine        |
| `/calendars`        | Kalender auflisten       |
| `/remind`           | Erinnerungseinstellungen |
| `/add`              | Termin hinzufügen        |
| `/link` / `/unlink` | Account verknüpfen       |

**Features:**

- Deutsche Lokalisierung
- Morning Briefing Support
- Reminder Scheduler mit Push-Benachrichtigungen
- Account-Linking mit Calendar Web App

### telegram-contacts-bot

Bot für schnellen Kontakt-Zugriff:

```
services/telegram-contacts-bot/
├── src/
│   ├── bot/           # Telegraf Bot Logic
│   ├── contacts/      # Contacts API Client
│   └── user/          # User Linking Service
```

**Commands:**

| Command                 | Beschreibung           |
| ----------------------- | ---------------------- |
| `/search [name]`        | Kontakte suchen        |
| `/favorites`            | Favoriten anzeigen     |
| `/recent`               | Zuletzt hinzugefügt    |
| `/birthdays`            | Anstehende Geburtstage |
| `/tags` / `/tag [name]` | Tag-Verwaltung         |
| `/stats`                | Kontakt-Statistiken    |
| `/add [name]`           | Kontakt hinzufügen     |

**Features:**

- Geburtstags-Erkennung und -Erinnerungen
- Tag-basierte Filterung
- Schnellsuche mit Formatierung

### telegram-chat-bot

AI Chat Bot mit Multi-Model Support:

```
services/telegram-chat-bot/
├── src/
│   ├── bot/           # Telegraf Bot Logic
│   ├── chat/          # Chat API Client
│   └── user/          # User Service
```

**Commands:**

| Command         | Beschreibung                |
| --------------- | --------------------------- |
| `/models`       | Verfügbare Modelle anzeigen |
| `/model [name]` | Modell wechseln             |
| `/new [title]`  | Neue Konversation           |
| `/convos`       | Konversationen auflisten    |
| `/history`      | Letzte Nachrichten          |
| `/clear`        | Kontext löschen             |

**Features:**

- Unterstützt lokale (Gemma) + Cloud-Modelle (Claude, GPT, etc.)
- Synchronisation mit Chat Web/Mobile App
- Message Splitting für lange Antworten
- Conversation History

---

## Matrix Self-Hosting (DSGVO-Compliance)

Als datenschutzkonforme Alternative zu Telegram wurde eine komplette Matrix-Infrastruktur aufgesetzt.

### Warum Matrix statt Telegram?

| Aspekt             | Telegram                         | Matrix                      |
| ------------------ | -------------------------------- | --------------------------- |
| **Datenhaltung**   | Telegram Server (Russland/Dubai) | Self-Hosted (Deutschland)   |
| **DSGVO**          | Problematisch                    | Vollständig konform         |
| **Bot-Daten**      | Bei Telegram                     | Bei uns                     |
| **Data Retention** | Unklar                           | Konfigurierbar (1-365 Tage) |

### Infrastruktur

```yaml
# docker-compose.macmini.yml
services:
  synapse: # Matrix Homeserver (Port 8008)
  synapse-db: # PostgreSQL für Synapse
  element-web: # Element Web Client (Port 8087)
```

**Konfigurationsdateien:**

- `docker/matrix/homeserver.yaml` - Synapse Konfiguration
- `docker/matrix/log.config.yaml` - Logging mit Rotation
- `docker/matrix/element-config.json` - Element Web Settings

### Matrix Bots

Alle Telegram-Bots wurden als Matrix-Varianten implementiert:

| Bot                        | Port | Funktion                |
| -------------------------- | ---- | ----------------------- |
| **matrix-ollama-bot**      | 3311 | Lokale LLM-Inferenz     |
| **matrix-stats-bot**       | 3312 | Umami Analytics Reports |
| **matrix-project-doc-bot** | 3313 | Projektdokumentation    |

#### matrix-ollama-bot

DSGVO-konformer Ersatz für telegram-ollama-bot:

```
services/matrix-ollama-bot/
├── src/
│   ├── bot/           # matrix-bot-sdk
│   ├── ollama/        # Ollama API Client
│   └── main.ts
```

**Commands:** `!help`, `!models`, `!model`, `!mode`, `!clear`, `!status`

**System Prompts:** default, classify, summarize, translate, code

#### matrix-stats-bot

Analytics-Reports im Matrix Room:

- Tägliche/Wöchentliche Reports
- Umami Integration
- Commands: `!stats`, `!today`, `!week`, `!realtime`, `!users`

#### matrix-project-doc-bot

Projektdokumentation mit AI-Unterstützung:

- Voice Transcription via OpenAI Whisper
- Blog-Generierung in 5 Stilen
- PostgreSQL + S3 Storage
- Commands: `!new`, `!projects`, `!switch`, `!status`, `!generate`, `!export`

### Setup Script

```bash
scripts/mac-mini/setup-matrix.sh
```

Automatisiert:

- Synapse-Initialisierung
- Admin-User Erstellung
- Element Web Konfiguration
- Bot-User Registration

---

## Chat App: Model Comparison

Neues Feature zum Vergleichen von AI-Modellen:

```
apps/chat/apps/web/src/
├── lib/
│   ├── components/compare/
│   │   ├── CompareInput.svelte      # Prompt Eingabe
│   │   ├── CompareProgress.svelte   # Progress Bar
│   │   ├── ModelResponseCard.svelte # Response Karte
│   │   └── ModelResponseGrid.svelte # Grid Layout
│   └── stores/compare.svelte.ts     # Svelte 5 Runes Store
└── routes/(protected)/compare/      # Route
```

**Features:**

- Gleichzeitige Anfrage an mehrere Modelle
- Side-by-Side Vergleich
- Response-Metriken (Zeit, Tokens)
- Temperature/Max Tokens Kontrolle
- Cancel-Funktionalität

---

## Guest Welcome Modal

Einheitliches Welcome-Modal für alle Apps im Guest Mode:

```
packages/shared-auth-ui/src/
├── components/GuestWelcomeModal.svelte
└── utils/guestWelcome.ts
```

**Features:**

- App-Icon und -Name aus shared-branding
- Feature-Liste (DE/EN lokalisiert)
- Warnung über lokale Datenspeicherung
- Buttons: Login, Register, Hilfe, "Als Gast fortfahren"
- localStorage für "nicht mehr anzeigen"

**Integriert in:**

- Calendar
- Chat
- Clock
- Contacts
- Todo

---

## Local STT Integration

Integration von lokaler Speech-to-Text in telegram-project-doc-bot:

```typescript
// transcription.service.ts
// STT Provider: local (mana-stt) oder openai
// Fallback wenn lokal nicht verfügbar
```

**Konfiguration:**

```env
STT_PROVIDER=local          # local oder openai
STT_LOCAL_URL=http://localhost:8000
STT_LOCAL_MODEL=large-v3-turbo
```

**Grafana Dashboards:**

- `services/mana-stt/grafana-dashboard.json`
- `services/ollama-metrics-proxy/grafana-dashboard.json`

---

## Developer Experience

### Dev-Credentials Pre-Fill

Login-Seite zeigt jetzt Dev-Credentials im Development-Modus:

- Email: `dev@manacore.local`
- Password vorgefüllt
- Seed Script: `pnpm db:seed:dev` in mana-core-auth

### Ollama URL in .env.development

```env
OLLAMA_URL=http://mac-mini.local:11434
```

---

## Codebase Cleanup

### Maerchenzauber entfernt

Komplettes Entfernen der Maerchenzauber-App:

| Entfernt        | Dateien                                  |
| --------------- | ---------------------------------------- |
| App Definition  | MANA_APPS, APP_URLS, AppId               |
| Branding        | app-icons.ts, config.ts, StorytellerLogo |
| Theme           | maerchenzauber.css                       |
| Landing Content | maerchenzauber-de.md                     |
| Env Config      | generate-env.mjs                         |

---

## Bugfixes

### Health Check Pfade

Korrektur des presi-backend Health Endpoints:

```diff
- /api/health
+ /api/v1/health
```

Betroffen:

- `docker-compose.macmini.yml`
- `scripts/mac-mini/health-check.sh`

### Telegram User ID Type

Fix für große Telegram User IDs:

```diff
- telegram_user_id: integer()
+ telegram_user_id: bigint()
```

---

## Zusammenfassung

| Bereich       | Commits | Highlights                    |
| ------------- | ------- | ----------------------------- |
| Telegram Bots | 6       | Calendar, Contacts, Chat Bots |
| Matrix        | 5       | Synapse, Element, 3 Bots      |
| Chat App      | 2       | Model Comparison              |
| Auth UI       | 2       | Guest Welcome Modal           |
| STT           | 1       | Local STT Integration         |
| Cleanup       | 2       | Maerchenzauber entfernt       |
| Bugfixes      | 2       | Health Checks, User ID Type   |

---

## Neue Services

| Service                | Port | Typ      | Beschreibung         |
| ---------------------- | ---- | -------- | -------------------- |
| telegram-calendar-bot  | 3303 | Telegram | Kalender-Integration |
| telegram-contacts-bot  | 3304 | Telegram | Kontakte-Zugriff     |
| telegram-chat-bot      | 3305 | Telegram | AI Chat              |
| synapse                | 8008 | Matrix   | Homeserver           |
| element-web            | 8087 | Matrix   | Web Client           |
| matrix-ollama-bot      | 3311 | Matrix   | LLM Chat             |
| matrix-stats-bot       | 3312 | Matrix   | Analytics            |
| matrix-project-doc-bot | 3313 | Matrix   | Projekt-Docs         |

---

## Nächste Schritte

1. **Matrix Bots deployen** auf Mac Mini
2. **Cloudflare Tunnel** für Matrix-Subdomains
3. **Telegram Calendar Bot** mit Reminder-Notifications testen
4. **Model Comparison** mit mehr Metriken erweitern
5. **Mobile Apps** mit neuen Bot-Features integrieren
