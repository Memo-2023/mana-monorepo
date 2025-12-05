# Figgos

A collectible figure game where users create and collect AI-generated fantasy figures.

## Project Structure

```
games/figgos/
├── apps/
│   ├── mobile/         # @figgos/mobile - Expo React Native app
│   ├── web/            # @figgos/web - SvelteKit web app (planned)
│   └── backend/        # @figgos/backend - NestJS API (planned)
├── packages/
│   └── shared/         # @figgos/shared - Shared types & constants (planned)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

## Development Commands

```bash
# From monorepo root:
pnpm dev:figgos:mobile       # Start mobile app
pnpm dev:figgos:web          # Start web app (when available)
pnpm dev:figgos:backend      # Start backend (when available)
pnpm dev:figgos:app          # Start web + backend together

# Database (when backend is available)
pnpm figgos:db:push          # Push schema to database
pnpm figgos:db:studio        # Open Drizzle Studio
```

## Technology Stack

### Mobile App
- React Native 0.76 + Expo SDK 52
- Expo Router (file-based routing)
- NativeWind (Tailwind for React Native)
- Supabase (currently, migrating to Mana Core Auth)

### Web App (Planned)
- SvelteKit 2.x + Svelte 5
- Tailwind CSS
- Mana Core Auth integration

### Backend (Planned)
- NestJS 11
- Drizzle ORM + PostgreSQL
- OpenAI API for figure generation
- S3-compatible storage (MinIO/Hetzner)

## Ports

| App | Port |
|-----|------|
| Web | 5181 |
| Backend | 3012 |

## Environment Variables

### Backend
```env
PORT=3012
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/figgos
MANA_CORE_AUTH_URL=http://localhost:3001
OPENAI_API_KEY=...
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=figgos-storage
```

### Web
```env
PUBLIC_FIGGOS_API_URL=http://localhost:3012
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Game Concept

- Users create fantasy figures by providing a subject/prompt
- AI generates character info (description, lore, items)
- AI generates the figure image
- Figures have rarities: common, rare, epic, legendary
- Users can browse public figures, like them, and collect their own
