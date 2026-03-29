# Mana Games - CLAUDE.md

AI-powered browser games platform mit 22+ Spielen und KI-Spielgenerierung.

## Projektstruktur

```
games/mana-games/
├── apps/
│   ├── web/              # Astro PWA (@mana-games/web)
│   │   ├── src/
│   │   │   ├── pages/    # Astro-Seiten
│   │   │   ├── layouts/  # Layout-Komponenten
│   │   │   ├── components/
│   │   │   ├── data/     # Spielekatalog (games.ts)
│   │   │   └── services/ # Stats, etc.
│   │   └── public/
│   │       ├── games/    # 22 HTML-Spiele
│   │       ├── screenshots/
│   │       └── icons/    # PWA Icons
│   └── backend/          # NestJS API (@mana-games/backend)
│       └── src/
│           ├── game-generator/   # AI-Spielgenerierung (OpenRouter)
│           ├── game-submission/  # Community-Einreichungen (GitHub API)
│           └── health/
└── package.json          # Root (mana-games)
```

## Entwicklung

```bash
# Alles starten (Web + Backend)
pnpm mana-games:dev

# Nur Web (Astro)
pnpm dev:mana-games:web

# Nur Backend (NestJS)
pnpm dev:mana-games:backend

# Web + Backend zusammen
pnpm dev:mana-games:app
```

**Ports:**
- Web: http://localhost:4321
- Backend: http://localhost:3011

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
  "mode": "create",  // oder "iterate"
  "model": "gemini-2.0-flash",
  "originalPrompt": "...",  // nur bei iterate
  "currentCode": "..."      // nur bei iterate
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

Die Variablen werden zentral in `.env.development` verwaltet:

```bash
MANA_GAMES_BACKEND_PORT=3011

# Google Gemini API
MANA_GAMES_GOOGLE_GENAI_API_KEY=your_key

# Anthropic Claude API
MANA_GAMES_ANTHROPIC_API_KEY=your_key

# Azure OpenAI API
MANA_GAMES_AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
MANA_GAMES_AZURE_OPENAI_API_KEY=your_key
MANA_GAMES_AZURE_OPENAI_DEPLOYMENT=gpt-4o

# GitHub (für Community-Einreichungen)
MANA_GAMES_GITHUB_TOKEN=your_token
MANA_GAMES_GITHUB_OWNER=tillschneider
MANA_GAMES_GITHUB_REPO=mana-games
```

Nach Änderungen: `pnpm setup:env`

## Spiel hinzufügen

1. HTML-Datei erstellen in `apps/web/public/games/spiel_name.html`
2. Screenshot in `apps/web/public/screenshots/spiel-name.jpg`
3. Registrieren in `apps/web/src/data/games.ts`:

```typescript
{
  id: '23',
  title: 'Spiel Titel',
  description: 'Beschreibung',
  slug: 'spiel-name',
  htmlFile: '/games/spiel_name.html',
  thumbnail: '/screenshots/spiel-name.jpg',
  tags: ['Arcade', 'Action'],
  difficulty: 'Mittel',
  complexity: 'Einfach',
  controls: 'Pfeiltasten zum Steuern'
}
```

## Spiel-postMessage Integration

```javascript
// Beim Laden
window.parent.postMessage({
  type: 'GAME_LOADED',
  gameId: 'spiel-slug'
}, '*');

// Bei Score-Update
window.parent.postMessage({
  type: 'GAME_EVENT',
  gameId: 'spiel-slug',
  event: 'SCORE_UPDATE',
  data: { score: 123 }
}, '*');

// Bei Game Over
window.parent.postMessage({
  type: 'GAME_EVENT',
  gameId: 'spiel-slug',
  event: 'GAME_OVER',
  data: { score: 123 }
}, '*');
```

## Design

**Farbschema:**
- Primary Background: `#0a0a0a`
- Secondary Background: `#1a1a1a`
- Accent: `#00ff88`
- Text: `#ffffff`
- Border: `#2a2a2a`

## PWA

- Manifest: `apps/web/public/manifest.json`
- Service Worker: `apps/web/public/sw.js`
- Icons in `apps/web/public/icons/` (72x72 bis 512x512)

## Spielekatalog

**22 Spiele** in folgenden Genres:
- Arcade
- Puzzle
- Tower Defense
- Idle/Incremental
- Jump 'n' Run
- Action
- Strategie
