# Matrix TTS Bot - Claude Code Guidelines

## Overview

Matrix TTS Bot converts text messages to speech and sends them back as audio messages. Uses the mana-tts service (port 3022) for synthesis.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **TTS Backend**: mana-tts service (Kokoro/F5-TTS)

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
services/matrix-tts-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3023)
│   ├── app.module.ts         # Root module
│   ├── health.controller.ts  # Health check endpoint
│   ├── config/
│   │   └── configuration.ts  # Configuration & help text
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & message handler
│   └── tts/
│       ├── tts.module.ts
│       └── tts.service.ts    # mana-tts API client
├── Dockerfile
└── package.json
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `!help` / `!hilfe` | Show help text |
| `!voice [name]` | Change voice (e.g., `!voice bm_daniel`) |
| `!voices` | List available voices |
| `!speed [0.5-2.0]` | Change speech speed |
| `!status` | Show current settings |
| (any text) | Convert to speech |

## Message Flow

1. User sends text message
2. Bot receives via matrix-bot-sdk
3. TTS service synthesizes audio
4. Audio uploaded to Matrix
5. Audio message sent back to room

## Environment Variables

```env
# Server
PORT=3023

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=!roomid:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# TTS Service
TTS_URL=http://localhost:3022
TTS_API_KEY=sk-internal-xxx

# Defaults
DEFAULT_VOICE=af_heart
DEFAULT_SPEED=1.0
MAX_TEXT_LENGTH=500
```

## TTS API Integration

The bot uses mana-tts `/synthesize/kokoro` endpoint:

```typescript
// Request
POST /synthesize/kokoro
{
  "text": "Hello world",
  "voice": "af_heart",
  "speed": 1.0,
  "output_format": "wav"
}

// Response: audio/wav binary
```

## Example Voices

| Voice ID | Description |
|----------|-------------|
| `af_heart` | American female (warm) |
| `af_bella` | American female (expressive) |
| `af_sarah` | American female (neutral) |
| `am_michael` | American male (trustworthy) |
| `bm_daniel` | British male (classic) |
| `bf_emma` | British female (professional) |

## Docker

```bash
# Build
docker build -f services/matrix-tts-bot/Dockerfile -t matrix-tts-bot services/matrix-tts-bot

# Run
docker run -p 3023:3023 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e TTS_URL=http://mana-tts:3022 \
  -v matrix-tts-bot-data:/app/data \
  matrix-tts-bot
```

## Health Check

```bash
curl http://localhost:3023/health
```

## Dependencies

- **mana-tts**: Must be running on port 3022 (or configured via `TTS_URL`)
- **Matrix homeserver**: Synapse or compatible homeserver

## User Settings

Settings are stored in-memory per Matrix user ID:
- Voice selection persists during bot runtime
- Speed setting persists during bot runtime
- Settings reset when bot restarts

## Testing

```bash
# 1. Ensure mana-tts is running
curl http://localhost:3022/health

# 2. Start the bot
cd services/matrix-tts-bot
pnpm start:dev

# 3. Check bot health
curl http://localhost:3023/health

# 4. In Matrix:
#    - Invite bot to a room
#    - Send a text message
#    - Receive audio response
```
