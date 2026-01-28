# Matrix Ollama Bot - Claude Code Guidelines

## Overview

Matrix Ollama Bot provides a GDPR-compliant chat interface to local LLM inference via Ollama. It uses the Matrix protocol for messaging, which allows self-hosting all data on the Mac Mini server.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **LLM**: Ollama (local inference)

## Commands

```bash
# Development
pnpm install
pnpm start:dev        # Start with hot reload

# Build
pnpm build            # Production build

# Type check
pnpm type-check       # Check TypeScript types
```

## Project Structure

```
services/matrix-ollama-bot/
├── src/
│   ├── main.ts               # Application entry point
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & system prompts
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   └── ollama/
│       ├── ollama.module.ts
│       └── ollama.service.ts # Ollama API client
├── Dockerfile
└── package.json
```

## Matrix Commands

| Command | Description |
|---------|-------------|
| `!help` | Show help message |
| `!models` | List available Ollama models |
| `!model [name]` | Switch to a different model |
| `!mode [mode]` | Change system prompt mode |
| `!clear` | Clear chat history |
| `!status` | Show Ollama connection status |

## System Prompt Modes

| Mode | Description |
|------|-------------|
| `default` | General assistant |
| `classify` | Text classification |
| `summarize` | Text summarization |
| `translate` | Translation |
| `code` | Programming help |

## Environment Variables

```env
# Server
PORT=3311

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#ollama-bot:mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:4b
OLLAMA_TIMEOUT=120000
```

## Docker

```bash
# Build locally
docker build -f services/matrix-ollama-bot/Dockerfile -t matrix-ollama-bot services/matrix-ollama-bot

# Run
docker run -p 3311:3311 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e OLLAMA_URL=http://host.docker.internal:11434 \
  -v matrix-ollama-bot-data:/app/data \
  matrix-ollama-bot
```

## Health Check

```bash
curl http://localhost:3311/health
```

## Getting a Matrix Access Token

```bash
# Login to get access token
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "ollama-bot",
    "password": "your-password"
  }'

# Response contains: {"access_token": "syt_xxx", ...}
```

## Key Differences from Telegram Bot

| Feature | Telegram | Matrix |
|---------|----------|--------|
| Commands | `/command` | `!command` |
| Message limit | 4096 chars | ~65535 chars |
| Data storage | Telegram servers | Self-hosted |
| E2E encryption | Bot chats unencrypted | Optional (not enabled) |
| Typing indicator | `sendChatAction` | `sendTyping` |

## GDPR Compliance

- All message data stored locally on Mac Mini
- No third-party data processing
- Full control over data retention
- Can delete all user data on request
