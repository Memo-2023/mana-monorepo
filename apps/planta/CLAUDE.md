# Planta Project Guide

## Project Structure

```
apps/planta/
├── apps/
│   ├── backend/      # NestJS API server (@planta/backend)
│   └── web/          # SvelteKit web application (@planta/web)
├── packages/
│   └── shared/       # Shared types, utils (@planta/shared)
└── package.json
```

## Commands

### Root Level (from monorepo root)

```bash
pnpm planta:dev                   # Run all planta apps
pnpm dev:planta:web               # Start web app
pnpm dev:planta:backend           # Start backend server
pnpm dev:planta:app               # Start web + backend together
pnpm dev:planta:full              # Start auth + backend + web with DB setup
```

### Backend (apps/planta/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
```

### Web App (apps/planta/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

## Technology Stack

- **Web**: SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS
- **Backend**: NestJS 10, Drizzle ORM, PostgreSQL
- **AI**: Google Gemini Vision for plant analysis
- **Storage**: MinIO (S3-compatible)
- **Auth**: Mana Core Auth (JWT)
- **Types**: TypeScript 5.x

## Architecture

### Core Flow

1. User uploads plant photo
2. Photo stored in S3/MinIO
3. Gemini Vision analyzes the image
4. Plant profile created with care recommendations
5. Watering schedule tracked

### Backend API Endpoints

| Endpoint                        | Method | Description              |
| ------------------------------- | ------ | ------------------------ |
| `/api/health`                   | GET    | Health check             |
| `/api/plants`                   | GET    | Get user's plants        |
| `/api/plants`                   | POST   | Create new plant         |
| `/api/plants/:id`               | GET    | Get plant details        |
| `/api/plants/:id`               | PUT    | Update plant             |
| `/api/plants/:id`               | DELETE | Delete plant             |
| `/api/photos/upload`            | POST   | Upload plant photo       |
| `/api/photos/:id`               | DELETE | Delete photo             |
| `/api/analysis/identify`        | POST   | Analyze photo with AI    |
| `/api/analysis/:photoId`        | GET    | Get analysis results     |
| `/api/watering/upcoming`        | GET    | Plants needing water     |
| `/api/watering/:plantId/water`  | POST   | Log watering event       |

### Database Schema

**plants** - User's plants

- `id` (UUID) - Primary key
- `user_id` (TEXT) - User reference
- `name` (TEXT) - Plant nickname
- `scientific_name` (TEXT) - From AI analysis
- `common_name` (TEXT) - Common name
- `light_requirements` (TEXT) - low/medium/bright/direct
- `watering_frequency_days` (INT) - Days between watering
- `humidity` (TEXT) - low/medium/high
- `care_notes` (TEXT) - Care tips
- `health_status` (TEXT) - healthy/needs_attention/sick

**plant_photos** - Plant photos

- `id` (UUID) - Primary key
- `plant_id` (UUID) - FK to plants
- `storage_path` (TEXT) - S3 path
- `public_url` (TEXT) - Public URL
- `is_primary` (BOOLEAN) - Primary photo flag
- `is_analyzed` (BOOLEAN) - Analysis flag

**plant_analyses** - AI analysis results

- `id` (UUID) - Primary key
- `photo_id` (UUID) - FK to plant_photos
- `identified_species` (TEXT) - Detected species
- `confidence` (INT) - 0-100 confidence
- `health_assessment` (TEXT) - Health status
- `watering_advice` (TEXT) - Watering recommendation
- `general_tips` (JSONB) - Care tips array

**watering_schedules** - Watering tracking

- `id` (UUID) - Primary key
- `plant_id` (UUID) - FK to plants
- `frequency_days` (INT) - Interval
- `last_watered_at` (TIMESTAMP) - Last watering
- `next_watering_at` (TIMESTAMP) - Next watering

### Environment Variables

#### Backend (.env)

```
NODE_ENV=development
PORT=3022
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/planta
MANA_CORE_AUTH_URL=http://localhost:3001
GOOGLE_GEMINI_API_KEY=xxx
CORS_ORIGINS=http://localhost:5173,http://localhost:5191
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=planta-storage
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
```

#### Web (.env)

```
PUBLIC_BACKEND_URL=http://localhost:3022
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Shared Package

### @planta/shared

- Types: `Plant`, `PlantPhoto`, `PlantAnalysis`, `WateringSchedule`
- Utils: Date helpers, care level formatters

## Code Style Guidelines

- **TypeScript**: Strict typing with interfaces
- **Web**: Svelte 5 runes mode (`$state`, `$derived`, `$effect`)
- **Styling**: Tailwind CSS
- **Formatting**: Prettier with project config

## Important Notes

1. **Authentication**: Uses Mana Core Auth (JWT in Authorization header)
2. **Database**: PostgreSQL with Drizzle ORM
3. **Port**: Backend runs on port 3022 by default
4. **Storage**: Photos stored in MinIO (S3-compatible)
5. **AI**: Google Gemini Vision for plant identification
