# Memoro Backend Migration: NestJS → Hono/Bun

**Status:** Planned (not started)
**Priority:** High — required before Memoro can be reactivated in production
**Scope:** Two NestJS services → two Hono/Bun servers (keep Supabase DB + Gemini/Azure as-is)

---

## Overview

Memoro currently has two NestJS microservices:

| Service | Path | Port | Responsibility |
|---------|------|------|----------------|
| `backend` | `apps/memoro/apps/backend/` | 3001 | Business logic, AI, credits, spaces |
| `audio-backend` | `apps/memoro/apps/audio-backend/` | 1337 | Audio format conversion, Azure transcription |

Migration target: two Hono/Bun servers following the standard manacore pattern.

| New Service | Path | Port | Replaces |
|-------------|------|------|----------|
| `server` | `apps/memoro/apps/server/` | 3015 | `backend/` |
| `audio-server` | `apps/memoro/apps/audio-server/` | 3016 | `audio-backend/` |

---

## Key Architectural Decisions

### 1. Auth: mana-auth JWT (not Supabase middleware)
New servers use `authMiddleware()` from `@manacore/shared-hono`. This validates
the JWT from mana-auth and injects `userId` into context.

**Consequence:** Supabase DB operations must switch from user-scoped JWTs (RLS) to
**service-role key + explicit `user_id` filter**. All queries that relied on Supabase
RLS auto-filtering by JWT `sub` claim need `eq('user_id', userId)` added explicitly.

### 2. Auth Proxy: Remove
The `/auth/*` proxy endpoints (signin, signup, google, apple, refresh, etc.) are
removed. The web app already calls mana-auth directly. Mobile migration is a separate
concern — handle in the mobile migration plan.

### 3. Supabase: Keep as-is
Database stays on Supabase (no Drizzle migration). Only the auth mechanism changes
(service role key + manual user_id filtering instead of per-user JWT).

### 4. External Services: Unchanged
- Google Gemini API → keep
- Azure Speech Service → keep
- Azure Blob Storage → keep
- Supabase Storage → keep (audio files)

### 5. Credits: Call mana-credits directly
Replace calls to `mana-core-middleware /credits/*` with direct calls to the
`mana-credits` service. Endpoints map 1:1.

### 6. Cleanup: Replace GCP Cloud Scheduler → mana-notify cron
The audio cleanup cron (currently triggered by GCP Cloud Scheduler) can be
triggered by an internal cron endpoint called by our existing infrastructure
or by a scheduled remote agent.

---

## Complete Endpoint Inventory

### `server/` — All Routes

#### `POST /api/v1/memos/process` (was `/memoro/process-uploaded-audio`)
Receives file path after direct-upload to Supabase Storage. Creates memo record,
triggers async transcription via `audio-server`.

#### `POST /api/v1/memos/:id/append` (was `/memoro/append-transcription`)
Appends additional audio recording to existing memo.

#### `POST /api/v1/memos/:id/retry-transcription` (was `/memoro/retry-transcription`)
Retry failed transcription.

#### `POST /api/v1/memos/:id/retry-headline` (was `/memoro/retry-headline`)
Retry failed headline generation.

#### `POST /api/v1/memos/:id/reprocess` (was `/memoro/reprocess-memo`)
Reprocess memo with different parameters (e.g. different blueprint).

#### `GET /api/v1/memos/find-by-job/:jobId` (was `/memoro/find-memo-by-job/:jobId`)
Lookup memo by Azure batch job ID (used for webhook recovery).

#### `POST /api/v1/memos/combine` (was `/memoro/combine-memos`)
AI-powered memo combination.

#### `POST /api/v1/memos/:id/question` (was `/memoro/question-memo`)
Ask a question about a memo's transcript.

#### `POST /api/v1/batch-metadata` (was `/memoro/update-batch-metadata`)
Update Azure batch job metadata in memo (called by audio-server callback).

#### `GET /api/v1/spaces` (was `/memoro/spaces`)
List user's spaces.

#### `POST /api/v1/spaces` (was `/memoro/spaces`)
Create space.

#### `GET /api/v1/spaces/:id` (was `/memoro/spaces/:id`)
Get space details.

#### `DELETE /api/v1/spaces/:id` (was `/memoro/spaces/:id`)
Delete space.

#### `POST /api/v1/spaces/:id/memos/link` (was `/memoro/link-memo`)
Link memo to space.

#### `POST /api/v1/spaces/:id/memos/unlink` (was `/memoro/unlink-memo`)
Unlink memo from space.

#### `GET /api/v1/spaces/:id/memos` (was `/memoro/spaces/:id/memos`)
Get all memos in a space.

#### `POST /api/v1/spaces/:id/leave` (was `/memoro/spaces/:id/leave`)
Leave a space.

#### `GET /api/v1/spaces/:id/invites` (was `/memoro/spaces/:id/invites`)
List invitations for a space.

#### `POST /api/v1/spaces/:id/invite` (was `/memoro/spaces/:id/invite`)
Invite user to space.

#### `POST /api/v1/spaces/invites/:inviteId/resend`
Resend invitation.

#### `DELETE /api/v1/spaces/invites/:inviteId`
Cancel invitation.

#### `GET /api/v1/invites/pending` (was `/memoro/invites/pending`)
Get current user's pending invitations.

#### `POST /api/v1/invites/accept` (was `/memoro/spaces/invites/accept`)
Accept space invitation.

#### `POST /api/v1/invites/decline` (was `/memoro/spaces/invites/decline`)
Decline space invitation.

#### `GET /api/v1/credits/pricing` (was `/memoro/credits/pricing`)
Get credit pricing constants. Public (no auth needed).

#### `POST /api/v1/credits/check` (was `/memoro/credits/check-transcription`)
Validate if user has enough credits for an operation.

#### `POST /api/v1/credits/consume` (was `/memoro/credits/consume-operation`)
Consume credits for completed operation.

#### `GET /api/v1/settings` (was `/settings`)
Get all user settings.

#### `GET /api/v1/settings/memoro` (was `/settings/memoro`)
Get Memoro-specific settings.

#### `PATCH /api/v1/settings/memoro` (was `/settings/memoro`)
Update Memoro settings.

#### `PATCH /api/v1/settings/memoro/data-usage`
Update data usage acceptance flag.

#### `PATCH /api/v1/settings/memoro/newsletter`
Update newsletter opt-in.

#### `PATCH /api/v1/settings/profile` (was `/settings/profile`)
Update user profile.

#### `GET /api/v1/meetings/bots`
List user's meeting bots.

#### `POST /api/v1/meetings/bots`
Create meeting recording bot.

#### `GET /api/v1/meetings/bots/:id`
Get meeting bot.

#### `POST /api/v1/meetings/bots/:id/stop`
Stop meeting bot.

#### `GET /api/v1/meetings/recordings`
List recordings.

#### `GET /api/v1/meetings/recordings/:id`
Get recording.

#### `POST /api/v1/meetings/recordings/:id/to-memo`
Convert meeting recording to memo.

#### `POST /api/v1/webhooks/meetings` (was `/meetings/webhooks/bot-events`)
Webhook for meeting bot completion (no auth, validated by signature/key).

#### Internal (service-to-service, X-Service-Key header):

#### `POST /api/v1/internal/transcription-completed`
Callback from audio-server when transcription finishes.

#### `POST /api/v1/internal/append-transcription-completed`
Callback from audio-server for append transcription.

#### `POST /api/v1/internal/batch-metadata`
Update batch job metadata by memo ID.

#### Cleanup (X-Internal-API-Key header):

#### `POST /api/v1/cleanup/run` (was `/cleanup/trigger-from-cron`)
Trigger audio cleanup for users with 30-day auto-delete enabled.

#### `POST /api/v1/cleanup/manual` (was `/cleanup/trigger-manual`)
Manual cleanup trigger.

#### `GET /health`
Health check.

---

### `audio-server/` — All Routes

#### `POST /api/v1/transcribe` (was `/transcribe-realtime`)
Main transcription endpoint. Called by `server/`. Handles 4-tier fallback:
fast → retry → format-convert + retry → batch.

#### `POST /api/v1/transcribe/append` (was append transcription flow)
Transcribe additional audio for existing memo.

#### `GET /api/v1/duration` (was audio duration check)
Get duration of audio file at a Supabase Storage path.

#### `POST /api/v1/convert` (was FFmpeg conversion flow)
Convert audio format (M4A → WAV PCM 16kHz mono). Used internally and by server.

#### `GET /health`
Health check.

---

## New Folder Structure

```
apps/memoro/apps/server/
├── src/
│   ├── index.ts              # Hono app entry, routes wiring
│   ├── lib/
│   │   ├── supabase.ts       # Supabase client factory (service role)
│   │   ├── ai.ts             # Gemini + Azure OpenAI client (abstracted)
│   │   └── credits.ts        # mana-credits HTTP client
│   ├── routes/
│   │   ├── memos.ts          # Process, retry, reprocess, combine, Q&A
│   │   ├── spaces.ts         # Spaces CRUD + membership
│   │   ├── invites.ts        # Invitation management
│   │   ├── credits.ts        # Credits check/consume/pricing
│   │   ├── settings.ts       # User settings
│   │   ├── meetings.ts       # Meeting bots + recordings
│   │   ├── internal.ts       # Service-to-service callbacks
│   │   └── cleanup.ts        # Audio cleanup cron endpoint
│   ├── services/
│   │   ├── memo.service.ts   # Core memo + transcription orchestration
│   │   ├── headline.service.ts
│   │   ├── memory.service.ts
│   │   ├── question.service.ts
│   │   └── space.service.ts
│   └── types.ts              # Shared TypeScript interfaces
├── package.json
└── tsconfig.json

apps/memoro/apps/audio-server/
├── src/
│   ├── index.ts
│   ├── lib/
│   │   ├── azure-speech.ts   # Azure Speech Service client
│   │   ├── azure-blob.ts     # Azure Blob Storage client
│   │   └── supabase.ts       # Supabase storage download client
│   ├── routes/
│   │   ├── transcribe.ts     # Main + append transcription
│   │   ├── convert.ts        # FFmpeg audio conversion
│   │   └── duration.ts       # Audio duration check
│   └── services/
│       ├── transcription.service.ts  # 4-tier fallback logic
│       ├── batch.service.ts          # Azure batch transcription
│       └── ffmpeg.service.ts         # Format conversion
├── package.json
└── tsconfig.json
```

---

## Implementation Phases

### Phase 1: `audio-server` (simpler, no business logic)

1. Create `apps/memoro/apps/audio-server/` with Hono/Bun scaffold
2. Port `azure-speech.ts`, `azure-blob.ts`, Supabase storage download
3. Port FFmpeg service (format conversion, duration detection)
4. Port transcription service with 4-tier fallback
5. Port batch transcription service (Azure long-running jobs)
6. Wire routes: `/api/v1/transcribe`, `/api/v1/convert`, `/api/v1/duration`, `/health`
7. Add `X-Service-Key` auth guard for all routes
8. Test against live Azure services manually

**No auth migration needed here** — audio-server is internal-only (called by server, not frontend).

### Phase 2: `server` scaffold + auth

1. Create `apps/memoro/apps/server/` with Hono/Bun scaffold
2. Setup `authMiddleware()` from `@manacore/shared-hono`
3. Create Supabase service-role client factory
4. Implement `X-Service-Key` guard for internal routes
5. Implement `X-Internal-API-Key` guard for cleanup routes
6. Port `pricing.constants.ts` and credit calculation helpers
7. Wire health check and credits/pricing (no auth) routes first
8. Deploy empty shell and confirm reachability

### Phase 3: Memo routes (core)

1. Port `memo.service.ts` — `createMemoFromUploadedFile()`:
   - Create memo in Supabase (service role + user_id filter)
   - Call audio-server `/api/v1/transcribe` async
   - Return full memo object immediately
2. Port `handleTranscriptionCompleted()` — update memo after transcription callback
3. Port internal callback routes (`/api/v1/internal/transcription-completed` etc.)
4. Port retry routes
5. Port `append-transcription` flow

### Phase 4: AI routes

1. Port `ai.ts` — Gemini primary, Azure OpenAI fallback, same logic as `ai.service.ts`
2. Port `headline.service.ts`
3. Port `question.service.ts` (Q&A)
4. Port `memory.service.ts` (prompt-based memories)
5. Wire `/api/v1/memos/combine`, `/api/v1/memos/:id/question`

### Phase 5: Spaces + Invites

1. Port `space.service.ts` — CRUD + membership management
2. Port invitation flow (invite, accept, decline, resend, cancel)
3. Wire all `/api/v1/spaces/*` and `/api/v1/invites/*` routes

### Phase 6: Settings + Credits + Cleanup

1. Port settings routes — proxy to mana-credits / mana-user services (or Supabase direct)
2. Port credits routes — call mana-credits service instead of mana-core-middleware
3. Port audio cleanup service
4. Wire `/api/v1/cleanup/*`

### Phase 7: Meetings

1. Port meetings proxy service (proxy to external meeting bot API)
2. Port webhook handler (`/api/v1/webhooks/meetings`)
3. Wire all `/api/v1/meetings/*` routes

### Phase 8: Remove auth proxy

Remove the NestJS `auth-proxy` module entirely.
Document in mobile migration plan that mobile must call mana-auth directly.

### Phase 9: Cutover

1. Update `docker-compose.macmini.yml` to use new server/audio-server images
2. Update Memoro web app env vars: `PUBLIC_BACKEND_URL` → new server port
3. Run both old and new in parallel briefly for smoke testing
4. Remove old `backend/` and `audio-backend/` NestJS services

---

## Environment Variables (New Services)

### `server/.env`

```env
PORT=3015
NODE_ENV=production

# Auth
MANA_CORE_AUTH_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:5173

# Internal service auth
SERVICE_KEY=your-internal-service-key
INTERNAL_API_KEY=your-internal-api-key

# Supabase (service role — no user JWT needed for DB)
MEMORO_SUPABASE_URL=https://your-memoro-project.supabase.co
MEMORO_SUPABASE_SERVICE_KEY=your-service-role-key

# External services
GEMINI_API_KEY=your-gemini-key
AZURE_OPENAI_ENDPOINT=https://...
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_DEPLOYMENT=gpt-4

# Internal services
AUDIO_SERVER_URL=http://localhost:3016
MANA_CREDITS_URL=http://localhost:3004

# App config
MEMORO_APP_ID=973da0c1-b479-4dac-a1b0-ed09c72caca8
```

### `audio-server/.env`

```env
PORT=3016
NODE_ENV=production

# Internal auth
SERVICE_KEY=your-internal-service-key

# Azure Speech
AZURE_SPEECH_KEY=your-key
AZURE_SPEECH_REGION=swedencentral

# Azure Blob (for batch transcription uploads)
AZURE_STORAGE_ACCOUNT_NAME=your-account
AZURE_STORAGE_ACCOUNT_KEY=your-key

# Supabase (read-only: download audio files)
MEMORO_SUPABASE_URL=https://your-memoro-project.supabase.co
MEMORO_SUPABASE_SERVICE_KEY=your-service-role-key

# Callback
MEMORO_SERVER_URL=http://localhost:3015
```

---

## Critical Implementation Notes

### Supabase RLS → Service Role Pattern

Old NestJS pattern (user JWT for RLS):
```typescript
const supabase = createClient(url, anonKey, {
  global: { headers: { Authorization: `Bearer ${userToken}` } }
});
const { data } = await supabase.from('memos').select('*'); // RLS filters by sub
```

New Hono pattern (service role + explicit filter):
```typescript
const supabase = createClient(url, serviceKey); // service role, bypasses RLS
const userId = c.get('userId'); // from authMiddleware()
const { data } = await supabase.from('memos').select('*').eq('user_id', userId);
```

Every single Supabase query that previously relied on RLS needs `eq('user_id', userId)` added.
Access control for spaces (where user might not be owner) needs explicit join check.

### Async Transcription (fire-and-forget)

Hono/Bun equivalent of `setImmediate()`:
```typescript
// Fire-and-forget in Bun
queueMicrotask(() => processTranscriptionAsync(memoId, ...));
// or
setTimeout(() => processTranscriptionAsync(memoId, ...), 0);
```

The endpoint returns immediately after memo creation; transcription runs in background
and calls back via `/api/v1/internal/transcription-completed`.

### FFmpeg in Bun

Bun can run FFmpeg via `Bun.spawn`:
```typescript
const proc = Bun.spawn(['ffmpeg', '-i', inputPath, '-ar', '16000', '-ac', '1', outputPath]);
await proc.exited;
```

FFmpeg must be installed in the Docker image (add `RUN apt-get install -y ffmpeg`).

### Azure Batch Job Recovery

Batch jobs store `jobId` in `memo.metadata.processing.transcription.jobId`.
A cron endpoint (or background polling) can check stuck jobs and re-trigger
the `transcription-completed` callback. Implement in Phase 3 alongside main flow.

---

## Files to Reference During Implementation

| File | Purpose |
|------|---------|
| `apps/memoro/apps/backend/src/memoro/memoro.service.ts` | Core transcription + memo logic (~2600 lines) |
| `apps/memoro/apps/backend/src/ai/ai.service.ts` | Gemini/Azure AI routing |
| `apps/memoro/apps/backend/src/ai/headline/headline.service.ts` | Headline generation |
| `apps/memoro/apps/backend/src/credits/pricing.constants.ts` | Credit cost constants |
| `apps/memoro/apps/backend/src/credits/credit-consumption.service.ts` | Credit validation/consumption |
| `apps/memoro/apps/audio-backend/src/audio.service.ts` | 4-tier transcription fallback |
| `apps/memoro/apps/backend/src/cleanup/audio-cleanup.service.ts` | 30-day audio cleanup |
| `apps/todo/apps/server/src/index.ts` | Reference Hono/Bun server pattern |
| `packages/shared-hono/src/` | `authMiddleware`, `healthRoute`, `errorHandler` |

---

## Open Questions (resolve when starting)

- Port numbers 3015/3016 — confirm no conflicts with other services
- mana-credits URL in dev environment — confirm port
- Meeting bot external API — which provider? Are credentials available?
- Space sync (`/sync/spaces/*`) — is this still needed or replaced by local-store sync?
- Should audio-server be publicly reachable or internal-only? (Recommendation: internal only)
