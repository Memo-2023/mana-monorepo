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
- **AI**: Google Gemini API (`gemini-3-flash-preview` for text, `gemini-2.5-flash-image` for images)
- **Storage**: MinIO (local) / Hetzner S3 (production) via `@manacore/shared-storage`

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
DEV_USER_ID=00000000-0000-0000-0000-000000000000
GEMINI_API_KEY=<your-gemini-api-key>
FIGGOS_STORAGE_PUBLIC_URL=http://localhost:9000/figgos-storage
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=figgos-storage
CORS_ORIGINS=http://localhost:5196,http://localhost:8081
BG_REMOVAL_METHOD=feathered    # optional, see below
```

### Mobile (.env)

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3025
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

### Background Removal (`BG_REMOVAL_METHOD`)

Two methods available for removing white backgrounds from generated card images:

| Method | Env Value | Speed | Quality | Dependencies |
|--------|-----------|-------|---------|--------------|
| **Feathered Threshold** | `feathered` (default) | ~77ms | Good for white/near-white backgrounds | `sharp` only |
| **RMBG-1.4 AI** | `rmbg` | ~1s (first run downloads model) | Better for complex backgrounds | `@huggingface/transformers` |

- **Feathered** (default): Removes near-white pixels (threshold=240) with a soft 10px feather edge. Fast, no model download needed. Works well because Gemini generates cards on white backgrounds.
- **RMBG**: Uses the RMBG-1.4 segmentation model via Hugging Face Transformers. Model is lazy-loaded and cached after first use. Better quality but slower.

Set in `.env`:
```env
BG_REMOVAL_METHOD=feathered   # fast, sharp-based (default)
BG_REMOVAL_METHOD=rmbg        # AI-based, higher quality
```

## Game Concept

- Users create fantasy figures by providing a name + description
- Backend rolls rarity (common 60%, rare 25%, epic 12%, legendary 3%)
- AI generates character profile (subtitle, backstory, stats, items, specialAttack) + card image
- Card style derived from rarity (common gets random variant: kraft/white/mint/warm)
- Figures have rarities: common, rare, epic, legendary
- Stats (attack, defense, special) are clamped to rarity-based ranges

## Generation Pipeline

`POST /api/v1/figures` triggers synchronous generation:

1. **Roll rarity** — weighted random (common 60%, rare 25%, epic 12%, legendary 3%)
2. **Generate profile** — Gemini text model creates subtitle, backstory, visualDescription, items, stats, specialAttack
3. **Generate image** — Gemini image model creates card artwork based on visual description + card style
4. **Remove background** — Strip white background (feathered threshold or RMBG-1.4)
5. **Upload to S3** — Store as WebP in `figgos-storage` bucket
6. **Update DB** — Save generatedProfile, imageUrl, status='completed'

## Architecture Notes

### Shared Package (`@figgos/shared`)

- Uses `"type": "module"` for Node v24 ESM compatibility
- All types inlined in `src/index.ts` (no subdirectory imports — avoids ESM extension issues)
- Imported at runtime by backend (Node v24 type stripping) and bundled by Metro for mobile

### Backend

- Global prefix `api/v1` set by `@manacore/shared-nestjs-setup` — controllers use resource-only names (e.g. `@Controller('figures')`)
- `DEV_BYPASS_AUTH=true` skips JWT validation in development
- Rarity rolled server-side, `cardStyle` derived at generation time (not persisted)
- Generation is synchronous — client waits ~10-15s for full pipeline

### Mobile (Expo SDK 54)

- Re-scaffolded with `create-expo-app` (tabs template) for clean setup
- NativeWind 4 with `react-native-css-interop` as explicit dep (pnpm strict hoisting)
- `babel-preset-expo` configured with `worklets: false` (using Reanimated v3 for Expo Go compat)
- `newArchEnabled: false` in app.json (Expo Go doesn't fully support new architecture)
- Path alias: `~/` maps to project root via tsconfig

### Web (SvelteKit)

- API service at `$lib/api.ts` — simple fetch wrapper, no auth for dev
- Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Neo-brutalist design with 3D flip card detail view
