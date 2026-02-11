# Photos Project Guide

## Overview

**Photos** is a unified photo gallery application for the ManaCore ecosystem. It aggregates photos from all apps (Picture, Chat, Contacts, NutriPhi, etc.) via the mana-media service, providing a central place to view, organize, and manage photos.

| App | Port | URL |
|-----|------|-----|
| Backend | 3019 | http://localhost:3019 |
| Web App | 5189 | http://localhost:5189 |

## Project Structure

```
apps/photos/
├── apps/
│   ├── backend/      # NestJS API server (@photos/backend)
│   └── web/          # SvelteKit web application (@photos/web) [TODO]
├── packages/
│   └── shared/       # Shared types (@photos/shared)
├── package.json
└── CLAUDE.md
```

## Commands

### Root Level (from monorepo root)

```bash
# All apps
pnpm photos:dev               # Run all photos apps

# Individual apps
pnpm dev:photos:backend       # Start backend server (port 3019)
pnpm dev:photos:web           # Start web app (port 5189)

# Database
pnpm photos:db:push           # Push schema to database
pnpm photos:db:studio         # Open Drizzle Studio
```

### Backend (apps/photos/apps/backend)

```bash
pnpm dev                      # Start with hot reload
pnpm build                    # Build for production
pnpm start:prod               # Start production server
pnpm db:push                  # Push schema to database
pnpm db:studio                # Open Drizzle Studio
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10, Drizzle ORM, PostgreSQL |
| **Web** | SvelteKit 2.x, Svelte 5 (runes mode), Tailwind CSS |
| **Auth** | Mana Core Auth (JWT) |
| **Media** | mana-media service (central media storage) |

## Core Features

1. **Gallery** - View all photos across apps in grid/list view
2. **Albums** - Organize photos into custom albums
3. **Favorites** - Mark photos as favorites
4. **Tags** - Tag photos for organization
5. **EXIF Data** - View camera, location, and date metadata
6. **Upload** - Upload new photos directly
7. **Smart Albums** - Auto-generated albums by date/location/camera

## Architecture

```
┌────────────────┐
│  Photos Web    │  SvelteKit (Port 5189)
│                │  Gallery, Albums, Upload
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Photos Backend │  NestJS (Port 3019)
│                │  Albums, Favorites, Tags
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  mana-media    │  (Port 3015)
│                │  Central media storage
└────────────────┘
```

## API Endpoints

### Photos (proxy to mana-media with enrichment)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/photos` | GET | List photos with filters |
| `/api/v1/photos/:mediaId` | GET | Get photo with metadata |
| `/api/v1/photos/stats` | GET | Get photo statistics |

### Albums

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/albums` | GET | List user's albums |
| `/api/v1/albums` | POST | Create album |
| `/api/v1/albums/:id` | GET | Get album with items |
| `/api/v1/albums/:id` | PATCH | Update album |
| `/api/v1/albums/:id` | DELETE | Delete album |
| `/api/v1/albums/:id/items` | POST | Add photos to album |
| `/api/v1/albums/:id/items/:mediaId` | DELETE | Remove photo from album |
| `/api/v1/albums/:id/cover` | PATCH | Set album cover |

### Favorites

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/favorites` | GET | List favorited photos |
| `/api/v1/favorites/:mediaId` | POST | Add to favorites |
| `/api/v1/favorites/:mediaId` | DELETE | Remove from favorites |
| `/api/v1/favorites/:mediaId/toggle` | POST | Toggle favorite status |

### Tags

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/tags` | GET | List user's tags |
| `/api/v1/tags` | POST | Create tag |
| `/api/v1/tags/:id` | PATCH | Update tag |
| `/api/v1/tags/:id` | DELETE | Delete tag |
| `/api/v1/photos/:mediaId/tags` | GET | Get tags for photo |
| `/api/v1/photos/:mediaId/tags/:tagId` | POST | Add tag to photo |
| `/api/v1/photos/:mediaId/tags/:tagId` | DELETE | Remove tag from photo |

## Database Schema

### albums
- `id` (UUID) - Primary key
- `user_id` (TEXT) - Owner
- `name` (VARCHAR) - Album name
- `description` (TEXT) - Description
- `cover_media_id` (TEXT) - Cover photo (mana-media ID)
- `is_auto_generated` (BOOLEAN) - Smart album flag
- `auto_generate_type` (TEXT) - date/location/camera
- `auto_generate_value` (TEXT) - Filter value

### album_items
- `id` (UUID) - Primary key
- `album_id` (UUID) - FK to albums
- `media_id` (TEXT) - mana-media ID
- `sort_order` (INTEGER) - Sort order

### favorites
- `id` (UUID) - Primary key
- `user_id` (TEXT) - Owner
- `media_id` (TEXT) - mana-media ID

### tags
- `id` (UUID) - Primary key
- `user_id` (TEXT) - Owner
- `name` (VARCHAR) - Tag name
- `color` (VARCHAR) - Hex color

### photo_tags
- `media_id` (TEXT) - mana-media ID
- `tag_id` (UUID) - FK to tags

## Environment Variables

### Backend (.env)

```env
NODE_ENV=development
PORT=3019
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/photos
MANA_CORE_AUTH_URL=http://localhost:3001
MANA_MEDIA_URL=http://localhost:3015
CORS_ORIGINS=http://localhost:5173,http://localhost:5189,http://localhost:8081
```

### Web (.env)

```env
PUBLIC_BACKEND_URL=http://localhost:3019
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
PUBLIC_MANA_MEDIA_URL=http://localhost:3015
```

## Query Parameters for Photo Listing

| Parameter | Type | Description |
|-----------|------|-------------|
| `apps` | string | Comma-separated app names (picture,chat,nutriphi) |
| `mimeType` | string | MIME type filter (image/*, image/jpeg) |
| `dateFrom` | ISO date | Start date filter |
| `dateTo` | ISO date | End date filter |
| `hasLocation` | boolean | Filter photos with GPS data |
| `limit` | number | Results per page (default: 50) |
| `offset` | number | Pagination offset |
| `sortBy` | string | createdAt, dateTaken, size |
| `sortOrder` | string | asc, desc |

## Integration with mana-media

The Photos backend acts as a proxy to mana-media, enriching responses with local data:

1. **Photos list** - Fetches from mana-media `/api/v1/media/list/all`, adds favorites and tags
2. **Photo detail** - Fetches from mana-media `/api/v1/media/:id`, adds favorites and tags
3. **Stats** - Fetches from mana-media `/api/v1/media/stats`

Local data (albums, favorites, tags) is stored in the Photos database, while media files and EXIF data are stored in mana-media.
