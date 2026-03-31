# Memoro Service - Claude Development Notes

## Enhanced Audio Processing Architecture

### Direct Storage Upload Strategy
- Audio files are uploaded directly to Supabase Storage from the frontend
- This bypasses Cloud Run's 32MB file size limit
- Memoro service then processes the uploaded file via `POST /memoro/process-uploaded-audio`

### Dual-Path Transcription System
**Smart Routing based on duration:**
- **Fast Transcription** (<115 minutes): Real-time Azure Speech Service
- **Batch Transcription** (≥115 minutes): Azure Speech Service with enhanced processing

### Enhanced Audio Format Fallback Strategy
The service implements a robust 4-tier fallback strategy with comprehensive error handling:

1. **Fast Transcribe (Primary)** - Direct transcription via Azure Speech Service
2. **Format Conversion + Retry** - Auto-detects format errors and converts via audio-microservice
3. **Batch Processing Fallback** - Uses enhanced batch processing if conversion fails
4. **Intelligent Error Detection** - Automatically identifies Azure Speech format issues

### Speaker Diarization Fix (2025-06-09)
**Critical Issue Resolved:**
- **Problem**: Azure Fast Transcription API diarization configuration was incorrect, causing 0/149 phrases to have speaker data
- **Root Cause**: Used incorrect `diarization.speakers.maxCount` instead of `diarization.maxSpeakers`
- **Solution**: Updated to correct Azure API format: `diarization: { enabled: true, maxSpeakers: 10 }`
- **Result**: Now 216/216 phrases have proper speaker data with complete utterances, speakers, and speakerMap
- **Request Size Fix**: Increased body parser limit to 200MB to handle very large transcriptions with extensive speaker data (fixed 413 errors)

### Batch Transcription Enhancements (NEW)
**Advanced Features:**
- **Enhanced Diarization**: Up to 10 speakers (vs 2 in basic mode)
- **Multi-language Detection**: Automatic identification from user preferences
- **Complete Speaker Data**: Same structure as fast transcription (utterances, speakers, speakerMap)
- **Recovery Tracking**: Stores Azure jobId for webhook failure recovery
- **Language Consistency**: Primary language detection and multi-language support

**Recovery System Foundation:**
- **Metadata Storage**: Each batch job stores jobId in memo metadata via `/update-batch-metadata`
- **Memo ID Based Lookup**: Direct memo ID lookup for reliable metadata updates (fixed 2025-06-08)
- **Authentication Fixed**: Proper JWT token passing between services (fixed 2025-06-08)
- **Recovery Ready**: Infrastructure for cron-based recovery system
- **Webhook Failure Handling**: Planned automatic recovery for stuck transcriptions

### Error Detection Patterns
The system detects audio format errors by checking for:
- "audio format", "audio stream could not be decoded"
- "InvalidAudioFormat", "UnprocessableEntity"
- "audio/x-m4a", "422" status codes
- Azure Speech Service specific error messages

### Processing Routes
- `fast_transcribe` - Direct success
- `fast_transcribe_converted` - Success after format conversion
- `batch_transcribe` - Enhanced batch processing for long files (NEW)
- `batch_transcribe_fallback` - Success via batch processing fallback

## Memo Creation Flow (Updated 2025-06-26)

### Enhanced Memo Response
The `createMemoFromUploadedFile` method now returns the complete memo object:
```typescript
{
  memo: { /* full memo object */ },
  memoId: string,
  audioPath: string
}
```

### Recording Time Preservation
- **recordingStartedAt** is stored in memo metadata
- Frontend uses this for accurate timestamp display
- Preserved through all real-time updates

### Processing State Management
Memo metadata structure:
```typescript
metadata: {
  processing: {
    transcription: { status: 'pending' | 'processing' | 'completed' | 'failed' },
    headline_and_intro: { status: 'pending' | 'processing' | 'completed' | 'failed' }
  },
  recordingStartedAt?: string,  // ISO timestamp of actual recording start
  location?: any
}
```

## Authentication Proxy Architecture (NEW - 2025-01-07)

### Purpose
The auth-proxy module routes all authentication requests through memoro-service to hide mana-core-middleware from the frontend. This provides a single entry point for all backend services.

### Auth Proxy Endpoints
All endpoints mirror the mana-core-middleware auth endpoints:
- `POST /auth/signin` - Email/password sign-in
- `POST /auth/signup` - User registration  
- `POST /auth/google-signin` - Google OAuth sign-in
- `POST /auth/apple-signin` - Apple OAuth sign-in
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset
- `POST /auth/validate` - Token validation
- `GET /auth/credits` - Get user credits (proxies `/users/credits` from mana-core)
- `GET /auth/devices` - Get user devices

### Implementation Details
- **Module**: `auth-proxy` module separate from existing auth module
- **No OAuth Redirects**: Social sign-ins use token exchange, not redirects
- **Error Preservation**: Original error responses passed through
- **App ID Injection**: Automatically adds `appId` query parameter
- **Header Forwarding**: Authorization headers passed through for authenticated endpoints

## Append Transcription Feature (NEW - 2025-01-07)

### Purpose
Allows adding additional audio recordings to existing memos and transcribing them, storing results in the `source.additional_recordings` array.

### Endpoint
`POST /memoro/append-transcription`

### Request Body
```typescript
{
  memoId: string;           // ID of existing memo
  filePath: string;         // Audio file path in storage
  duration: number;         // Duration in seconds
  recordingIndex?: number;  // Optional: index to update specific recording
  recordingLanguages?: string[];
  enableDiarization?: boolean;
}
```

### Features
- **Smart Routing**: Uses same fast (<115min) vs batch (≥115min) logic as main transcription
- **Credit Management**: Validates and consumes credits like main transcription
- **Access Control**: Validates user owns memo or has access through space
- **Preserves Original**: Keeps original transcript intact, only appends to additional_recordings
- **Speaker Diarization**: Full support for speaker detection in appended audio
- **Error Handling**: Comprehensive fallback strategy matching main transcription flow

### Additional Recordings Structure
```typescript
source: {
  // Original transcript and speaker data preserved
  transcript: string;
  speakers: {...};
  utterances: [...];
  
  // Appended recordings array
  additional_recordings: [
    {
      path: string;
      transcript: string;
      languages: string[];
      primary_language: string;
      speakers: object;
      speakerMap: object;
      utterances: array;
      status: 'completed' | 'processing' | 'error';
      timestamp: string;
      updated_at: string;
    }
  ]
}
```

## Audio Cleanup System (Auto-Delete Old Audio Files)

### Overview
Automatically deletes audio files older than 30 days for users who have opted in. This helps users manage storage and comply with data retention preferences.

### How It Works

1. **GCP Cloud Scheduler** triggers `POST /cleanup/trigger-from-cron` daily at 3:00 AM UTC
2. **memoro-service** calls mana-core-middleware to get users with cleanup enabled
3. For each user, queries Supabase storage for files older than 30 days
4. Deletes files in batches (100 files per batch, 200ms delay between batches)
5. Updates memo `source` field to mark audio as deleted
6. Logs results to `audio_cleanup_logs` table

### Architecture

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  GCP Cloud          │     │  memoro-service     │     │  mana-core-         │
│  Scheduler          │────>│  /cleanup/          │────>│  middleware         │
│  (3:00 AM UTC)      │     │  trigger-from-cron  │     │  /internal/users/   │
└─────────────────────┘     └─────────────────────┘     │  audio-cleanup-     │
                                     │                   │  enabled            │
                                     │                   └─────────────────────┘
                                     │
                                     v
                            ┌─────────────────────┐
                            │  Supabase Storage   │
                            │  (user-uploads)     │
                            │  - Delete old files │
                            │  - Update memos     │
                            └─────────────────────┘
```

### Enabling Auto-Delete for a User

Add `autoDeleteAudiosAfter30Days: true` to the user's `app_settings.memoro` object in the `users` table:

```json
{
  "memoro": {
    "autoDeleteAudiosAfter30Days": true,
    "dataUsageAcceptance": true,
    "emailNewsletterOptIn": false
  }
}
```

### SQL Query to Enable for a User
```sql
UPDATE users
SET app_settings = jsonb_set(
  COALESCE(app_settings, '{}'::jsonb),
  '{memoro,autoDeleteAudiosAfter30Days}',
  'true'
)
WHERE id = 'USER_UUID_HERE';
```

### SQL Query to Enable for Multiple Users (by email)
```sql
WITH user_emails AS (
  SELECT unnest(ARRAY[
    'user1@example.com',
    'user2@example.com',
    'user3@example.com'
  ]::text[]) AS email
)
UPDATE users u
SET app_settings = jsonb_set(
  jsonb_set(
    COALESCE(u.app_settings, '{}'::jsonb),
    '{memoro}',
    COALESCE(u.app_settings->'memoro', '{}'::jsonb)
  ),
  '{memoro,autoDeleteAudiosAfter30Days}',
  'true'
)
FROM user_emails
WHERE u.email = user_emails.email;
```

### SQL Query to Check Users with Cleanup Enabled
```sql
SELECT id, email, app_settings->'memoro'->'autoDeleteAudiosAfter30Days'
FROM users
WHERE app_settings->'memoro'->>'autoDeleteAudiosAfter30Days' = 'true';
```

### Configuration

| Setting | Value | Location |
|---------|-------|----------|
| Retention period | 30 days | `audio-cleanup.service.ts` |
| Batch size | 100 files | `audio-cleanup.service.ts` |
| Batch delay | 200ms | `audio-cleanup.service.ts` |
| Storage bucket | `user-uploads` | `audio-cleanup.service.ts` |
| Schedule | `0 3 * * *` (daily 3 AM UTC) | GCP Cloud Scheduler |
| Timeout | 1800s (30 min) | GCP Cloud Scheduler |

### GCP Cloud Scheduler Jobs

**Dev:**
```bash
gcloud scheduler jobs describe audio-cleanup-daily --project=mana-core-dev --location=europe-west3
```

**Prod:**
```bash
gcloud scheduler jobs describe audio-cleanup-daily --project=mana-core-prod --location=europe-west3
```

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cleanup/trigger-from-cron` | POST | Called by Cloud Scheduler |
| `/cleanup/trigger-manual` | POST | Manual trigger for testing |
| `/cleanup/process-old-audios` | POST | Process specific user IDs |

All endpoints require `X-Internal-API-Key` header.

### What Happens When Audio is Deleted

1. Audio file removed from Supabase Storage
2. Memo `source` field updated:
   ```json
   {
     "audio_path": null,
     "audio_deleted": true,
     "audio_deleted_at": "2026-01-26T06:47:02.000Z",
     "transcript": "...",
     "utterances": [...]
   }
   ```
3. Transcript and other data remain intact

### Monitoring

Check cleanup logs:
```sql
SELECT * FROM audio_cleanup_logs ORDER BY started_at DESC LIMIT 10;
```

### Files

- `memoro_middleware/src/cleanup/audio-cleanup.service.ts` - Main cleanup logic
- `memoro_middleware/src/cleanup/audio-cleanup.controller.ts` - HTTP endpoints
- `memoro_middleware/src/cleanup/cleanup.module.ts` - NestJS module
- `mana-core-token-middleware/src/modules/users/controllers/user-cleanup.controller.ts` - User query endpoint
- `mana-core-token-middleware/src/modules/users/services/user-settings.service.ts` - User settings queries

## Development Commands
- `npm run start:dev` - Development server with hot reload
- `npm run build` - Production build
- `npm run start:prod` - Production server

## Key Implementation Details
- Audio format conversion handled via audio-microservice
- Credit validation before processing
- Automatic fallback without user intervention
- Detailed logging for debugging each fallback step
- Full memo object returned on creation for immediate frontend sync
- Auth proxy provides single backend entry point for frontend