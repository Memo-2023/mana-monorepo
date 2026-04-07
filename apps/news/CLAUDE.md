# News Hub — AI News Reader & Personal Library

## Architecture

Local-first for saved articles, Hono/Bun server for content extraction and AI feed.

```
Browser → IndexedDB (Saved Articles, Categories)
              ↕ sync
         mana-sync → PostgreSQL

Browser → Hono Server → Content Extraction (Mozilla Readability)
                      → AI Feed (from sync_changes)
```

## Project Structure

```
apps/news/
├── apps/
│   ├── web/        # SvelteKit web app (local-first)
│   ├── server/     # Hono/Bun (extraction, feed API)
│   └── landing/    # Astro marketing page
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Web** | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| **Server** | Hono + Bun, Mozilla Readability, JSDOM |
| **Data** | Local-first (Dexie.js + mana-sync) |
| **Auth** | mana-auth (Better Auth + EdDSA JWT) |

## Commands

```bash
pnpm dev:news:web       # SvelteKit dev server
pnpm dev:news:server    # Hono/Bun server (port 3071)
pnpm dev:news:local     # Web + Sync + Server (no auth)
pnpm dev:news:full      # Everything incl. auth
```

## Hono Server Routes

| Route | Auth | Description |
|-------|------|-------------|
| `GET /health` | No | Health check |
| `GET /api/v1/feed` | No | AI article feed (type, categoryId, limit, offset) |
| `GET /api/v1/feed/:id` | No | Single article |
| `POST /api/v1/extract/preview` | No | Preview URL content extraction |
| `POST /api/v1/extract/save` | JWT | Extract + return article data |

## Local-First Collections

| Collection | Purpose |
|-----------|---------|
| `articles` | Saved articles (user_saved) + AI feed cache |
| `categories` | Article categories |

## Key Patterns

- **Content Extraction**: Mozilla Readability + JSDOM for robust HTML parsing
- **Saved Articles**: Local-first via IndexedDB, sync to server
- **AI Feed**: Loaded from Hono server, not local-first (server-generated)
- **Auth**: Guest mode allowed, sync starts on login
