# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Worldream** is a text-first platform for building and managing fictional worlds. It allows users to create and manage Characters, Objects, Places, and Stories as text-based entities that can be referenced and combined using @slug notation.

Key Concepts:

- **Content Nodes**: Unified entities representing worlds, characters, objects, places, and stories
- **@slug References**: Human-readable way to link entities within text (e.g., `@mira`, `@neo_station`)
- **Text-First Design**: All content is primarily text/markdown with optional attachments
- **LLM-Friendly**: Designed to work well with language models through clear text formats and prompt guidelines

## Development Commands

```bash
# Install dependencies (using pnpm)
pnpm install

# Start development server
pnpm dev
# or with browser auto-open
pnpm dev -- --open

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check
# Watch mode for type checking
pnpm check:watch

# Linting and formatting
pnpm lint        # Check formatting and run ESLint
pnpm format      # Auto-format with Prettier
```

## Architecture

### Tech Stack

- **Framework**: SvelteKit with TypeScript und Svelte 5 (Runes Syntax)
- **Styling**: Tailwind CSS v4 (configured via Vite plugin)
- **Preprocessors**: Vite preprocessing for Svelte
- **Adapter**: Node.js adapter for deployment flexibility
- **Package Manager**: pnpm with workspace optimization
- **AI Integration**:
  - OpenAI API mit GPT-5-mini für Text-Generierung (siehe wichtige Hinweise unten!)
  - Google Gemini gemini-2.5-flash-image-preview für Bild-Generierung

### Project Structure

- `/src/routes/` - SvelteKit pages and API endpoints
- `/src/lib/` - Shared components and utilities
- `/src/app.css` - Global styles with Tailwind imports
- `/src/app.d.ts` - TypeScript ambient declarations
- `/static/` - Static assets

### Configuration Files

- `svelte.config.js` - SvelteKit configuration with Node adapter
- `vite.config.ts` - Vite config with Tailwind and SvelteKit plugins
- `tsconfig.json` - TypeScript config extending SvelteKit defaults (strict mode enabled)
- `eslint.config.js` - ESLint flat config with TypeScript and Svelte support

### Planned Data Model (from docs/ProjectPlan.md)

The project will use a unified `content_nodes` table with:

- Meta fields: id, kind, slug, title, summary, visibility, tags, etc.
- Content stored as JSONB with standardized keys across all entity types
- Full-text search via PostgreSQL tsvector
- Optional versioning via `node_revisions` table
- Story entries as separate timeline items

## Development Guidelines

### Svelte 5 Runes Syntax

This project uses Svelte 5 with runes - WICHTIG: Keine Legacy-Syntax verwenden!

- Use `$state()` for reactive state
- Use `$derived()` for computed values (NOT `$:` reactive statements)
- Use `$effect()` for side effects
- Use `$props()` for component props
- Use `{@render}` for rendering children/snippets
- Components use TypeScript with `<script lang="ts">`

### Import Aliases

- `$lib` maps to `/src/lib/`
- Additional aliases can be configured in svelte.config.js

### Database Integration (Implemented)

- Uses Supabase (PostgreSQL) with hybrid schema
- Content stored as JSONB for flexibility
- Row Level Security (RLS) based on owner_id and visibility
- Full-text search via generated tsvector columns
- World-centric navigation: All content is created within a world context

## ⚠️ KRITISCH: GPT-5-mini API Einschränkungen

**WICHTIG**: Dieses Projekt nutzt GPT-5-mini, ein spezielles OpenAI-Modell mit strikten Einschränkungen:

### Parameter-Einschränkungen

1. **Temperature**: 
   - **NUR `temperature: 1.0` wird unterstützt!**
   - Andere Werte (0.7, 0.8, etc.) führen zu einem 400 Error
   - Am besten den Parameter komplett weglassen (1.0 ist default)

2. **Token Limits**:
   - **MUSS `max_completion_tokens` verwenden, NICHT `max_tokens`!**
   - `max_tokens` führt zu einem 400 Error
   - Typische Werte: 1000-5000 für normale Generierung

### Korrekte Verwendung

```typescript
// ✅ RICHTIG
const completion = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  // temperature weglassen oder 1.0
  max_completion_tokens: 2000  // NICHT max_tokens!
});

// ❌ FALSCH - führt zu 400 Error
const completion = await openai.chat.completions.create({
  model: 'gpt-5-mini',
  messages: [...],
  temperature: 0.7,  // ERROR!
  max_tokens: 2000   // ERROR! Muss max_completion_tokens sein
});
```

### Modell-Details

- **Knowledge Cutoff**: Mai 30, 2024
- **Kosten**: $0.25/1M Input, $2.00/1M Output
- **Features**: Unterstützt JSON mode, Streaming, Tools, Vision
- **Performance**: Gute Balance zwischen Geschwindigkeit und Qualität

### Debugging

Wenn API-Calls fehlschlagen:
1. Prüfe ob `temperature` != 1.0 gesetzt ist
2. Prüfe ob `max_tokens` statt `max_completion_tokens` verwendet wird
3. Prüfe die Console für detaillierte Fehlermeldungen

Weitere Details siehe `/docs/GPT5-MINI.md`
