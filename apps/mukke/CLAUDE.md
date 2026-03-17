# CLAUDE.md - Mukke

Offline-first iOS Music Player. Songs aus iCloud/lokalen Dateien importieren, lokal auf dem Gerät speichern, abspielen.

## Project Structure

```
apps/mukke/
├── package.json              # Orchestrator (name: mukke)
├── apps/
│   └── mobile/               # @mukke/mobile (Expo SDK 54)
│       ├── app/              # Expo Router screens
│       │   ├── (tabs)/       # 4 Tab-Screens (Bibliothek, Playlists, Suche, Settings)
│       │   ├── player.tsx    # Full-Screen Player (modal)
│       │   ├── queue.tsx     # Queue Ansicht (modal)
│       │   ├── album/[id]    # Album Detail
│       │   ├── artist/[id]   # Artist Detail
│       │   └── playlist/     # Playlist Detail + New
│       ├── components/       # UI components
│       ├── contexts/         # AudioContext (expo-audio)
│       ├── stores/           # Zustand stores (player, library, playlist)
│       ├── services/         # Business logic (DB, import, audio, library, playlist)
│       └── utils/            # Theme system
└── packages/
    └── mukke-types/          # @mukke/types (shared interfaces)
```

## Commands

```bash
pnpm dev:mukke:mobile         # Start Expo app
```

## Tech Stack

- **Audio**: expo-audio (background via UIBackgroundModes: ["audio"])
- **Import**: expo-document-picker (iCloud + lokale Dateien)
- **Storage**: expo-file-system (documentDirectory)
- **Metadata**: @missingcore/audio-metadata (ID3v2.3/v2.4)
- **DB**: expo-sqlite (SQLite für Songs, Playlists)
- **State**: Zustand
- **Navigation**: Expo Router + NativeTabs
- **Styling**: NativeWind / Tailwind

## Architecture

- **No backend** - pure offline, local-only app
- **SQLite** for structured data (songs, playlists, playlist_songs)
- **Albums/Artists/Genres** derived from songs table via queries (no separate tables)
- **File storage**: documentDirectory/music/ + documentDirectory/artwork/
- **Audio playback**: expo-audio with background mode
- **MiniPlayer**: persistent above tab bar

## Import Flow

1. User taps Import → expo-document-picker opens (iCloud + local)
2. Files copied to documentDirectory/music/{uuid}.ext
3. Metadata extracted via @missingcore/audio-metadata
4. Cover art saved to documentDirectory/artwork/{uuid}.jpg
5. Song entry created in SQLite
