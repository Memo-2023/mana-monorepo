# LightWrite - Beat & Lyrics Editor

LightWrite is a web application for creating and editing beats with synchronized lyrics. It provides waveform visualization, BPM detection, timestamp markers, and exports to multiple formats.

## Architecture

```
apps/lightwrite/
├── apps/
│   ├── backend/          # NestJS API (port 3010)
│   ├── web/              # SvelteKit app (port 5180)
│   └── landing/          # Astro marketing page
├── packages/
│   └── shared/           # Shared types (@lightwrite/shared)
└── package.json
```

## Quick Start

```bash
# Start with full database setup
pnpm dev:lightwrite:full

# Or start components individually
pnpm docker:up                           # Start PostgreSQL, Redis, MinIO
pnpm --filter @lightwrite/backend dev    # Backend on port 3010
pnpm --filter @lightwrite/web dev        # Web on port 5180
pnpm --filter @lightwrite/landing dev    # Landing page
```

## Backend API Endpoints

### Projects
- `GET /projects` - List user's projects
- `GET /projects/:id` - Get project with beat and lyrics
- `POST /projects` - Create project
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Beats
- `GET /beats/project/:projectId` - Get beat for project
- `GET /beats/:id` - Get beat with markers
- `GET /beats/:id/download-url` - Get presigned download URL
- `POST /beats/upload` - Create beat and get upload URL
- `PUT /beats/:id/metadata` - Update BPM, duration, waveform data
- `DELETE /beats/:id` - Delete beat

### Markers
- `GET /markers/beat/:beatId` - Get markers for beat
- `POST /markers` - Create marker
- `POST /markers/bulk` - Bulk create markers
- `PUT /markers/:id` - Update marker
- `PUT /markers/bulk` - Bulk update markers
- `DELETE /markers/:id` - Delete marker
- `DELETE /markers/beat/:beatId` - Delete all markers for beat

### Lyrics
- `GET /lyrics/project/:projectId` - Get lyrics with synced lines
- `POST /lyrics/project/:projectId` - Create/update lyrics content
- `POST /lyrics/:id/sync` - Sync line timestamps
- `PUT /lyrics/line/:lineId/timestamp` - Update single line timestamp

### Export
- `GET /export/:projectId?format=lrc|srt|json` - Export project

## Database Schema

```typescript
// projects - User projects
{ id, userId, title, description, createdAt, updatedAt }

// beats - Audio files
{ id, projectId, storagePath, filename, duration, bpm, bpmConfidence, waveformData }

// markers - Part/section markers
{ id, beatId, type, label, startTime, endTime, color, sortOrder }

// lyrics - Full lyrics text
{ id, projectId, content }

// lyric_lines - Individual synced lines
{ id, lyricsId, lineNumber, text, startTime, endTime }
```

## Marker Types

- `intro` - Introduction
- `verse` - Verse section
- `hook` - Hook/Chorus
- `bridge` - Bridge section
- `drop` - Drop
- `breakdown` - Breakdown
- `outro` - Outro
- `custom` - Custom marker

## Key Technologies

| Component | Technology |
|-----------|------------|
| Frontend | SvelteKit 2, Svelte 5, Tailwind CSS 4 |
| Waveform | wavesurfer.js 7.x |
| BPM Detection | Web Audio API (peak detection) |
| Backend | NestJS 10, Drizzle ORM |
| Database | PostgreSQL |
| Storage | MinIO (dev) / Hetzner S3 (prod) |
| Auth | mana-core-auth |

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/lightwrite
MANA_CORE_AUTH_URL=http://localhost:3001
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=lightwrite-storage
```

### Web (.env)
```
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
PUBLIC_BACKEND_URL=http://localhost:3010
```

## Export Formats

| Format | Use Case |
|--------|----------|
| LRC | Standard lyrics format for music players |
| SRT | Subtitles for video players |
| JSON | API/integration, full project data |

## Development Commands

```bash
# Database
pnpm --filter @lightwrite/backend db:push     # Push schema
pnpm --filter @lightwrite/backend db:studio   # Open Drizzle Studio

# Type checking
pnpm --filter @lightwrite/backend type-check
pnpm --filter @lightwrite/web type-check

# Build
pnpm --filter @lightwrite/backend build
pnpm --filter @lightwrite/web build
```

## Feature Implementation Status

- [x] Project CRUD
- [x] Beat upload with S3 storage
- [x] Waveform visualization (wavesurfer.js)
- [x] BPM detection (Web Audio API)
- [x] Part markers with regions
- [x] Lyrics editor with line sync
- [x] Karaoke preview
- [x] LRC export
- [x] SRT export
- [x] JSON export
- [ ] Video export (client-side Canvas → WebM)
- [ ] Word-by-word sync
- [ ] essentia.js WASM for better BPM detection
