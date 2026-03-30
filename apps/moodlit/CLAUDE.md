# Moodlit — Ambient Lighting & Mood App

## Architecture

Local-first for moods/sequences, Hono/Bun server for preset library.

```
Browser → IndexedDB (Moods, Sequences)
              ↕ sync
         mana-sync → PostgreSQL
```

## Project Structure

```
apps/moodlit/
├── apps/
│   ├── web/        # SvelteKit web app (local-first)
│   ├── server/     # Hono/Bun (preset moods API)
│   └── landing/    # Astro landing page
└── package.json
```

## Commands

```bash
pnpm dev:moodlit:web       # SvelteKit dev server
pnpm dev:moodlit:server    # Hono/Bun server (port 3073)
pnpm dev:moodlit:landing   # Landing page
```

## Local-First Collections

| Collection | Fields |
|-----------|--------|
| `moods` | name, colors (hex array), animation, isDefault |
| `sequences` | name, moodIds, duration (seconds) |
