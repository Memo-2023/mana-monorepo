# Matrix Picture Bot - Claude Code Guidelines

## Overview

Matrix Picture Bot provides AI image generation via Matrix chat. It integrates with the Picture backend to generate images using various AI models (Replicate).

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **Backend**: Picture API (port 3006)
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
services/matrix-picture-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3319)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help messages
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & command handlers
│   ├── picture/
│   │   ├── picture.module.ts
│   │   └── picture.service.ts # Picture Backend API client
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
| `!generate [prompt]` | bild, gen | Generate an image |
| `!models` | modelle | List available models |
| `!model [id]` | modell | Switch model |
| `!history` | verlauf | Show recent images |
| `!delete [nr]` | loeschen | Delete an image |
| `!credits` | guthaben | Show credit balance |
| `!login email pass` | - | Login to Picture |
| `!logout` | - | Logout |
| `!cancel` | abbrechen | Cancel active generation |
| `!status` | - | Bot status |

## Prompt Options

Options can be added to the generate command:

```
!generate A beautiful sunset --width 1280 --height 720 --steps 40
!bild Ein Hund --negative blurry, low quality --style photorealistic
```

| Option | Description | Default |
|--------|-------------|---------|
| `--width N` | Image width | 1024 |
| `--height N` | Image height | 1024 |
| `--steps N` | Generation steps | 25 |
| `--negative [text]` | Negative prompt | - |
| `--style [name]` | Style preset | - |

## Environment Variables

```env
# Server
PORT=3319

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=#picture:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# Picture Backend
PICTURE_BACKEND_URL=http://localhost:3006
PICTURE_API_PREFIX=/api/v1

# Mana Core Auth
MANA_CORE_AUTH_URL=http://localhost:3001
```

## Docker

```bash
# Build locally
docker build -f services/matrix-picture-bot/Dockerfile -t matrix-picture-bot services/matrix-picture-bot

# Run
docker run -p 3319:3319 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e PICTURE_BACKEND_URL=http://picture-backend:3006 \
  -e MANA_CORE_AUTH_URL=http://mana-core-auth:3001 \
  -v matrix-picture-bot-data:/app/data \
  matrix-picture-bot
```

## Health Check

```bash
curl http://localhost:3319/health
```

## Getting a Matrix Access Token

```bash
# Create bot user first, then login
curl -X POST "https://matrix.mana.how/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "m.login.password",
    "user": "picture-bot",
    "password": "your-password"
  }'

# Response contains: {"access_token": "syt_xxx", ...}
```

## Authentication Flow

1. User sends `!login email password`
2. Bot calls mana-core-auth `/api/v1/auth/login`
3. JWT token stored in session (in-memory)
4. Token used for all Picture API calls
5. Token expires after 7 days (re-login required)

## Picture Backend API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/models` | GET | List available models |
| `/api/v1/models/:id` | GET | Get model details |
| `/api/v1/generate` | POST | Generate image |
| `/api/v1/images` | GET | List user's images |
| `/api/v1/images/:id` | DELETE | Delete image |
| `/api/v1/credits/balance` | GET | Get credit balance |

## Credit System

- **Cost**: 10 credits per image generation
- **Free tier**: 3 free generations for new users
- **Enforcement**: Only in production environment
- **Development**: Fail-open (no credit enforcement)

## Image Upload Flow

1. User sends `!generate [prompt]`
2. Bot calls Picture Backend with `waitForResult: true`
3. Backend generates image via Replicate
4. Bot downloads image from storage URL
5. Bot uploads image to Matrix media server
6. Bot sends image message to room
