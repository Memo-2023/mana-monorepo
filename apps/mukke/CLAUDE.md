# Mukke - Music Workspace

Mukke is a web application for managing your music library, playing tracks, and creating synchronized lyrics. It combines a music player with a beat/lyrics editor featuring waveform visualization, BPM detection, timestamp markers, and exports to multiple formats.

## Architecture

```
apps/mukke/
├── apps/
│   ├── backend/          # Hono/Bun server (port 3010)
│   ├── web/              # SvelteKit app (port 5180)
│   └── landing/          # Astro marketing page
├── packages/
│   └── shared/           # Shared types (@mukke/shared)
└── package.json
```

## Quick Start

```bash
# Start with full database setup
pnpm dev:mukke:full

# Or start components individually
pnpm docker:up                        # Start PostgreSQL, Redis, MinIO
pnpm --filter @mukke/server dev      # Server on port 3010
pnpm --filter @mukke/web dev          # Web on port 5180
pnpm --filter @mukke/landing dev      # Landing page
```

## Backend API Endpoints

### Songs (Library)
- `POST /songs/upload` - Upload song and get presigned URL
- `GET /songs` - List user's songs (with sort/filter)
- `GET /songs/:id` - Get song details
- `PUT /songs/:id` - Update song metadata
- `PUT /songs/:id/favorite` - Toggle favorite
- `PUT /songs/:id/play` - Increment play count
- `DELETE /songs/:id` - Delete song
- `GET /songs/search?q=` - Search songs
- `POST /songs/:id/extract-metadata` - Extract ID3 tags from file into DB (+ cover art to S3)
- `POST /songs/:id/write-tags` - Write DB metadata as ID3 tags back into MP3 file
- `GET /songs/:id/cover-url` - Get presigned URL for cover art

### Playlists
- `GET /playlists` - List user's playlists
- `POST /playlists` - Create playlist
- `GET /playlists/:id` - Get playlist with songs
- `PUT /playlists/:id` - Update playlist
- `DELETE /playlists/:id` - Delete playlist
- `POST /playlists/:id/songs` - Add song to playlist
- `DELETE /playlists/:id/songs/:songId` - Remove song
- `PUT /playlists/:id/songs/reorder` - Reorder songs

### Library (Aggregates)
- `GET /library/albums` - Get albums (grouped)
- `GET /library/artists` - Get artists (grouped)
- `GET /library/genres` - Get genres (grouped)
- `GET /library/stats` - Library statistics

### Projects (Editor)
- `GET /projects` - List user's projects
- `GET /projects/:id` - Get project with beat and lyrics
- `POST /projects` - Create project
- `POST /projects/from-song/:songId` - Create project from library song
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

### Lyrics
- `GET /lyrics/project/:projectId` - Get lyrics with synced lines
- `POST /lyrics/project/:projectId` - Create/update lyrics content
- `POST /lyrics/:id/sync` - Sync line timestamps

### Export
- `GET /export/:projectId?format=lrc|srt|json` - Export project

## Database Schema

```typescript
// songs - Music library
{ id, userId, title, artist, album, albumArtist, genre, trackNumber, year, duration,
  storagePath, coverArtPath, fileSize, bpm, favorite, playCount, lastPlayedAt, addedAt, updatedAt }

// playlists - User playlists
{ id, userId, name, description, coverArtPath, createdAt, updatedAt }

// playlist_songs - Playlist-Song join table
{ id, playlistId, songId, sortOrder, addedAt }

// projects - Editor projects
{ id, userId, title, description, songId, createdAt, updatedAt }

// beats - Audio files for editor
{ id, projectId, storagePath, filename, duration, bpm, bpmConfidence, waveformData }

// markers - Section markers
{ id, beatId, type, label, startTime, endTime, color, sortOrder }

// lyrics - Full lyrics text
{ id, projectId, content }

// lyric_lines - Synced lines
{ id, lyricsId, lineNumber, text, startTime, endTime }
```

## Supported Audio Formats

Playback uses HTML5 Audio (browser-native codec support). Upload accepts any `audio/*` MIME type.

| Format | Extensions | Browser Playback | Notes |
|--------|-----------|-----------------|-------|
| MP3 | `.mp3` | All browsers | ID3 tag read/write supported |
| WAV | `.wav` | All browsers | Uncompressed PCM |
| OGG Vorbis | `.ogg` | Chrome, Firefox, Edge | No Safari support |
| FLAC | `.flac` | All modern browsers | Lossless |
| AAC/M4A | `.aac`, `.m4a` | All browsers | Common iOS format |
| OPUS | `.opus` | Chrome, Firefox, Edge | Best quality/size ratio |
| WebM | `.webm` | Chrome, Firefox, Edge | Container format |
| AIFF | `.aiff`, `.aif` | Safari, Chrome | Common macOS format |
| WMA | `.wma` | Edge only | Legacy Windows format |
| ALAC | `.alac` | Safari | Apple Lossless |
| APE | `.ape` | None natively | Monkey's Audio (upload/metadata only) |
| WavPack | `.wv` | None natively | Hybrid lossless (upload/metadata only) |
| DSF/DFF | `.dsf`, `.dff` | None natively | DSD audio (upload/metadata only) |

**Note:** Formats without native browser playback can be uploaded and have metadata extracted (via `music-metadata`), but require server-side transcoding for playback (not yet implemented).

## Key Technologies

| Component | Technology |
|-----------|------------|
| Frontend | SvelteKit 2, Svelte 5, Tailwind CSS 4 |
| Waveform | wavesurfer.js 7.x |
| BPM Detection | Web Audio API (peak detection) |
| Metadata | music-metadata (server-side) |
| Backend | Hono + Bun, Drizzle ORM |
| Database | PostgreSQL |
| Storage | MinIO (S3-compatible) |
| Auth | mana-core-auth |

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://manacore:devpassword@localhost:5432/mukke
MANA_CORE_AUTH_URL=http://localhost:3001
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=mukke-storage
```

### Web (.env)
```
PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
PUBLIC_BACKEND_URL=http://localhost:3010
```

## Development Commands

```bash
# Database
pnpm --filter @mukke/server db:push     # Push schema
pnpm --filter @mukke/server db:studio   # Open Drizzle Studio

# Type checking
pnpm --filter @mukke/server type-check
pnpm --filter @mukke/web type-check

# Build
pnpm --filter @mukke/server build
pnpm --filter @mukke/web build
```
