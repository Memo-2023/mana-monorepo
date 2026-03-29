# ManaVoxel Project Guide

## Overview

**ManaVoxel** is a 2D top-down pixel platform where players create detailed miniature worlds, program items with behaviors, and share them — all in the browser.

| App | Port | URL |
|-----|------|-----|
| Web App | 5195 | http://localhost:5195 |

## Project Structure

```
apps/manavoxel/
├── apps/
│   └── web/          # SvelteKit + PixiJS client (@manavoxel/web)
├── packages/
│   └── shared/       # Shared types (@manavoxel/shared)
├── package.json
└── CLAUDE.md
```

## Commands

```bash
# From monorepo root
pnpm dev:manavoxel:web    # Start web app (port 5195)

# From apps/manavoxel
pnpm dev                  # Start all apps
pnpm dev:web              # Start web only
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Rendering** | PixiJS 8 (WebGL) |
| **UI** | SvelteKit 2, Svelte 5 (runes), Tailwind CSS 4 |
| **Local-First** | Dexie.js via @manacore/local-store |
| **Auth** | Mana Core Auth (JWT) |
| **i18n** | svelte-i18n (DE, EN, FR, ES, IT) |

## Zoom Levels

| Level | 1 Pixel = | Use |
|-------|-----------|-----|
| Street | 10cm | Walking, interaction, combat |
| Interior | 5cm | Exploring rooms, furniture |
| Detail | 1cm | Item/character sprite editing |

## Core Concepts

- **Areas**: Streets (10cm) and interiors (5cm) are separate pixel grids connected by portals
- **Items**: Pixel sprites (1cm) with properties (sliders) and behaviors (trigger-actions)
- **Floors**: Interiors have multiple floors, connected by stairs
- **Local-First**: Everything works offline via Dexie.js, syncs via mana-sync
