# NutriPhi Project Guide

## Overview

**NutriPhi** is an AI-powered nutrition tracking app that allows users to photograph their meals and receive instant nutritional analysis. It uses Google Gemini for image analysis and provides personalized recommendations.

| App | Port | URL |
|-----|------|-----|
| Backend | 3023 | http://localhost:3023 |
| Web App | 5180 | http://localhost:5180 |
| Landing Page | 4323 | http://localhost:4323 |

## Project Structure

```
apps/nutriphi/
├── apps/
│   ├── backend/      # NestJS API server (@nutriphi/backend)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── db/           # Drizzle schemas
│   │       │   ├── schema/index.ts
│   │       │   └── db.ts
│   │       ├── meal/         # Meal CRUD
│   │       ├── goals/        # User goals
│   │       ├── favorites/    # Favorite meals
│   │       ├── analysis/     # Gemini AI integration
│   │       ├── stats/        # Daily/weekly statistics
│   │       ├── recommendations/  # AI hints & coaching
│   │       └── health/
│   │
│   ├── web/          # SvelteKit web application (@nutriphi/web)
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── api/client.ts
│   │       │   ├── stores/
│   │       │   │   ├── auth.svelte.ts
│   │       │   │   └── meals.svelte.ts
│   │       │   └── components/
│   │       │       ├── Header.svelte
│   │       │       ├── DailySummary.svelte
│   │       │       ├── MealList.svelte
│   │       │       ├── AddMealButton.svelte
│   │       │       └── ProgressRing.svelte
│   │       └── routes/
│   │           ├── +layout.svelte
│   │           ├── +page.svelte      # Dashboard
│   │           ├── login/+page.svelte
│   │           └── add/+page.svelte  # Photo/text input
│   │
│   └── landing/      # Astro marketing page (@nutriphi/landing)
│
├── packages/
│   └── shared/       # Shared types, utils, constants (@nutriphi/shared)
│       └── src/
│           ├── types/index.ts
│           ├── constants/index.ts
│           └── utils/index.ts
│
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# Start all apps
pnpm nutriphi:dev

# Individual apps
pnpm dev:nutriphi:backend     # Backend (port 3015)
pnpm dev:nutriphi:web         # Web app (port 5180)
pnpm dev:nutriphi:landing     # Landing page (port 4323)
pnpm dev:nutriphi:app         # Web + backend together

# Database
pnpm nutriphi:db:push         # Push schema to database
pnpm nutriphi:db:studio       # Open Drizzle Studio
```

### Backend (apps/nutriphi/apps/backend)

```bash
pnpm dev                      # Start with hot reload
pnpm build                    # Build for production
pnpm db:push                  # Push schema to database
pnpm db:studio                # Open Drizzle Studio
```

### Web App (apps/nutriphi/apps/web)

```bash
pnpm dev                      # Start dev server (port 5180)
pnpm build                    # Build for production
```

### Landing Page (apps/nutriphi/apps/landing)

```bash
pnpm dev                      # Start dev server (port 4323)
pnpm build                    # Build for production
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL |
| **AI** | Google Gemini 2.5 Flash |
| **Web** | SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS 4 |
| **Landing** | Astro 5.x, Tailwind CSS |
| **Auth** | Mana Core Auth (JWT) |

## Architecture

### Core Features

1. **Photo Analysis** - Take a photo, Gemini identifies foods and calculates nutrition
2. **Text Input** - Alternative: describe your meal in text
3. **Full Nutrition** - Calories, macros, vitamins, minerals
4. **Daily Goals** - Set and track calorie/macro targets
5. **AI Coaching** - Personalized tips based on eating patterns
6. **Favorites** - Save frequently eaten meals
7. **Privacy-First** - Photos are never stored, only analysis results

### API Endpoints

#### Health
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Health check |

#### Analysis
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/analysis/photo` | POST | Analyze photo (Base64) |
| `/api/v1/analysis/text` | POST | Analyze text description |

#### Meals
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/meals` | GET | List meals (query by date) |
| `/api/v1/meals` | POST | Create meal |
| `/api/v1/meals/:id` | GET | Get meal details |
| `/api/v1/meals/:id` | PATCH | Update meal |
| `/api/v1/meals/:id` | DELETE | Delete meal |

#### Goals
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/goals` | GET | Get user goals |
| `/api/v1/goals` | POST | Set/update goals |
| `/api/v1/goals` | DELETE | Delete goals |

#### Favorites
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/favorites` | GET | List favorites |
| `/api/v1/favorites` | POST | Create favorite |
| `/api/v1/favorites/:id/use` | POST | Increment usage count |
| `/api/v1/favorites/:id` | DELETE | Delete favorite |

#### Stats
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/stats/daily` | GET | Daily summary |
| `/api/v1/stats/weekly` | GET | Weekly stats |

#### Recommendations
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/recommendations` | GET | List active recommendations |
| `/api/v1/recommendations/:id/dismiss` | POST | Dismiss recommendation |

### Database Schema

#### user_goals
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User ID |
| daily_calories | INTEGER | Daily calorie target |
| daily_protein | INTEGER | Protein target (g) |
| daily_carbs | INTEGER | Carbs target (g) |
| daily_fat | INTEGER | Fat target (g) |

#### meals
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User ID |
| date | TIMESTAMP | Meal date/time |
| meal_type | VARCHAR | breakfast/lunch/dinner/snack |
| input_type | VARCHAR | photo/text |
| description | TEXT | AI-generated description |
| confidence | REAL | AI confidence (0-1) |

#### meal_nutrition
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| meal_id | UUID | FK to meals |
| calories | REAL | Calories (kcal) |
| protein | REAL | Protein (g) |
| carbohydrates | REAL | Carbs (g) |
| fat | REAL | Fat (g) |
| fiber | REAL | Fiber (g) |
| sugar | REAL | Sugar (g) |
| vitamin_* | REAL | Various vitamins |
| calcium, iron, etc. | REAL | Minerals |

#### favorite_meals
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User ID |
| name | VARCHAR | Favorite name |
| nutrition | JSONB | Cached nutrition data |
| usage_count | INTEGER | Times used |

#### recommendations
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User ID |
| type | VARCHAR | hint/coaching |
| message | TEXT | Recommendation text |
| dismissed | BOOLEAN | User dismissed |

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3023
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/nutriphi
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5180,http://localhost:4323

# Gemini AI (uses gemini-2.5-flash model)
GEMINI_API_KEY=your-gemini-api-key
```

> **Note:** Get your API key from https://aistudio.google.com/apikey

### Web (.env)

```env
PUBLIC_BACKEND_URL=http://localhost:3023
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Shared Package (@nutriphi/shared)

**Types:**
- `UserGoals` - Daily nutrition targets
- `Meal`, `MealNutrition` - Meal data
- `FavoriteMeal` - Saved favorites
- `DailySummary`, `WeeklyStats` - Statistics
- `AIAnalysisResult` - Gemini response format
- `Recommendation` - AI hints/coaching

**Constants:**
- `DEFAULT_DAILY_VALUES` - Reference daily values
- `MEAL_TYPE_LABELS` - Localized meal names
- `NUTRIENT_INFO` - Labels, units, colors
- `CREDIT_COSTS` - Credit pricing

**Utils:**
- `calculateProgress()` - Progress towards goals
- `sumNutrition()` - Sum multiple meals
- `formatNutrient()` - Display formatting
- `detectDeficiencies()` - Find nutrient gaps
- `suggestMealType()` - Based on time of day

## Quick Start

### 1. Create Database

```bash
# PostgreSQL must be running
docker compose -f docker-compose.dev.yml up -d postgres

# Create database
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE nutriphi;"

# Push schema
pnpm nutriphi:db:push
```

### 2. Set Gemini API Key

Add to `.env.development`:
```env
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Start Apps

```bash
# Backend + Web together
pnpm dev:nutriphi:app

# Or individually:
pnpm dev:nutriphi:backend  # Terminal 1
pnpm dev:nutriphi:web      # Terminal 2
pnpm dev:nutriphi:landing  # Terminal 3
```

### 4. Open URLs

- Web App: http://localhost:5180
- Landing: http://localhost:4323
- API Health: http://localhost:3023/api/v1/health

## Testing API

```bash
# Health Check
curl http://localhost:3023/api/v1/health

# Login (get token)
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# Analyze text
curl -X POST http://localhost:3023/api/v1/analysis/text \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description": "Spaghetti Bolognese mit Parmesan"}'

# Get daily summary
curl http://localhost:3023/api/v1/stats/daily \
  -H "Authorization: Bearer $TOKEN"
```

## Credit System

| Action | Credits |
|--------|---------|
| Photo Analysis | 5 |
| Text Analysis | 2 |
| AI Coaching | 10 |

## Privacy Features

- Photos are NEVER stored on servers
- Photos are sent directly to Gemini, analyzed, then discarded
- Only nutrition results are saved
- Full data export available (GDPR)
- One-click account deletion

## Color Theme

| Color | Value | Usage |
|-------|-------|-------|
| Primary | #22C55E | Main actions, progress |
| Secondary | #F97316 | Accent, warnings |
| Accent | #14B8A6 | Highlights |
| Calories | #F59E0B | Calorie displays |
| Protein | #EF4444 | Protein displays |
| Carbs | #3B82F6 | Carb displays |
| Fat | #8B5CF6 | Fat displays |
