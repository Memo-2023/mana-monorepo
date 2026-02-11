# Figgos

A collectible figure game where users create and collect AI-generated fantasy figures.

## Project Structure

```
apps/figgos/
├── apps/
│   ├── backend/     # @figgos/backend - NestJS API (port 3025)
│   ├── mobile/      # @figgos/mobile - Expo React Native app
│   └── web/         # @figgos/web - SvelteKit web app (port 5196)
├── packages/
│   └── shared/      # @figgos/shared - Shared types & constants
└── package.json
```

## Commands

### From monorepo root

```bash
pnpm dev:figgos:mobile       # Start mobile app
pnpm dev:figgos:web          # Start web app (port 5196)
pnpm dev:figgos:backend      # Start backend
pnpm dev:figgos:app          # Start web + backend together
pnpm dev:figgos:full         # Start with auth + auto DB setup

pnpm figgos:db:push          # Push schema to database
pnpm figgos:db:studio        # Open Drizzle Studio
```

### From mobile directory

```bash
npx expo start               # Start Expo Go
npx expo start --dev-client  # Start with dev build
npx expo start --clear       # Start with clean cache
```

## Technology Stack

- **Mobile**: React Native 0.81 + Expo SDK 54, NativeWind 4, Expo Router
- **Web**: SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS 4
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **Auth**: Mana Core Auth (JWT via @manacore/shared-nestjs-auth)
- **Shared**: `@figgos/shared` — all types inlined in `src/index.ts` (Node v24 ESM compat)
- **AI**: Google Gemini API (planned)
- **Storage**: MinIO (local) / Hetzner S3 (production)

## Ports

| App | Port |
|-----|------|
| Backend | 3025 |
| Web | 5196 |

## Environment Variables

### Backend (.env)

```env
PORT=3025
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/figgos
MANA_CORE_AUTH_URL=http://localhost:3001
DEV_BYPASS_AUTH=true
DEV_USER_ID=test-user-id
```

### Mobile (.env)

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3025
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Game Concept

- Users create fantasy figures by providing a name + description
- Backend rolls rarity (common 60%, rare 25%, epic 12%, legendary 3%) and generates random stats
- AI generates character info + image (planned V2)
- Figures have rarities: common, rare, epic, legendary
- Users can browse public figures, like them, and collect their own

## Current Status (V1 — Figure Generation)

### Done

- **Backend CRUD**: `POST/GET/DELETE /api/v1/figures` — working, tested via curl
- **DB Schema**: `figures` table with JSONB columns (`userInput`, `stats`)
- **Shared Types**: `@figgos/shared` with `FigureRarity`, `FigureResponse`, rarity weights/ranges
- **Mobile Scaffold**: Expo SDK 54, NativeWind 4 design system, tab navigation (Create, Shelf)
- **Mobile Screens**: Create form (name + description), result card with rarity badge, shelf grid
- **API Service**: `services/api.ts` with typed fetch wrapper + auth token injection

### Known Issues / TODOs

- **Mobile app not yet verified on device** — Expo Go had `PlatformConstants` TurboModule errors with SDK 54. Reanimated downgraded to v3, worklets plugin disabled. Needs testing with `npx expo start --clear`
- **Auth disabled** — `_layout.tsx` currently skips AuthGuard/AuthProvider for faster iteration. Login screen exists at `app/(auth)/login.tsx` but is not wired up
- **No AI image generation** — `imageUrl` is always null, placeholder emoji shown
- **No stats display** — Stats are generated server-side but not shown in the mobile UI
- **Placeholder assets** — icon/splash are default Expo template images

### Next Steps (V2)

1. **Fix mobile runtime** — verify app loads in Expo Go or create a dev build
2. **Wire up auth** — re-enable AuthGuard in `_layout.tsx`, test login flow
3. **Stats display** — show attack/defense/special bars on figure card
4. **AI character generation** — integrate Gemini to populate `characterInfo` JSONB
5. **AI image generation** — generate figure artwork, store in S3, populate `imageUrl`
6. **Shelf improvements** — pull-to-refresh, empty state, delete swipe
7. **Public feed** — browse community figures, like system

## Architecture Notes

### Shared Package (`@figgos/shared`)

- Uses `"type": "module"` for Node v24 ESM compatibility
- All types inlined in `src/index.ts` (no subdirectory imports — avoids ESM extension issues)
- Imported at runtime by backend (Node v24 type stripping) and bundled by Metro for mobile

### Backend

- Global prefix `api/v1` set by `@manacore/shared-nestjs-setup` — controllers use resource-only names (e.g. `@Controller('figures')`)
- `DEV_BYPASS_AUTH=true` skips JWT validation in development
- Rarity + stats rolled server-side in `figures.service.ts`

### Mobile (Expo SDK 54)

- Re-scaffolded with `create-expo-app` (tabs template) for clean setup
- NativeWind 4 with `react-native-css-interop` as explicit dep (pnpm strict hoisting)
- `babel-preset-expo` configured with `worklets: false` (using Reanimated v3 for Expo Go compat)
- `newArchEnabled: false` in app.json (Expo Go doesn't fully support new architecture)
- Path alias: `~/` maps to project root via tsconfig
