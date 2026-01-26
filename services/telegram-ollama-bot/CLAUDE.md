# Telegram Ollama Bot

Telegram Bot für lokale LLM-Inferenz via Ollama auf dem Mac Mini Server.

## Tech Stack

- **Framework**: NestJS 10
- **Telegram**: nestjs-telegraf + Telegraf
- **LLM**: Ollama API (Gemma 3 4B)

## Commands

```bash
# Development
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Type check
pnpm type-check       # Check TypeScript types
```

## Telegram Commands

| Command | Beschreibung |
|---------|--------------|
| `/start` | Hilfe anzeigen |
| `/help` | Hilfe anzeigen |
| `/models` | Verfügbare Modelle auflisten |
| `/model [name]` | Modell wechseln |
| `/mode [modus]` | System-Prompt ändern |
| `/clear` | Chat-Verlauf löschen |
| `/status` | Ollama-Status prüfen |

## Modi

| Modus | Beschreibung |
|-------|--------------|
| `default` | Allgemeiner Assistent |
| `classify` | Text-Klassifizierung |
| `summarize` | Zusammenfassungen |
| `translate` | Übersetzungen |
| `code` | Programmier-Hilfe |

## Environment Variables

```env
# Server
PORT=3301

# Telegram
TELEGRAM_BOT_TOKEN=xxx              # Bot Token von @BotFather
TELEGRAM_ALLOWED_USERS=123,456      # Optional: Nur diese User IDs erlauben

# Ollama
OLLAMA_URL=http://localhost:11434   # Ollama API URL
OLLAMA_MODEL=gemma3:4b              # Standard-Modell
OLLAMA_TIMEOUT=120000               # Timeout in ms
```

## Projekt-Struktur

```
services/telegram-ollama-bot/
├── src/
│   ├── main.ts               # Entry point
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health endpoint
│   ├── config/
│   │   └── configuration.ts  # Config & System Prompts
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── bot.update.ts     # Command handlers
│   └── ollama/
│       ├── ollama.module.ts
│       └── ollama.service.ts # Ollama API client
└── Dockerfile
```

## Deployment auf Mac Mini

### Option 1: Docker

```yaml
# In docker-compose.macmini.yml
telegram-ollama-bot:
  image: ghcr.io/memo-2023/telegram-ollama-bot:latest
  container_name: manacore-telegram-ollama-bot
  restart: always
  environment:
    PORT: 3301
    TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
    OLLAMA_URL: http://host.docker.internal:11434
    OLLAMA_MODEL: gemma3:4b
  ports:
    - "3301:3301"
```

### Option 2: Nativ (empfohlen für beste Ollama-Performance)

```bash
# Auf dem Mac Mini
cd ~/projects/manacore-monorepo/services/telegram-ollama-bot
pnpm install
pnpm build
TELEGRAM_BOT_TOKEN=xxx OLLAMA_URL=http://localhost:11434 pnpm start:prod
```

## Neuen Bot erstellen

1. Öffne @BotFather in Telegram
2. Sende `/newbot`
3. Wähle einen Namen (z.B. "ManaCore Ollama")
4. Wähle einen Username (z.B. "manacore_ollama_bot")
5. Kopiere den Token

## Health Check

```bash
curl http://localhost:3301/health
```

## Features

- **Chat-Verlauf**: Behält die letzten 10 Nachrichten für Kontext
- **Mehrere Modi**: Verschiedene System-Prompts für unterschiedliche Aufgaben
- **Modell-Wechsel**: Dynamisch zwischen installierten Modellen wechseln
- **User-Beschränkung**: Optional nur bestimmte Telegram-User erlauben
- **Lange Antworten**: Automatisches Splitting bei >4000 Zeichen
