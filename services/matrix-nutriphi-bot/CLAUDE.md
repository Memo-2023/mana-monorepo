# Matrix NutriPhi Bot - Claude Code Guidelines

## Overview

Matrix NutriPhi Bot is a Matrix chat bot for AI-powered nutrition tracking. It integrates with the NutriPhi backend to analyze meal photos and text descriptions, track daily nutrition, and provide personalized recommendations.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: NutriPhi API (port 3023)
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
services/matrix-nutriphi-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3316)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── nutriphi/
│   │   ├── nutriphi.module.ts
│   │   └── nutriphi.service.ts # NutriPhi API client
│   └── session/
│       ├── session.module.ts
│       └── session.service.ts  # User session & auth management
├── Dockerfile
└── package.json
```

## Bot Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!help` | hilfe, help | Show help message |
| `!login email pass` | - | Login to NutriPhi |
| `!logout` | - | Logout |
| `!analyze [text]` | - | Analyze photo or text |
| `!today` | heute | Daily summary |
| `!week` | woche | Weekly stats |
| `!goals` | ziele | Show goals |
| `!setgoals cal pro carb fat` | - | Set goals |
| `!favorites` | favoriten | List favorites |
| `!tips` | tipps | AI recommendations |
| `!status` | - | Bot status |

## Image Analysis Flow

1. User sends image to room
2. Bot stores image URL: "Bild empfangen!"
3. User sends `!analyze` or `!analyze Beschreibung`
4. Bot downloads image, sends to NutriPhi API
5. Bot displays nutrition results

## Environment Variables

```env
# Server
PORT=3316

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#nutriphi:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# NutriPhi Backend
NUTRIPHI_BACKEND_URL=http://localhost:3023
NUTRIPHI_API_PREFIX=/api/v1

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001

# Development bypass (optional)
DEV_BYPASS_AUTH=false
DEV_USER_ID=
```

## Docker

```bash
# Build locally
docker build -f services/matrix-nutriphi-bot/Dockerfile -t matrix-nutriphi-bot services/matrix-nutriphi-bot

# Run
docker run -p 3315:3315 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e NUTRIPHI_BACKEND_URL=http://nutriphi-backend:3023 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-nutriphi-bot-data:/app/data \
  matrix-nutriphi-bot
```

## Health Check

```bash
curl http://localhost:3316/health
```

## Getting a Matrix Access Token

```bash
# Create bot user first, then login
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "nutriphi-bot",
    "password": "your-password"
  }'

# Response contains: {"access_token": "syt_xxx", ...}
```

## Authentication Flow

1. User sends `!login email password`
2. Bot calls mana-core-auth `/api/v1/auth/login`
3. JWT token stored in session (in-memory)
4. Token used for all NutriPhi API calls
5. Token expires after 7 days (re-login required)

## NutriPhi API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |
| `/api/v1/analysis/photo` | POST | Analyze photo |
| `/api/v1/analysis/text` | POST | Analyze text |
| `/api/v1/meals` | POST | Create meal |
| `/api/v1/goals` | GET/POST | User goals |
| `/api/v1/stats/daily` | GET | Daily summary |
| `/api/v1/stats/weekly` | GET | Weekly stats |
| `/api/v1/favorites` | GET | List favorites |
| `/api/v1/recommendations` | GET | AI tips |
