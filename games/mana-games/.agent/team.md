# Mana Games Team

## Module: mana-games
**Path:** `games/mana-games`
**Description:** AI-powered browser games platform featuring 22+ playable HTML5 games and an AI game generator that creates new games using multiple LLM providers (Gemini, Claude, GPT-4). Combines a curated game catalog with community-driven game creation capabilities.
**Tech Stack:** NestJS (backend), Astro (web/PWA), Google Gemini/Anthropic/Azure OpenAI (AI generation)
**Platforms:** Backend, Web (PWA)

## Team Overview

This team manages Mana Games, a browser-based gaming platform that democratizes game development through AI. It serves both casual gamers looking for instant entertainment and creators who want to build games without coding knowledge.

### Team Members

| Role | File | Focus Area |
|------|------|------------|
| Product Owner | `product-owner.md` | User engagement, game quality, creator experience |
| Architect | `architect.md` | Multi-model AI integration, PWA architecture, game delivery |
| Senior Developer | `senior-dev.md` | AI prompt engineering, game validation, performance |
| Developer | `developer.md` | Game catalog, UI components, postMessage integration |
| Security Engineer | `security.md` | API key protection, sandboxed game execution, content filtering |
| QA Lead | `qa-lead.md` | Game testing, AI output validation, cross-browser compatibility |

## Key Features
- 22+ curated HTML5 browser games (offline-capable)
- AI game generator with multi-model support (Gemini, Claude, GPT)
- Iterate and refine AI-generated games
- Community game submissions (GitHub integration)
- Progressive Web App (PWA) with offline support
- Game analytics via postMessage API
- Multiple game genres: Arcade, Puzzle, Tower Defense, Idle, Rhythm

## Architecture
```
games/mana-games/
├── apps/
│   ├── backend/          # NestJS API (port 3011)
│   │   ├── game-generator/    # AI game creation
│   │   ├── game-submission/   # Community submissions
│   │   └── health/
│   └── web/              # Astro PWA
│       ├── src/
│       │   ├── pages/         # Astro pages
│       │   ├── data/          # games.ts catalog
│       │   └── services/      # Stats tracking
│       └── public/
│           ├── games/         # 22 HTML game files
│           ├── screenshots/   # Game thumbnails
│           └── icons/         # PWA assets
```

## API Structure
- `GET /api/health` - Health check
- `POST /api/games/generate` - AI game generation (create/iterate modes)
- `POST /api/games/submit` - Community game submission (GitHub)

## AI Models
- **Gemini 2.0 Flash** (default): Fast, cost-effective
- **Gemini 2.5 Pro**: Highest quality
- **Claude 3.5 Sonnet**: Best code quality
- **GPT-4o**: Balanced performance
- All via unified API (Google GenAI SDK, Anthropic SDK, Azure OpenAI)

## Game postMessage Protocol
Games communicate with the platform via:
- `GAME_LOADED` - Game initialization complete
- `GAME_EVENT` - Score updates, achievements, game over
- Enables stats tracking and future leaderboards

## How to Use
```
"As the [Role] for mana-games, help me with..."
"Read games/mana-games/.agent/team/ and help me understand..."
```
