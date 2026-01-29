# Telegram Project Doc Bot

Telegram Bot zum Sammeln von Projektdokumentation (Fotos, Sprachnotizen, Text) und automatischer Blogbeitrag-Generierung.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **Database**: PostgreSQL + Drizzle ORM
- **Storage**: S3 (MinIO lokal, Hetzner in Produktion)
- **AI - Transcription**: OpenAI Whisper
- **AI - Generation**: mana-llm service oder OpenAI GPT

## Commands

```bash
# Development
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Type check
pnpm type-check       # Check TypeScript types

# Database
pnpm db:generate      # Generate migrations
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Drizzle Studio
```

## Telegram Commands

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

## Blog-Stile

| Stil | Beschreibung |
|------|--------------|
| `casual` | Locker & persönlich |
| `formal` | Professionell & sachlich |
| `tutorial` | Anleitung mit Schritten |
| `diary` | Tagebuch-Stil |

## User Flow

```
1. /new Gartenhaus-Renovierung    → Projekt erstellen
2. 📷 Foto senden                  → Wird gespeichert
3. 🎤 Sprachnotiz senden           → Transkribiert + gespeichert
4. "Heute das Fundament gegossen"  → Text-Notiz
5. /status                        → Übersicht
6. /generate tutorial             → Blogbeitrag erstellen
7. /export                        → Als .md Datei
```

## Environment Variables

```env
# Server
PORT=3302

# Telegram
TELEGRAM_BOT_TOKEN=xxx              # Bot Token von @BotFather
TELEGRAM_ALLOWED_USERS=123,456      # Optional: Nur diese User IDs erlauben

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/projectdoc

# Storage (MinIO)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=projectdoc-storage

# AI - Transcription (optional, aber empfohlen)
OPENAI_API_KEY=sk-xxx

# AI - Generation
LLM_PROVIDER=mana-llm               # mana-llm oder openai
MANA_LLM_URL=http://localhost:3025  # mana-llm service URL
LLM_MODEL=ollama/gemma3:4b          # Model with provider prefix
```

## Projekt-Struktur

```
services/telegram-project-doc-bot/
├── src/
│   ├── main.ts                   # Entry point
│   ├── app.module.ts             # Root module
│   ├── health.controller.ts      # Health endpoint
│   ├── config/
│   │   └── configuration.ts      # Config + Blog-Stile
│   ├── database/
│   │   ├── database.module.ts    # Drizzle connection
│   │   └── schema.ts             # DB schema
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts         # Command handlers
│   ├── project/
│   │   ├── project.module.ts
│   │   └── project.service.ts    # Projekt CRUD
│   ├── media/
│   │   ├── media.module.ts
│   │   ├── media.service.ts      # Foto/Voice/Text verarbeiten
│   │   └── storage.service.ts    # S3 Upload/Download
│   ├── transcription/
│   │   ├── transcription.module.ts
│   │   └── transcription.service.ts  # Whisper API
│   └── generation/
│       ├── generation.module.ts
│       └── generation.service.ts # Blogpost AI
├── drizzle/                      # Migrations
├── drizzle.config.ts
├── package.json
└── Dockerfile
```

## Lokale Entwicklung

### 1. Bot bei Telegram erstellen

1. Öffne @BotFather in Telegram
2. Sende `/newbot`
3. Wähle einen Namen (z.B. "Project Doc Bot")
4. Wähle einen Username (z.B. "my_projectdoc_bot")
5. Kopiere den Token

### 2. Umgebung vorbereiten

```bash
# Docker Services starten (PostgreSQL, MinIO, Ollama)
pnpm docker:up

# Datenbank erstellen
psql -h localhost -U postgres -c "CREATE DATABASE projectdoc;"

# Schema pushen
cd services/telegram-project-doc-bot
cp .env.example .env
# Token und Keys eintragen
pnpm db:push
```

### 3. Bot starten

```bash
pnpm start:dev
```

## Features

- **Multi-Projekt**: Mehrere Projekte pro User
- **Foto-Speicherung**: Fotos in S3 mit Metadaten
- **Voice-Transkription**: Automatisch via Whisper
- **Text-Notizen**: Einfache Nachrichten werden gespeichert
- **Chronologisch**: Alle Einträge behalten ihre Reihenfolge
- **Mehrere Stile**: casual, formal, tutorial, diary
- **Export**: Markdown-Datei zum Download

## Datenbank-Schema

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

## Health Check

```bash
curl http://localhost:3302/health
```

## Deployment

### Docker (empfohlen)

```yaml
# docker-compose.yml
telegram-project-doc-bot:
  build: ./services/telegram-project-doc-bot
  restart: always
  environment:
    PORT: 3302
    TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    DATABASE_URL: ${DATABASE_URL}
    S3_ENDPOINT: ${S3_ENDPOINT}
    S3_ACCESS_KEY: ${S3_ACCESS_KEY}
    S3_SECRET_KEY: ${S3_SECRET_KEY}
    S3_BUCKET: projectdoc-storage
    LLM_PROVIDER: ollama
    OLLAMA_URL: http://ollama:11434
  ports:
    - "3302:3302"
```

## Roadmap

- [ ] Foto-Vision-Analyse (was ist auf dem Bild?)
- [ ] PDF-Export
- [ ] Bilder im Blogpost einbetten
- [ ] Projekt-Templates
- [ ] Web-Dashboard zur Ansicht
- [ ] Telegram Mini App für bessere UX
