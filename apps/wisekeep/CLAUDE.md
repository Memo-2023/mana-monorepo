# CLAUDE.md - Wisekeep

This file provides guidance to Claude Code when working with the Wisekeep project.

## Project Overview

Wisekeep is an AI-powered wisdom extraction application that captures insights from video content:
- YouTube video download via yt-dlp
- Ultra-fast audio transcription using Groq Whisper API (~300x realtime)
- Fallback to local Whisper for offline use
- Playlist management for batch processing
- Real-time progress updates via WebSocket
- Multi-platform support (Web, Mobile, Landing)

## Architecture

```
apps/wisekeep/
├── apps/
│   ├── backend/       # NestJS API server (port 3006)
│   ├── web/           # SvelteKit web application
│   ├── landing/       # Astro landing/content site
│   └── mobile/        # Expo React Native app
├── packages/
│   └── shared-types/  # Shared TypeScript types
├── data/              # Transcripts & playlists (gitignored)
├── legacy/            # Original Python code (reference)
├── package.json       # Root orchestrator
└── CLAUDE.md          # This file
```

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9.15.0+
- yt-dlp installed (`brew install yt-dlp` on macOS)
- For local Whisper: Python 3 with openai-whisper package

### Development

```bash
# From monorepo root
pnpm install

# Start all wisekeep apps
pnpm wisekeep:dev

# Start individual apps
pnpm dev:wisekeep:backend   # NestJS backend (port 3006)
pnpm dev:wisekeep:web       # SvelteKit web (port 5173)
pnpm dev:wisekeep:landing   # Astro landing (port 4321)
pnpm dev:wisekeep:mobile    # Expo mobile

# Start web + backend together
pnpm dev:wisekeep:app
```

### Environment Variables

Create `apps/wisekeep/apps/backend/.env`:
```bash
PORT=3006
WHISPER_PROVIDER=groq         # groq or local
WHISPER_MODEL=whisper-large-v3-turbo  # whisper-large-v3-turbo, whisper-large-v3 (groq) | tiny, base, small, medium, large (local)
GROQ_API_KEY=gsk_...          # Required for Groq provider
TEMP_AUDIO_DIR=./temp_audio
TRANSCRIPTS_DIR=./data/transcripts
PLAYLISTS_DIR=./data/playlists
```

## API Endpoints

### Transcription
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/transcription` | Start new transcription job |
| GET | `/transcription` | List all jobs |
| GET | `/transcription/:id` | Get job status |
| DELETE | `/transcription/:id` | Cancel job |
| GET | `/transcription/stats` | Get statistics |

### Playlists
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/playlist` | List all playlists |
| GET | `/playlist/:category/:name` | Get specific playlist |
| POST | `/playlist` | Create playlist |
| DELETE | `/playlist/:category/:name` | Delete playlist |

### Whisper
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/whisper/models` | Get available models |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness check |
| GET | `/health/live` | Liveness check |

## WebSocket

Connect to `/progress` namespace for real-time updates:

```typescript
const socket = io('http://localhost:3006/progress');

socket.on('job_update', (data) => {
  // { type, jobId, status, progress, videoInfo }
});

socket.on('job_complete', (data) => {
  // { type, jobId, status, transcriptPath }
});

socket.on('job_error', (data) => {
  // { type, jobId, error }
});
```

## Whisper Configuration

### Groq Whisper API (Recommended)
- Ultra-fast, cloud-based (~300x realtime speed)
- Cost: ~$0.04/hour (whisper-large-v3-turbo) or ~$0.111/hour (whisper-large-v3)
- No GPU required
- Models: `whisper-large-v3-turbo` (fast) or `whisper-large-v3` (accurate)
- Set `WHISPER_PROVIDER=groq` and `GROQ_API_KEY`

### Local Whisper
- Free, runs locally
- Requires Python + openai-whisper
- GPU recommended for larger models
- Models: `tiny`, `base`, `small`, `medium`, `large`
- Set `WHISPER_PROVIDER=local` and `WHISPER_MODEL`

## Technology Stack

| Component | Technology |
|-----------|------------|
| Backend | NestJS 10, TypeScript |
| Web | SvelteKit 2, Svelte 5, Tailwind |
| Landing | Astro 4, Tailwind |
| Mobile | Expo 52, React Native, NativeWind |
| YouTube | yt-dlp (via child_process) |
| Transcription | Groq Whisper API / local Whisper |
| Real-time | Socket.io |
| State (Mobile) | Zustand |

## Code Patterns

### Backend Services
```typescript
@Injectable()
export class TranscriptionService {
  async createJob(dto: TranscribeRequestDto): Promise<TranscriptionJob> {
    // Background processing with WebSocket updates
  }
}
```

### Web (Svelte 5 Runes)
```typescript
// Correct - Svelte 5
let jobs = $state<Job[]>([]);
let activeJobs = $derived(jobs.filter(j => j.status === 'active'));

// Wrong - Old Svelte syntax
let jobs = [];
$: activeJobs = jobs.filter(j => j.status === 'active');
```

### Mobile (Zustand)
```typescript
export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
}));
```

## Legacy Python Code

The original Python implementation is preserved in `legacy/` for reference:
- `transcriber_v4_parallel.py` - Main transcription logic
- `api_server.py` - FastAPI server (replaced by NestJS)
- `requirements.txt` - Python dependencies

## Troubleshooting

### yt-dlp not found
```bash
# macOS
brew install yt-dlp

# Linux
pip install yt-dlp
```

### Local Whisper not working
```bash
# Install Whisper
pip install openai-whisper

# Test
python3 -c "import whisper; print(whisper.available_models())"
```

### Backend can't start
```bash
# Check port 3006
lsof -i :3006 && kill -9 $(lsof -t -i:3006)

# Check environment
cat apps/backend/.env
```
