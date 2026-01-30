# Matrix Chat Bot - Claude Code Guidelines

## Overview

Matrix Chat Bot provides AI chat capabilities via Matrix chat. It integrates with the Chat backend for conversations, AI completions, and message history.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Chat API (port 3002)
- **Auth**: Mana Core Auth (JWT)

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
services/matrix-chat-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3327)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── chat/
│   │   ├── chat.module.ts
│   │   └── chat.service.ts   # Chat Backend API client
│   └── session/
│       ├── session.module.ts
│       └── session.service.ts  # User session & auth management
├── Dockerfile
└── package.json
```

## Bot Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!help` | hilfe | Show help message |
| `!login email pass` | - | Login |
| `!logout` | - | Logout |
| `!status` | - | Bot status |

### Quick Chat (Stateless)

| Command | Aliases | Description |
|---------|---------|-------------|
| `!chat [message]` | fragen, ask | Quick AI response (no history) |

### Conversation Management

| Command | Aliases | Description |
|---------|---------|-------------|
| `!neu [titel]` | new | Create new conversation |
| `!gespraeche` | conversations, liste | List all conversations |
| `!gespraech [nr]` | conversation, select | Select/view conversation |
| `!senden [message]` | send, s | Send message in current conversation |
| `!verlauf` | history, nachrichten | Show message history |

### Conversation Actions

| Command | Aliases | Description |
|---------|---------|-------------|
| `!titel [nr] [title]` | title | Change conversation title |
| `!archiv [nr]` | archive | Archive conversation |
| `!archiviert` | archived | List archived conversations |
| `!wiederherstellen [nr]` | restore, unarchive | Restore from archive |
| `!pin [nr]` | - | Pin conversation |
| `!unpin [nr]` | - | Unpin conversation |
| `!loeschen [nr]` | delete | Delete conversation |

### Model Selection

| Command | Aliases | Description |
|---------|---------|-------------|
| `!modelle` | models | List available AI models |
| `!modell [nr]` | model | Select model for new conversations |

## Model Providers

| Provider | Icon | Description |
|----------|------|-------------|
| `ollama` | 🏠 | Local models (self-hosted) |
| `openrouter` | ☁️ | Cloud models via OpenRouter |
| `openai` | 🤖 | OpenAI models |
| `anthropic` | 🧠 | Anthropic Claude models |

## Example Usage

```
# Login
!login max@example.com mypassword

# Quick chat (no conversation needed)
!chat Was ist die Hauptstadt von Frankreich?

# Create a conversation
!neu Programmierung Hilfe

# Send message in conversation
!senden Erklaere mir Python Listen

# View message history
!verlauf

# List conversations
!gespraeche

# Select conversation
!gespraech 1

# Change model
!modelle
!modell 2

# Archive and restore
!archiv 1
!archiviert
!wiederherstellen 1

# Pin conversation
!pin 1
!unpin 1

# Delete conversation
!loeschen 1
```

## Environment Variables

```env
# Server
PORT=3327

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#chat:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Chat Backend
CHAT_BACKEND_URL=http://localhost:3002
CHAT_API_PREFIX=

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-chat-bot/Dockerfile -t matrix-chat-bot services/matrix-chat-bot

# Run
docker run -p 3327:3327 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e CHAT_BACKEND_URL=http://chat-backend:3002 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-chat-bot-data:/app/data \
  matrix-chat-bot
```

## Health Check

```bash
curl http://localhost:3327/health
```

## Chat Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/models` | GET | List AI models (public) |
| `/models/:id` | GET | Get model details (public) |
| `/chat/completions` | POST | Create AI completion |
| `/conversations` | GET | List conversations |
| `/conversations` | POST | Create conversation |
| `/conversations/archived` | GET | List archived |
| `/conversations/:id` | GET | Get conversation |
| `/conversations/:id` | DELETE | Delete conversation |
| `/conversations/:id/messages` | GET | Get messages |
| `/conversations/:id/messages` | POST | Add message |
| `/conversations/:id/title` | PATCH | Update title |
| `/conversations/:id/archive` | PATCH | Archive |
| `/conversations/:id/unarchive` | PATCH | Unarchive |
| `/conversations/:id/pin` | PATCH | Pin |
| `/conversations/:id/unpin` | PATCH | Unpin |

## Chat Modes

The bot supports different ways to chat:

1. **Quick Chat** (`!chat`): Stateless, single message/response, no history
2. **Conversation Chat** (`!senden`): Stateful, maintains message history, context-aware

## Number-Based Reference System

The bot uses a number-based reference system for ease of use:
1. User runs `!gespraeche` or `!modelle` to get a list
2. Bot stores the list internally for the user
3. User can reference items by their list number
4. Numbers are valid until the user runs a new list command

This allows simple commands like:
- `!gespraech 3` - Select conversation #3
- `!archiv 1` - Archive conversation #1
- `!modell 2` - Select model #2
