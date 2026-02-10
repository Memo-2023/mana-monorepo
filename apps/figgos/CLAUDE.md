# Figgos

A collectible figure game where users create and collect AI-generated fantasy figures.

## Project Structure

```
apps/figgos/
├── apps/
│   ├── backend/     # @figgos/backend - NestJS API (port 3025)
│   └── mobile/      # @figgos/mobile - Expo React Native app
├── packages/
│   └── shared/      # @figgos/shared - Shared types & constants
└── package.json
```

## Commands

### From monorepo root

```bash
pnpm dev:figgos:mobile       # Start mobile app
pnpm dev:figgos:backend      # Start backend
pnpm dev:figgos:app          # Start web + backend together
pnpm dev:figgos:full         # Start with auth + auto DB setup

pnpm figgos:db:push          # Push schema to database
pnpm figgos:db:studio        # Open Drizzle Studio
```

## Technology Stack

- **Mobile**: React Native 0.76 + Expo SDK 52, NativeWind, Expo Router
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Auth**: Mana Core Auth (JWT via @manacore/shared-nestjs-auth)
- **AI**: Google Gemini API (planned)
- **Storage**: MinIO (local) / Hetzner S3 (production)

## Ports

| App | Port |
|-----|------|
| Backend | 3025 |
| Web (planned) | 5181 |

## Environment Variables

### Backend (.env)

```env
PORT=3025
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/figgos
MANA_CORE_AUTH_URL=http://localhost:3001
```

### Mobile (.env)

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3025
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Game Concept

- Users create fantasy figures by providing a name/subject
- AI generates character info (description, lore, items) + image
- Figures have rarities: common, rare, epic, legendary
- Users can browse public figures, like them, and collect their own
