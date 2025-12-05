# Moodlit Project Guide

## Übersicht

**Moodlit** ist eine Ambient-Lighting-App, die es Benutzern ermöglicht, benutzerdefinierte Lichtstimmungen mit Farbverläufen und Animationen zu erstellen. Die App unterstützt sowohl bildschirmbasierte Beleuchtung als auch Geräte-Taschenlampensteuerung.

| App | Port | URL |
|-----|------|-----|
| Backend | 3012 | http://localhost:3012 |
| Web App | 5182 | http://localhost:5182 |
| Landing Page | 4332 | http://localhost:4332 |

## Project Structure

```
apps/moodlit/
├── apps/
│   ├── backend/          # NestJS API server (@moodlit/backend)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── db/
│   │       │   ├── database.module.ts
│   │       │   ├── connection.ts
│   │       │   └── schema/
│   │       │       ├── moods.schema.ts
│   │       │       └── sequences.schema.ts
│   │       ├── moods/
│   │       │   ├── moods.module.ts
│   │       │   ├── moods.controller.ts
│   │       │   ├── moods.service.ts
│   │       │   └── dto/
│   │       ├── sequences/
│   │       │   ├── sequences.module.ts
│   │       │   ├── sequences.controller.ts
│   │       │   ├── sequences.service.ts
│   │       │   └── dto/
│   │       └── health/
│   │
│   ├── web/              # SvelteKit web app (@moodlit/web)
│   │   └── src/
│   │       ├── app.html
│   │       ├── app.css
│   │       └── routes/
│   │           ├── +layout.svelte
│   │           └── +page.svelte
│   │
│   ├── mobile/           # Expo React Native app (@moodlit/mobile)
│   │   ├── app/          # Expo Router routes
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store/
│   │   └── utils/
│   │
│   └── landing/          # Astro landing page (@moodlit/landing)
│
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# Alle Apps starten
pnpm moodlit:dev                    # Run all moodlit apps

# Einzelne Apps starten
pnpm dev:moodlit:backend            # Start backend server (port 3012)
pnpm dev:moodlit:web                # Start web app (port 5182)
pnpm dev:moodlit:mobile             # Start mobile app
pnpm dev:moodlit:landing            # Start landing page (port 4332)
pnpm dev:moodlit:app                # Start web + backend together

# Datenbank
pnpm moodlit:db:push                # Push schema to database
pnpm moodlit:db:studio              # Open Drizzle Studio
pnpm moodlit:db:seed                # Seed initial data

# Deploy
pnpm deploy:landing:moodlit         # Deploy landing to Cloudflare Pages
```

### Backend (apps/moodlit/apps/backend)

```bash
pnpm dev                         # Start with hot reload
pnpm build                       # Build for production
pnpm start:prod                  # Start production server
pnpm db:push                     # Push schema to database
pnpm db:studio                   # Open Drizzle Studio
```

### Web App (apps/moodlit/apps/web)

```bash
pnpm dev                         # Start dev server
pnpm build                       # Build for production
pnpm preview                     # Preview production build
```

### Mobile App (apps/moodlit/apps/mobile)

```bash
pnpm dev                         # Start Expo dev server
pnpm ios                         # Build and run iOS simulator
pnpm android                     # Build and run Android emulator
pnpm build:dev                   # EAS development build
```

### Landing Page (apps/moodlit/apps/landing)

```bash
pnpm dev                         # Start dev server (port 4332)
pnpm build                       # Build for production
pnpm preview                     # Preview build
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes), Tailwind CSS 4 |
| **Mobile** | Expo SDK 54, React Native 0.81, NativeWind, Zustand |
| **Landing** | Astro 5.x, Tailwind CSS |
| **Auth** | Mana Core Auth (JWT) |

## Features

### 1. Mood Library
- Vorkonfigurierte Lichtstimmungen (Fire, Breath, Northern Lights, Thunder, etc.)
- Verschiedene Farbverläufe und Animationstypen
- Standard-Moods für jeden Benutzer

### 2. Custom Moods
- Erstelle eigene Lichtstimmungen
- Anpassbare Farben und Animationen
- Speichern und Wiederverwenden

### 3. Sequences
- Mehrere Moods zu einer Sequenz verketten
- Konfigurierbare Dauer und Übergänge
- Automatische Wiedergabe

### 4. Dual Output
- Bildschirmbasierte Beleuchtung
- Geräte-Taschenlampensteuerung
- Umschalten zwischen Modi

## API Endpoints

### Health
```
GET    /api/v1/health              # Health check
```

### Moods
```
GET    /api/v1/moods               # List all moods
POST   /api/v1/moods               # Create mood
GET    /api/v1/moods/:id           # Get mood
PUT    /api/v1/moods/:id           # Update mood
DELETE /api/v1/moods/:id           # Delete mood
```

### Sequences
```
GET    /api/v1/sequences           # List all sequences
POST   /api/v1/sequences           # Create sequence
GET    /api/v1/sequences/:id       # Get sequence
PUT    /api/v1/sequences/:id       # Update sequence
DELETE /api/v1/sequences/:id       # Delete sequence
```

## Database Schema

### moods
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner |
| `name` | TEXT | Mood name |
| `colors` | JSONB | Array of color hex codes |
| `animation` | TEXT | Animation type |
| `is_default` | BOOLEAN | Default mood flag |
| `created_at` | TIMESTAMP | Created date |
| `updated_at` | TIMESTAMP | Updated date |

### sequences
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner |
| `name` | TEXT | Sequence name |
| `mood_ids` | JSONB | Array of mood IDs |
| `duration` | INTEGER | Duration per mood (seconds) |
| `created_at` | TIMESTAMP | Created date |
| `updated_at` | TIMESTAMP | Updated date |

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3012
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/moods
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173,http://localhost:5182,http://localhost:8081
DEV_BYPASS_AUTH=true
DEV_USER_ID=your-test-user-id
```

### Web (.env)
```env
PUBLIC_BACKEND_URL=http://localhost:3012
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

### Mobile (.env)
```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:3012
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Quick Start

### 1. Datenbank erstellen

```bash
# PostgreSQL Container muss laufen
docker compose -f docker-compose.dev.yml up -d postgres

# Datenbank erstellen
PGPASSWORD=devpassword psql -h localhost -U manacore -d postgres -c "CREATE DATABASE moods;"

# Schema pushen
pnpm moodlit:db:push
```

### 2. Apps starten

```bash
# Backend + Web zusammen
pnpm dev:moodlit:app

# Oder einzeln:
pnpm dev:moodlit:backend  # Terminal 1
pnpm dev:moodlit:web      # Terminal 2
pnpm dev:moodlit:mobile   # Terminal 3
pnpm dev:moodlit:landing  # Terminal 4 (optional)
```

### 3. URLs öffnen

- Web App: http://localhost:5182
- Landing: http://localhost:4332
- API Health: http://localhost:3012/api/v1/health

## Testing API (mit curl)

```bash
# Health Check
curl http://localhost:3012/api/v1/health

# Login (get token)
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}' | jq -r '.accessToken')

# Moods abrufen
curl http://localhost:3012/api/v1/moods \
  -H "Authorization: Bearer $TOKEN"

# Neues Mood erstellen
curl -X POST http://localhost:3012/api/v1/moods \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sunset", "colors": ["#ff6b6b", "#feca57", "#ff9ff3"], "animation": "gradient"}'

# Sequence erstellen
curl -X POST http://localhost:3012/api/v1/sequences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Evening Flow", "moodIds": ["mood-id-1", "mood-id-2"], "duration": 30}'
```

## Important Notes

1. **Authentication**: Nutzt Mana Core Auth (JWT im Authorization Header)
2. **Database**: PostgreSQL mit Drizzle ORM (Port 5432)
3. **Port**: Backend läuft auf Port 3012, Web auf 5182, Landing auf 4332
4. **Mobile**: Verwendet Expo Dev Client (nicht Expo Go) wegen nativer Dependencies
5. **Theme**: Purple/Violet als Primärfarbe für die Mood-Thematik
