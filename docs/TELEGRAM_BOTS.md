# Telegram Bots

Dokumentation aller Telegram-Bots im ManaCore Monorepo.

## Übersicht

| Bot | Port | Zweck | Status |
|-----|------|-------|--------|
| [telegram-stats-bot](#telegram-stats-bot) | 3300 | Analytics & Statistiken von Umami | ✅ Aktiv |
| [telegram-ollama-bot](#telegram-ollama-bot) | 3301 | Lokale LLM-Inferenz via Ollama | ✅ Aktiv |
| [telegram-project-doc-bot](#telegram-project-doc-bot) | 3302 | Projektdokumentation & Blogpost-Generierung | ✅ Aktiv |
| [telegram-calendar-bot](#telegram-calendar-bot) | 3303 | Kalender-Termine & Erinnerungen | 🚧 In Entwicklung |

## Gemeinsame Architektur

Alle Bots teilen dieselbe technische Basis:

```
┌─────────────────────────────────────────────────────────────┐
│  Telegram Bot Service                                       │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  NestJS 10  │  │  Telegraf   │  │  nestjs-telegraf    │ │
│  │  Framework  │  │  Library    │  │  Integration        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Standard Module Structure                          │   │
│  │  ├── src/main.ts              # Entry point         │   │
│  │  ├── src/app.module.ts        # Root module         │   │
│  │  ├── src/health.controller.ts # /health endpoint    │   │
│  │  ├── src/config/              # Configuration       │   │
│  │  └── src/bot/                 # Bot commands        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Gemeinsame Features

- **Health Endpoint**: Alle Bots haben `/health` für Monitoring
- **User-Beschränkung**: Optional via `TELEGRAM_ALLOWED_USERS`
- **Docker Support**: Dockerfile für Container-Deployment
- **Graceful Shutdown**: Sauberes Beenden bei SIGTERM

### Standard Environment Variables

```env
# Alle Bots
PORT=33xx                           # Port für Health-Endpoint
TELEGRAM_BOT_TOKEN=xxx              # Bot Token von @BotFather
TELEGRAM_ALLOWED_USERS=123,456      # Optional: Erlaubte User IDs
NODE_ENV=production                 # Environment
```

---

## telegram-stats-bot

**Zweck:** Liefert Analytics und Statistiken von Umami (stats.mana.how) via Telegram.

### Features

- Übersicht aller App-Statistiken (30 Tage)
- Tägliche und wöchentliche Reports
- Echtzeit-Besucherzahlen
- Registrierte User-Statistiken
- Automatische geplante Reports

### Commands

| Command | Beschreibung |
|---------|--------------|
| `/start` | Hilfe anzeigen |
| `/stats` | Übersicht aller Apps (letzte 30 Tage) |
| `/today` | Heutige Statistiken |
| `/week` | Wochenstatistiken |
| `/realtime` | Aktive Besucher jetzt |
| `/users` | Registrierte User-Statistiken |
| `/help` | Verfügbare Commands anzeigen |

### Scheduled Reports

| Report | Schedule | Timezone |
|--------|----------|----------|
| Täglich | 09:00 | Europe/Berlin |
| Wöchentlich | Montag 09:00 | Europe/Berlin |

### Environment Variables

```env
PORT=3300
TZ=Europe/Berlin

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx              # Chat für automatische Reports

# Umami
UMAMI_API_URL=http://umami:3000
UMAMI_USERNAME=admin
UMAMI_PASSWORD=xxx

# Database (optional, für User-Counts)
DATABASE_URL=postgresql://...
```

### Projekt-Struktur

```
services/telegram-stats-bot/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── config/
│   │   └── configuration.ts      # Website IDs
│   ├── bot/
│   │   ├── bot.module.ts
│   │   ├── bot.service.ts        # Send messages
│   │   └── bot.update.ts         # Command handlers
│   ├── umami/
│   │   └── umami.service.ts      # Umami API client
│   ├── analytics/
│   │   ├── analytics.service.ts  # Data aggregation
│   │   └── formatters.ts         # Message formatters
│   ├── users/
│   │   └── users.service.ts      # User count from auth DB
│   └── scheduler/
│       └── report.scheduler.ts   # Cron jobs
└── Dockerfile
```

### Neue Website hinzufügen

In `src/config/configuration.ts`:

```typescript
export const WEBSITE_IDS: Record<string, string> = {
  'new-app-webapp': 'uuid-from-umami',
};

export const DISPLAY_NAMES: Record<string, string> = {
  'new-app-webapp': 'New App',
};
```

---

## telegram-ollama-bot

**Zweck:** Lokale LLM-Inferenz via Ollama auf dem Mac Mini Server.

### Features

- Chat mit lokalem LLM (Gemma 3 4B Standard)
- Mehrere Konversations-Modi
- Dynamischer Modell-Wechsel
- Chat-Verlauf (10 Nachrichten Kontext)
- Automatisches Message-Splitting bei langen Antworten

### Commands

| Command | Beschreibung |
|---------|--------------|
| `/start` | Hilfe anzeigen |
| `/help` | Hilfe anzeigen |
| `/models` | Verfügbare Modelle auflisten |
| `/model [name]` | Modell wechseln |
| `/mode [modus]` | System-Prompt ändern |
| `/clear` | Chat-Verlauf löschen |
| `/status` | Ollama-Status prüfen |

### Modi

| Modus | Beschreibung |
|-------|--------------|
| `default` | Allgemeiner Assistent |
| `classify` | Text-Klassifizierung |
| `summarize` | Zusammenfassungen |
| `translate` | Übersetzungen |
| `code` | Programmier-Hilfe |

### Environment Variables

```env
PORT=3301

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_ALLOWED_USERS=123,456    # Optional

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_TIMEOUT=120000             # Timeout in ms
```

### Projekt-Struktur

```
services/telegram-ollama-bot/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── config/
│   │   └── configuration.ts      # System Prompts
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts         # Command handlers
│   └── ollama/
│       ├── ollama.module.ts
│       └── ollama.service.ts     # Ollama API client
└── Dockerfile
```

### Deployment

**Option 1: Docker**
```yaml
telegram-ollama-bot:
  image: ghcr.io/memo-2023/telegram-ollama-bot:latest
  environment:
    TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    OLLAMA_URL: http://host.docker.internal:11434
```

**Option 2: Nativ (empfohlen für Performance)**
```bash
cd ~/projects/manacore-monorepo/services/telegram-ollama-bot
pnpm build
TELEGRAM_BOT_TOKEN=xxx pnpm start:prod
```

---

## telegram-project-doc-bot

**Zweck:** Sammelt Projektdokumentation (Fotos, Sprachnotizen, Text) und generiert automatisch Blogbeiträge.

### Features

- Multi-Projekt-Verwaltung
- Foto-Speicherung in S3
- Automatische Voice-Transkription (Whisper)
- Text-Notizen
- AI-Blogpost-Generierung (mehrere Stile)
- Markdown-Export

### Commands

| Command | Beschreibung |
|---------|--------------|
| `/start` | Hilfe anzeigen |
| `/help` | Hilfe anzeigen |
| `/new [Name]` | Neues Projekt erstellen |
| `/projects` | Alle Projekte auflisten |
| `/switch [ID]` | Projekt wechseln |
| `/status` | Status des aktiven Projekts |
| `/archive` | Projekt archivieren |
| `/generate` | Blogbeitrag generieren |
| `/generate [Stil]` | Mit bestimmtem Stil generieren |
| `/styles` | Verfügbare Stile anzeigen |
| `/export` | Letzte Generierung als Datei |

### Blog-Stile

| Stil | Beschreibung |
|------|--------------|
| `casual` | Locker & persönlich |
| `formal` | Professionell & sachlich |
| `tutorial` | Anleitung mit Schritten |
| `diary` | Tagebuch-Stil |

### User Flow

```
1. /new Gartenhaus-Renovierung    → Projekt erstellen
2. 📷 Foto senden                  → Wird gespeichert
3. 🎤 Sprachnotiz senden           → Transkribiert + gespeichert
4. "Heute das Fundament gegossen"  → Text-Notiz
5. /status                        → Übersicht
6. /generate tutorial             → Blogbeitrag erstellen
7. /export                        → Als .md Datei
```

### Environment Variables

```env
PORT=3302

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_ALLOWED_USERS=123,456

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/projectdoc

# Storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=projectdoc-storage

# AI - Transcription
OPENAI_API_KEY=sk-xxx

# AI - Generation
LLM_PROVIDER=ollama               # ollama oder openai
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
```

### Projekt-Struktur

```
services/telegram-project-doc-bot/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── config/
│   │   └── configuration.ts      # Blog-Stile
│   ├── database/
│   │   ├── database.module.ts
│   │   └── schema.ts             # Drizzle schema
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts         # Command handlers
│   ├── project/
│   │   └── project.service.ts    # Projekt CRUD
│   ├── media/
│   │   ├── media.service.ts      # Foto/Voice/Text
│   │   └── storage.service.ts    # S3 Upload/Download
│   ├── transcription/
│   │   └── transcription.service.ts  # Whisper API
│   └── generation/
│       └── generation.service.ts # Blogpost AI
├── drizzle/
├── drizzle.config.ts
└── Dockerfile
```

### Datenbank-Schema

```
projects
├── id (UUID)
├── telegram_user_id (INT)
├── name (TEXT)
├── description (TEXT)
├── status (TEXT: active, archived, completed)
├── created_at, updated_at

media_items
├── id (UUID)
├── project_id (UUID FK)
├── type (TEXT: photo, voice, text)
├── storage_key (TEXT)
├── caption (TEXT)
├── transcription (TEXT)
├── ai_description (TEXT)
├── metadata (JSONB)
├── telegram_file_id (TEXT)
├── order_index (INT)
├── created_at

generations
├── id (UUID)
├── project_id (UUID FK)
├── style (TEXT)
├── content (TEXT - Markdown)
├── pdf_key (TEXT)
├── is_latest (BOOL)
├── created_at
```

---

## telegram-calendar-bot

**Zweck:** Telegram-Integration für die Calendar-App mit Termin-Abfragen, Quick-Add und Erinnerungen.

**Status:** 📋 Geplant

Siehe [Plan](#telegram-calendar-bot-plan) unten für Details.

---

## Entwicklung

### Neuen Bot erstellen

1. **Bot bei Telegram registrieren:**
   - Öffne @BotFather in Telegram
   - Sende `/newbot`
   - Wähle Namen und Username
   - Kopiere den Token

2. **Service erstellen:**
   ```bash
   mkdir -p services/telegram-{name}-bot/src
   cd services/telegram-{name}-bot
   pnpm init
   ```

3. **Dependencies installieren:**
   ```bash
   pnpm add @nestjs/core @nestjs/common @nestjs/config nestjs-telegraf telegraf
   pnpm add -D @types/node typescript
   ```

4. **Standard-Struktur anlegen:**
   ```
   src/
   ├── main.ts
   ├── app.module.ts
   ├── health.controller.ts
   ├── config/
   │   └── configuration.ts
   └── bot/
       ├── bot.module.ts
       └── bot.update.ts
   ```

### Lokale Entwicklung

```bash
# Bot starten (aus dem Service-Verzeichnis)
pnpm start:dev

# Health Check testen
curl http://localhost:33xx/health
```

### Docker Build

```bash
# Aus dem Monorepo-Root
docker build -f services/telegram-{name}-bot/Dockerfile -t telegram-{name}-bot .
```

---

## Deployment

### Mac Mini Server

Alle Bots laufen auf dem Mac Mini Server. Status prüfen:

```bash
ssh mana-server
./scripts/mac-mini/status.sh
```

### Docker Compose

```yaml
# docker-compose.macmini.yml
services:
  telegram-stats-bot:
    image: ghcr.io/memo-2023/telegram-stats-bot:latest
    restart: always
    ports:
      - "3300:3300"
    environment:
      PORT: 3300
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_STATS_BOT_TOKEN}
      # ...

  telegram-ollama-bot:
    image: ghcr.io/memo-2023/telegram-ollama-bot:latest
    restart: always
    ports:
      - "3301:3301"
    environment:
      PORT: 3301
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_OLLAMA_BOT_TOKEN}
      OLLAMA_URL: http://host.docker.internal:11434
      # ...

  telegram-project-doc-bot:
    image: ghcr.io/memo-2023/telegram-project-doc-bot:latest
    restart: always
    ports:
      - "3302:3302"
    environment:
      PORT: 3302
      TELEGRAM_BOT_TOKEN: ${TELEGRAM_PROJECT_DOC_BOT_TOKEN}
      # ...
```

### Health Checks

```bash
# Alle Bots prüfen
curl http://localhost:3300/health  # stats-bot
curl http://localhost:3301/health  # ollama-bot
curl http://localhost:3302/health  # project-doc-bot
```

---

## Monitoring

### Telegram Notifications

Bei Fehlern werden Benachrichtigungen via telegram-stats-bot gesendet:

```bash
# Health Check Script
./scripts/mac-mini/health-check.sh
```

### Logs

```bash
# Docker Logs
docker logs manacore-telegram-stats-bot -f
docker logs manacore-telegram-ollama-bot -f
docker logs manacore-telegram-project-doc-bot -f

# Native Service Logs
journalctl -u telegram-ollama-bot -f
```

---

## telegram-calendar-bot Plan

### Übersicht

Ein Telegram-Bot für die Calendar-App, der Termin-Abfragen, Quick-Add und Erinnerungen via Telegram ermöglicht.

### Geplante Commands

| Command | Beschreibung |
|---------|--------------|
| `/start` | Hilfe & Account-Verknüpfung |
| `/help` | Verfügbare Commands |
| `/today` | Heutige Termine |
| `/tomorrow` | Morgige Termine |
| `/week` | Wochenübersicht |
| `/next [n]` | Nächste n Termine (default: 5) |
| `/add [text]` | Schnell-Termin via natürliche Sprache |
| `/calendars` | Kalender-Übersicht |
| `/remind` | Erinnerungseinstellungen |
| `/link` | Account verknüpfen |
| `/unlink` | Account trennen |

### Geplante Features

1. **Termin-Abfragen**
   - Tägliche/wöchentliche Übersicht
   - Suche nach Terminen
   - Kalender-Filter

2. **Quick-Add**
   - Natürliche Spracheingabe: "Meeting morgen um 14 Uhr"
   - Strukturiertes Format: `/add Meeting | 2024-12-20 14:00 | 1h`
   - Kalender-Auswahl

3. **Erinnerungen via Telegram**
   - Push-Notifications für anstehende Termine
   - Konfigurierbare Vorlaufzeit
   - Morgen-Briefing (tägliche Zusammenfassung)

4. **Account-Verknüpfung**
   - OAuth oder Token-basierte Verknüpfung
   - Mehrere Telegram-Accounts pro User möglich

### Technische Architektur

```
┌─────────────────────────────────────────────────────────────┐
│  telegram-calendar-bot (Port 3303)                         │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    Bot      │  │   Calendar  │  │    Reminder         │ │
│  │   Module    │  │   Client    │  │    Scheduler        │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│         │                │                    │             │
│         ▼                ▼                    ▼             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Calendar Backend API (Port 3016)                   │   │
│  │  GET /api/v1/events?start=...&end=...              │   │
│  │  POST /api/v1/events                               │   │
│  │  GET /api/v1/calendars                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                           ▼                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL (calendar database)                     │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables (geplant)

```env
PORT=3303

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_ALLOWED_USERS=123,456    # Optional

# Calendar Backend
CALENDAR_API_URL=http://localhost:3016
MANA_CORE_AUTH_URL=http://localhost:3001

# Database (für User-Verknüpfungen)
DATABASE_URL=postgresql://...

# Reminder Settings
REMINDER_CHECK_INTERVAL=60000     # Check every minute
MORNING_BRIEFING_TIME=07:00       # Daily briefing time
MORNING_BRIEFING_TIMEZONE=Europe/Berlin
```

### Projekt-Struktur (geplant)

```
services/telegram-calendar-bot/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── schema.ts             # telegram_users Tabelle
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts         # Command handlers
│   ├── calendar/
│   │   ├── calendar.module.ts
│   │   └── calendar.client.ts    # Calendar API client
│   ├── reminder/
│   │   ├── reminder.module.ts
│   │   └── reminder.scheduler.ts # Cron für Erinnerungen
│   └── nlp/
│       ├── nlp.module.ts
│       └── nlp.service.ts        # Natürliche Spracheingabe
├── drizzle/
├── drizzle.config.ts
└── Dockerfile
```

### Datenbank-Schema (geplant)

```sql
-- telegram_users: Verknüpfung Telegram <-> ManaCore
CREATE TABLE telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT UNIQUE NOT NULL,
  telegram_username VARCHAR(255),
  mana_user_id UUID NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  linked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- telegram_reminder_settings: User-spezifische Einstellungen
CREATE TABLE telegram_reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT REFERENCES telegram_users(telegram_user_id),
  default_reminder_minutes INTEGER DEFAULT 15,
  morning_briefing_enabled BOOLEAN DEFAULT false,
  morning_briefing_time TIME DEFAULT '07:00',
  timezone VARCHAR(100) DEFAULT 'Europe/Berlin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Message Formatters (Beispiele)

**Tagesübersicht:**
```
📅 Deine Termine für heute (Mo, 27. Januar)

🔵 09:00 - 10:00 | Team Standup
   📍 Zoom Meeting

🟢 12:30 - 13:30 | Mittagessen mit Lisa
   📍 Restaurant Bella

🔴 15:00 - 16:30 | Projekt Review
   📍 Konferenzraum A
   📝 Q4 Ergebnisse präsentieren

───────────────
3 Termine heute
```

**Quick-Add Bestätigung:**
```
✅ Termin erstellt!

📌 Meeting mit Team
📅 Morgen, 14:00 - 15:00
📍 Büro
🗓️ Kalender: Arbeit

/undo zum Rückgängig machen
```

**Erinnerung:**
```
⏰ Erinnerung in 15 Minuten

📌 Team Standup
⏱️ 09:00 - 10:00
📍 Zoom Meeting

[Zum Termin] [Verschieben] [Absagen]
```
