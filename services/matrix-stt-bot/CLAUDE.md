# Matrix STT Bot - Claude Code Guidelines

## Overview

Matrix STT Bot converts audio/voice messages to text and sends them back as text messages. Uses the mana-stt service (port 3020) for transcription.

## Tech Stack

- **Framework**: NestJS 10
- **Matrix**: matrix-bot-sdk
- **STT Backend**: mana-stt service (Whisper, Voxtral)

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
services/matrix-stt-bot/
├── src/
│   ├── main.ts               # Application entry point (port 3024)
│   ├── app.module.ts         # Root module
│   ├── config/
│   │   └── configuration.ts  # Configuration & help text
│   ├── bot/
│   │   ├── bot.module.ts
│   │   └── matrix.service.ts # Matrix client & message handler
│   └── stt/
│       ├── stt.module.ts
│       └── stt.service.ts    # mana-stt API client
├── Dockerfile
└── package.json
```

## Bot Commands

| Command | Description |
|---------|-------------|
| `!help` / `!hilfe` | Show help text |
| `!language [de\|en\|auto]` | Change transcription language |
| `!model [whisper\|voxtral\|auto]` | Change STT model |
| `!status` | Show current settings |
| (voice message) | Transcribe to text |

## Message Flow

1. User sends voice/audio message
2. Bot receives via matrix-bot-sdk
3. Audio downloaded from Matrix
4. STT service transcribes audio
5. Text message sent back to room

## Environment Variables

```env
# Server
PORT=3024

# Matrix
MATRIX_HOMESERVER_URL=http://localhost:8008
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ALLOWED_ROOMS=!roomid:matrix.mana.how
MATRIX_STORAGE_PATH=./data/bot-storage.json

# STT Service
STT_URL=http://localhost:3020

# Defaults
DEFAULT_LANGUAGE=de
DEFAULT_MODEL=whisper
```

## STT API Integration

The bot sends audio to mana-stt for transcription:

```typescript
// Default Whisper endpoint
POST /transcribe
FormData: file=audio.ogg, language=de

// Voxtral endpoint (with speaker diarization)
POST /transcribe/voxtral
FormData: file=audio.ogg, language=de

// Auto-select endpoint
POST /transcribe/auto
FormData: file=audio.ogg, prefer=whisper

// Response
{
  "text": "Das ist der transkribierte Text...",
  "language": "de",
  "model": "whisper-large-v3-turbo",
  "duration": 3.5
}
```

## Available Models

| Model | Description |
|-------|-------------|
| `whisper` | Whisper Large V3 (local, fast, 99+ languages) |
| `voxtral` | Voxtral Mini (cloud, speaker diarization) |
| `auto` | Automatic model selection |

## Supported Languages

| Code | Language |
|------|----------|
| `de` | German (default) |
| `en` | English |
| `auto` | Automatic detection |

## Supported Audio Formats

- OGG, MP3, WAV, M4A, FLAC, WebM, Opus
- Matrix voice messages (typically OGG/Opus)

## Docker

```bash
# Build
docker build -f services/matrix-stt-bot/Dockerfile -t matrix-stt-bot .

# Run
docker run -p 3024:3024 \
  -e MATRIX_HOMESERVER_URL=http://synapse:8008 \
  -e MATRIX_ACCESS_TOKEN=syt_xxx \
  -e STT_URL=http://mana-stt:3020 \
  -v matrix-stt-bot-data:/app/data \
  matrix-stt-bot
```

## Health Check

```bash
curl http://localhost:3024/health
```

## Dependencies

- **mana-stt**: Must be running on port 3020 (or configured via `STT_URL`)
- **Matrix homeserver**: Synapse or compatible homeserver

## User Settings

Settings are stored in-memory per Matrix user ID:
- Language selection persists during bot runtime
- Model selection persists during bot runtime
- Settings reset when bot restarts

## Testing

```bash
# 1. Ensure mana-stt is running
curl http://localhost:3020/health

# 2. Start the bot
cd services/matrix-stt-bot
pnpm start:dev

# 3. Check bot health
curl http://localhost:3024/health

# 4. In Matrix:
#    - Invite bot to a room
#    - Send a voice message
#    - Receive text transcription
```

## Related Services

| Service | Port | Description |
|---------|------|-------------|
| mana-stt | 3020 | STT backend service |
| matrix-tts-bot | 3023 | Text-to-speech bot (reverse of this) |
| mana-tts | 3022 | TTS backend service |
