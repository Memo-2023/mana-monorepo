# Arcade - CLAUDE.md

AI-powered browser games platform mit 22+ Spielen und KI-Spielgenerierung.

## Projektstruktur

```
games/arcade/
├── apps/
│   ├── web/              # SvelteKit Web-App (@arcade/web)
│   │   ├── src/
│   │   │   ├── routes/   # SvelteKit-Routen
│   │   │   │   ├── (app)/          # App-Routen mit PillNavigation
│   │   │   │   │   ├── play/[slug] # Spiel im iframe
│   │   │   │   │   ├── create/     # AI Game Generator
│   │   │   │   │   ├── community/  # Community-Spiele
│   │   │   │   │   ├── stats/      # Spieler-Statistiken
│   │   │   │   │   └── play-generated/ # Generierte Spiele
│   │   │   │   └── (auth)/         # Login/Register
│   │   │   └── lib/
│   │   │       ├── components/     # Svelte 5 Komponenten
│   │   │       ├── data/           # Local-first Store, Game-Katalog
│   │   │       ├── stores/         # Theme, Auth, Navigation
│   │   │       ├── services/       # Game-Kommunikation (postMessage)
│   │   │       └── i18n/           # DE + EN Übersetzungen
│   │   └── static/
│   │       ├── games/              # 22 HTML-Spiele
│   │       └── screenshots/        # Game-Thumbnails
│   ├── web-astro/        # Alte Astro-App (Referenz, zum Löschen)
│   └── server/           # Hono/Bun Compute Server (@arcade/server)
│       └── src/
│           ├── routes/
│           │   └── games.ts      # AI-Spielgenerierung + Community-Einreichungen
│           └── index.ts
└── package.json          # Root (arcade)
```

## Tech Stack

| Aspekt | Technologie |
|--------|-------------|
| Frontend | SvelteKit 2 + Svelte 5 (Runes) |
| Styling | Tailwind CSS 4 + @mana/shared-tailwind |
| Auth | @mana/shared-auth (SSO) |
| PWA | @vite-pwa/sveltekit + @mana/shared-pwa |
| State | @mana/local-store (Dexie.js + sync) |
| i18n | svelte-i18n (DE + EN) |
| UI | @mana/shared-ui (PillNav, AuthGate, etc.) |
| Theming | @mana/shared-theme (multi-theme) |
| Server | Hono + Bun (AI-Generierung, Community) |

## Entwicklung

```bash
# Alles starten (Web + Backend)
pnpm arcade:dev

# Nur Web (SvelteKit)
pnpm dev:arcade:web

# Nur Server (Hono/Bun)
pnpm dev:arcade:server

# Web + Backend zusammen
pnpm dev:arcade:app
```

**Ports:**
- Web: http://localhost:5210
- Server: http://localhost:3011

## Local-First Daten

Stats und generierte Spiele werden in IndexedDB gespeichert (Dexie.js) mit optionalem Sync:

**Collections:**
- `gameStats` — Highscores, Spielzeit, Spiele pro Game
- `generatedGames` — Mit KI erstellte Spiele (HTML, Prompt, Modell)
- `favorites` — Favorisierte Spiele

**Dateien:**
- `src/lib/data/local-store.ts` — Dexie-Store Definition
- `src/lib/data/queries.ts` — Reactive Queries (useLiveQuery)
- `src/lib/data/games.ts` — Statischer Spielekatalog (21 Spiele)

## API Endpoints

| Endpoint | Method | Beschreibung |
|----------|--------|--------------|
| `/api/health` | GET | Health Check |
| `/api/games/generate` | POST | AI-Spielgenerierung |
| `/api/games/submit` | POST | Community-Einreichung |

### POST /api/games/generate

```json
{
  "description": "Ein Snake-Spiel im Neon-Stil",
  "mode": "create",
  "model": "gemini-2.0-flash",
  "originalPrompt": "...",
  "currentCode": "..."
}
```

**Unterstützte Modelle:**

| Modell | Provider | Beschreibung |
|--------|----------|--------------|
| `gemini-2.0-flash` | Google | Schnell & günstig (Standard) |
| `gemini-2.5-flash` | Google | Schnell & gut |
| `gemini-2.5-pro` | Google | Höchste Qualität |
| `claude-3.5-haiku` | Anthropic | Schnell & präzise |
| `claude-3.5-sonnet` | Anthropic | Beste Code-Qualität |
| `gpt-4o-mini` | Azure OpenAI | Ausgewogen |
| `gpt-4o` | Azure OpenAI | Sehr gut |

## Environment Variables

```bash
MANA_GAMES_BACKEND_PORT=3011
MANA_GAMES_GOOGLE_GENAI_API_KEY=your_key
MANA_GAMES_ANTHROPIC_API_KEY=your_key
MANA_GAMES_AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
MANA_GAMES_AZURE_OPENAI_API_KEY=your_key
MANA_GAMES_AZURE_OPENAI_DEPLOYMENT=gpt-4o
MANA_GAMES_GITHUB_TOKEN=your_token
MANA_GAMES_GITHUB_OWNER=tillschneider
MANA_GAMES_GITHUB_REPO=arcade
```

## Spiel hinzufügen

1. HTML-Datei in `apps/web/static/games/spiel_name.html`
2. Screenshot in `apps/web/static/screenshots/spiel-name.jpg`
3. Registrieren in `apps/web/src/lib/data/games.ts`

## Spiel-postMessage Integration

```javascript
// Beim Laden
window.parent.postMessage({ type: 'GAME_LOADED', gameId: 'spiel-slug' }, '*');

// Bei Score-Update
window.parent.postMessage({
  type: 'GAME_EVENT', gameId: 'spiel-slug',
  event: 'SCORE_UPDATE', data: { score: 123 }
}, '*');

// Bei Game Over
window.parent.postMessage({
  type: 'GAME_EVENT', gameId: 'spiel-slug',
  event: 'GAME_OVER', data: { score: 123 }
}, '*');
```

## Spielekatalog

**21 Spiele** in folgenden Genres: Arcade, Puzzle, Tower Defense, Idle/Incremental, Jump 'n' Run, Action, Strategie
