# CLAUDE.md - Traces

GPS tracking app with AI city guides. Location tracking runs locally via AsyncStorage, with optional backend sync.

## Project Structure

```
apps/traces/
├── package.json              # Orchestrator (name: traces)
├── apps/
│   ├── backend/              # @traces/backend (NestJS, Port 3026)
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── db/           # Drizzle schema + connection
│   │       ├── location/     # GPS sync endpoint
│   │       ├── city/         # City CRUD + visit stats
│   │       ├── place/        # Saved places CRUD
│   │       ├── poi/          # Points of Interest
│   │       └── guide/        # AI city guide pipeline
│   └── mobile/               # @traces/mobile (Expo SDK 54)
│       ├── app/              # Expo Router screens
│       ├── components/       # UI components
│       └── utils/            # Services (location, sync, api)
└── packages/
    └── traces-types/         # @traces/types (shared interfaces)
```

## Commands

```bash
# Development
pnpm dev:traces:mobile        # Start Expo app
pnpm dev:traces:backend       # Start NestJS backend
pnpm dev:traces:full          # Start auth + backend + mobile

# Database
pnpm traces:db:push           # Push Drizzle schema
pnpm traces:db:studio         # Open Drizzle Studio
```

## Architecture

- **Mobile**: Offline-first. All GPS data in AsyncStorage. Sync is additive.
- **Backend**: NestJS + Drizzle ORM + PostgreSQL. Auth via ManaCoreModule.
- **AI Guides**: Uses mana-search for POI discovery, mana-llm for narratives.
- **Credits**: 5 base + 2 per POI consumed via CreditClientService.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/locations/sync` | POST | Batch sync from mobile |
| `/api/v1/locations` | GET | Query locations |
| `/api/v1/cities` | GET | User's visited cities |
| `/api/v1/cities/:id` | GET | City detail + stats |
| `/api/v1/places` | GET/POST | List/create places |
| `/api/v1/places/:id` | PUT/DELETE | Update/delete place |
| `/api/v1/pois` | GET | Nearby POIs |
| `/api/v1/pois/:id` | GET | POI detail |
| `/api/v1/guides/generate` | POST | Generate AI guide |
| `/api/v1/guides` | GET | User's guides |
| `/api/v1/guides/:id` | GET/DELETE | Guide detail/delete |

## Environment Variables

Backend: `PORT=3026`, `DATABASE_URL`, `MANA_CORE_AUTH_URL`, `MANA_LLM_URL`, `MANA_SEARCH_URL`
Mobile: `EXPO_PUBLIC_TRACES_BACKEND_URL`, `EXPO_PUBLIC_MANA_CORE_AUTH_URL`

## Mobile Navigation (5 tabs)

1. **Tracking** - Live GPS tracking + map
2. **Orte** - Saved places, cities, countries
3. **Karte** - Full-screen map view
4. **Städte** - Visited cities with stats
5. **Führungen** - AI-generated city guides
