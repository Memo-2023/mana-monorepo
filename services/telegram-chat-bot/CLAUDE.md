# Telegram Chat Bot

Telegram Bot für AI-Chat mit verschiedenen Modellen und Konversations-History. Kommuniziert mit der Chat-App API.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **Database**: PostgreSQL + Drizzle ORM
- **Date Handling**: date-fns

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
| `/start` | Hilfe & Account verknüpfen |
| `/help` | Verfügbare Befehle |
| `/models` | AI-Modelle anzeigen |
| `/model [name]` | Modell wechseln |
| `/new [titel]` | Neue Konversation |
| `/convos` | Konversationen auflisten |
| `/history` | Letzte Nachrichten |
| `/clear` | Kontext löschen |
| `/status` | Verbindungsstatus |
| `/link` | Account verknüpfen |
| `/unlink` | Verknüpfung trennen |

**Chatten:** Einfach Text senden - der Bot antwortet mit AI!

## Unterschied zu telegram-ollama-bot

| Feature | telegram-chat-bot | telegram-ollama-bot |
|---------|-------------------|---------------------|
| API | Chat-App Backend | Direkt Ollama |
| Modelle | Lokal + Cloud | Nur Ollama |
| History | In DB gespeichert | Nur Session |
| Sync | Mit Web/Mobile App | Standalone |
| Konversationen | Mehrere, benannt | Eine pro User |

## Environment Variables

```env
PORT=3305
NODE_ENV=development
TZ=Europe/Berlin

# Telegram
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_ALLOWED_USERS=

# Chat Backend
CHAT_API_URL=http://localhost:3002
MANA_CORE_AUTH_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/chat_bot

# Default Model
DEFAULT_MODEL=gemma3:4b
```

## Projekt-Struktur

```
services/telegram-chat-bot/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── health.controller.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   └── schema.ts
│   ├── bot/
│   │   ├── bot.module.ts
│   │   ├── bot.update.ts
│   │   └── formatters.ts
│   ├── chat/
│   │   ├── chat.module.ts
│   │   └── chat.client.ts
│   └── user/
│       ├── user.module.ts
│       └── user.service.ts
├── drizzle/
├── drizzle.config.ts
├── package.json
└── Dockerfile
```

## AI-Modelle

### Lokal (kostenlos)
- 🏠 Gemma 3 4B - Läuft auf Mac Mini

### Cloud (via OpenRouter)
- ☁️ Llama 3.1 8B/70B
- ☁️ DeepSeek V3
- ☁️ Mistral Small
- ☁️ Claude 3.5 Sonnet
- ☁️ GPT-4o Mini

## Health Check

```bash
curl http://localhost:3305/health
```

## Lokale Entwicklung

```bash
# Docker starten
pnpm docker:up

# Datenbank erstellen
psql -h localhost -U manacore -c "CREATE DATABASE chat_bot;"

# In Bot-Verzeichnis
cd services/telegram-chat-bot
cp .env.example .env
# Token eintragen

pnpm install
pnpm db:push
pnpm start:dev
```

## Deployment

### macOS (launchd)

```bash
launchctl load ~/Library/LaunchAgents/com.manacore.telegram-chat-bot.plist
```

### Docker

```yaml
telegram-chat-bot:
  build:
    dockerfile: services/telegram-chat-bot/Dockerfile
  environment:
    TELEGRAM_BOT_TOKEN: ${TELEGRAM_CHAT_BOT_TOKEN}
    CHAT_API_URL: http://chat-backend:3002
    DATABASE_URL: ${CHAT_BOT_DATABASE_URL}
  ports:
    - "3305:3305"
```
