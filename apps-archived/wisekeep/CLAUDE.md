# Wisekeep — AI Wisdom Extraction from Video

## Architecture

Local-first for transcripts/playlists, Hono/Bun server for Groq Whisper transcription.

```
Browser → IndexedDB (Transcripts, Playlists)
              ↕ sync
         mana-sync → PostgreSQL

Browser → Hono Server → yt-dlp (download) → Groq Whisper (transcribe)
```

## Project Structure

```
apps/wisekeep/
├── apps/
│   ├── web/        # SvelteKit web app (local-first)
│   ├── server/     # Hono/Bun (transcription via Groq)
│   └── landing/    # Astro content site (curated talks)
└── package.json
```

## Commands

```bash
pnpm dev:wisekeep:web       # SvelteKit dev server
pnpm dev:wisekeep:server    # Hono/Bun server (port 3072)
pnpm dev:wisekeep:landing   # Landing page
pnpm dev:wisekeep:local     # Web + Sync + Server (no auth)
pnpm dev:wisekeep:full      # Everything incl. auth
```

## Server Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /health` | No | Health check |
| `POST /api/v1/transcribe` | JWT | Transcribe YouTube URL via Groq |

## Prerequisites

- `yt-dlp` installed (`brew install yt-dlp`)
- `GROQ_API_KEY` env variable set

## Local-First Collections

| Collection | Purpose |
|-----------|---------|
| `transcripts` | Video transcriptions (title, channel, transcript text) |
| `playlists` | Organized collections of transcripts |
