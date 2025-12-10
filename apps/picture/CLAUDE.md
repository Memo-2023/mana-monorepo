# Picture App - CLAUDE.md

AI image generation app using Replicate API with freemium credit system.

## Project Structure

```
apps/picture/
├── apps/
│   ├── backend/     # NestJS API (port 3006)
│   ├── mobile/      # Expo React Native app
│   ├── web/         # SvelteKit web app
│   └── landing/     # Astro marketing page
└── packages/        # Shared code
```

## Quick Start

```bash
# From monorepo root
pnpm dev:picture:full    # Start backend + web + auto DB setup

# Individual apps
pnpm --filter @picture/backend dev    # Backend only (port 3006)
pnpm --filter @picture/web dev        # Web only
pnpm --filter @picture/mobile dev     # Mobile only
```

## Backend Architecture

### Key Services

| Service | Purpose |
|---------|---------|
| `GenerateService` | AI image generation with freemium/credit logic |
| `ReplicateService` | Replicate API integration |
| `StorageService` | MinIO/S3 storage via `@manacore/shared-storage` |
| `CreditClientService` | Credit system via `@mana-core/nestjs-integration` |

### Freemium Model

- **Free tier**: 3 free generations per user
- **Paid tier**: 10 credits per generation
- **Enforcement**: Only in staging (`NODE_ENV=staging`)
- **Development**: Fail-open (no credit enforcement)

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REPLICATE_API_TOKEN` | Replicate API key | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `S3_ENDPOINT` | MinIO/S3 endpoint | Yes |
| `MANA_CORE_AUTH_URL` | Auth service URL | Yes |
| `MANA_CORE_SERVICE_KEY` | Service key for credits | Staging only |
| `APP_ID` | App identifier | Yes |

---

## TODO List

### Testing Required

- [ ] **Test freemium flow with new user**
  - Create new user ID and verify 3 free generations work
  - Verify `freeGenerationsRemaining` decrements correctly (3 → 2 → 1 → 0)
  - Verify 4th generation still works in development (fail-open)

- [ ] **Test staging credit enforcement**
  - Set `NODE_ENV=staging` and test credit check
  - Verify HTTP 402 returned when credits insufficient
  - Test with valid `MANA_CORE_SERVICE_KEY`

- [ ] **Test async generation (webhook mode)**
  - Test generation without `waitForResult: true`
  - Verify webhook receives completion callback
  - Verify credits consumed on webhook success

- [ ] **Test error handling**
  - Test with invalid model ID
  - Test with invalid Replicate API token
  - Test storage upload failures

- [ ] **Integration tests**
  - Write Jest tests for `GenerateService`
  - Mock `CreditClientService` calls
  - Test all generation paths (free/paid, sync/async)

### Features to Implement

- [ ] **Add credit balance endpoint**
  - GET `/api/v1/credits/balance` - Return user's credit balance
  - Use `CreditClientService.getBalance()`

- [ ] **Add generation history endpoint**
  - GET `/api/v1/generate/history` - User's generation history
  - Include credits used per generation

- [ ] **Improve error messages**
  - Add proper error codes for credit failures
  - Return helpful messages for insufficient credits

- [ ] **Rate limiting**
  - Add rate limits for generation endpoints
  - Prevent abuse of free tier

### Web App Tasks

- [ ] **Show free generations remaining**
  - Display counter in UI
  - Show warning when approaching limit

- [ ] **Credit purchase flow**
  - Integrate with mana-core credit purchase
  - Show credit balance in header

- [ ] **Generation queue UI**
  - Show pending generations
  - Poll for status updates

### Mobile App Tasks

- [ ] **Implement generation screen**
  - Model selection
  - Prompt input with suggestions
  - Generation progress indicator

- [ ] **Gallery view**
  - Grid view of user's generated images
  - Favorites functionality

### DevOps Tasks

- [ ] **Staging deployment**
  - Deploy backend to staging server
  - Configure `MANA_CORE_SERVICE_KEY` in staging
  - Test credit system end-to-end

- [ ] **Monitoring**
  - Add logging for credit operations
  - Track generation success/failure rates
  - Monitor Replicate API usage

---

## API Endpoints

### Generate

```bash
# Generate image (sync)
POST /api/v1/generate
{
  "prompt": "A beautiful sunset",
  "modelId": "uuid",
  "waitForResult": true
}

# Check status
GET /api/v1/generate/:id/status

# Cancel generation
DELETE /api/v1/generate/:id

# Webhook (internal)
POST /api/v1/generate/webhook
```

### Models

```bash
GET /api/v1/models         # List all models
GET /api/v1/models/:id     # Get model details
```

### Images

```bash
GET /api/v1/images         # List user's images
GET /api/v1/images/:id     # Get image details
DELETE /api/v1/images/:id  # Delete image
```

---

## Recent Changes

### 2025-12-10: Credit System Integration

- Added `@mana-core/nestjs-integration` for credit system
- Implemented freemium model (3 free, then 10 credits)
- Credit enforcement only in staging environment
- Updated `GenerateService` with `checkGenerationAccess()`
- Response includes `freeGenerationsRemaining` count
