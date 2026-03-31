# Memoro Microservice

This is a standalone microservice for the Memoro component of the Mana Core system. It was extracted from the monolithic mana-core-middleware to enable independent scaling and deployment.

## Architecture

This microservice:
- Handles all Memoro-specific functionality
- Communicates with Auth service for authentication/authorization
- Communicates with Spaces service for space management
- Connects directly to the Memoro Supabase instance
- Implements mana cost validation for AI operations

## Mana Cost System

The service implements a backend-driven credit validation system:

- **Transcription**: 120 credits per hour / 2 credits per minute (base cost: 10 credits minimum)
- **Question Processing**: 5 mana per question asked to memos
- **Memo Combination**: 5 mana per memo when combining multiple memos
- **Headline Generation**: 10 credits for title/summary generation
- **Memory Creation**: 10 credits for AI-generated memories
- **Blueprint Processing**: 5 credits for blueprint application
- **Memo Sharing**: 1 credit for sharing operations
- **Space Operations**: 2 credits for space-related operations
- **Early Validation**: Credits are checked before expensive AI operations
- **Real-time Updates**: Frontend mana counter updates immediately after operations

All AI processing endpoints validate sufficient mana credits before processing and consume credits upon successful completion.

## API Endpoints

### Core Memoro Endpoints
- `GET /memoro/spaces` - Get all Memoro spaces for the authenticated user
- `POST /memoro/spaces` - Create a new Memoro space
- `GET /memoro/spaces/:id` - Get details for a specific Memoro space
- `DELETE /memoro/spaces/:id` - Delete a Memoro space
- `POST /memoro/link-memo` - Link a memo to a space
- `POST /memoro/unlink-memo` - Unlink a memo from a space
- `GET /memoro/spaces/:id/memos` - Get all memos for a specific space
- `POST /memoro/spaces/:id/leave` - Leave a space

### Space Invitation Management
- `GET /memoro/spaces/:id/invites` - Get space invitations
- `POST /memoro/spaces/:id/invite` - Invite user to space
- `POST /memoro/spaces/invites/:inviteId/resend` - Resend invitation
- `DELETE /memoro/spaces/invites/:inviteId` - Cancel invitation
- `GET /memoro/invites/pending` - Get user's pending invites
- `POST /memoro/spaces/invites/accept` - Accept invitation
- `POST /memoro/spaces/invites/decline` - Decline invitation

### Audio Processing
- `POST /memoro/process-uploaded-audio` - Process uploaded audio with intelligent fallback strategy and credit validation
- `POST /memoro/update-batch-metadata` - Update batch transcription metadata for recovery tracking (improved with memo ID lookup, 2025-06-08)
- `POST /memoro/retry-transcription` - Retry failed transcription
- `POST /memoro/retry-headline` - Retry failed headline generation

#### Enhanced Audio Processing System
The service implements a sophisticated dual-path transcription system with comprehensive fallback strategies:

**Transcription Paths:**
1. **Fast Transcription** (<115 minutes) - Real-time processing via Supabase Edge Function
2. **Batch Transcription** (≥115 minutes) - Azure Speech Service batch processing with webhook callbacks

**Enhanced Fallback Strategy:**
1. **Fast Transcribe** - Attempts fast transcription via edge function
2. **Format Conversion + Retry** - If audio format error detected, converts file via audio-microservice and retries
3. **Batch Processing Fallback** - Falls back to batch processing if conversion fails
4. **Intelligent Error Detection** - Automatically detects Azure Speech Service format compatibility issues

**Batch Transcription Enhancements:**
- **Advanced Diarization**: Supports up to 10 speakers (vs 2 in basic mode)
- **Multi-language Detection**: Automatic language identification from user preferences
- **Complete Data Consistency**: Same speaker data structure as fast transcription
- **Recovery Tracking**: Stores Azure jobId for webhook failure recovery
- **Graceful Degradation**: Falls back to text-only if speaker processing fails

**Supported Processing Routes:**
- `fast_transcribe` - Direct fast transcription success
- `fast_transcribe_converted` - Success after format conversion  
- `batch_transcribe` - Regular batch processing for long files
- `batch_transcribe_fallback` - Success via batch processing fallback

**Data Structure Consistency:**
Both fast and batch transcription now save identical data:
- `transcript` - Transcribed text
- `primary_language` - Detected primary language
- `languages` - All detected languages
- `utterances` - Speaker segments with timestamps
- `speakers` - Speaker labels
- `speakerMap` - Speaker-grouped utterances

### AI Processing Endpoints (with Credit Validation)
- `POST /memoro/question-memo` - Ask questions about memos (5 mana cost)
- `POST /memoro/combine-memos` - Combine multiple memos with AI processing (5 mana per memo)

### Credit Management
- `POST /memoro/credits/check-transcription` - Check credits before transcription
- `POST /memoro/credits/consume-transcription` - Consume transcription credits
- `POST /memoro/credits/consume-operation` - Consume operation credits

### User Settings Management
- `GET /settings` - Get all user settings
- `GET /settings/memoro` - Get Memoro-specific settings
- `PATCH /settings/memoro` - Update Memoro settings
- `PATCH /settings/memoro/data-usage` - Update data usage acceptance
- `PATCH /settings/memoro/email-newsletter` - Update email newsletter opt-in
- `PATCH /settings/profile` - Update user profile (firstName, lastName, avatarUrl)

## Environment Variables

Required environment variables:

```env
# Server Configuration
PORT=3001

# Service URLs
MANA_SERVICE_URL=http://localhost:3000
AUDIO_MICROSERVICE_URL=https://audio-microservice-111768794939.europe-west3.run.app

# Supabase Configuration
MEMORO_SUPABASE_URL=https://your-memoro-project.supabase.co
MEMORO_SUPABASE_ANON_KEY=your-memoro-anon-key
MEMORO_SUPABASE_SERVICE_KEY=your-memoro-service-key

# App Configuration
MEMORO_APP_ID=973da0c1-b479-4dac-a1b0-ed09c72caca8
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Build for production
npm run build

# Run in production mode
npm run start:prod
```

## Deployment

For Cloud Run deployment instructions, see `cloud-run-deploy.md`.



testing prod deployment 30.juli 2025 03:30