# Service-to-Service Authentication Implementation

## Overview
This document describes the implementation of service role key authentication between the audio microservice and memoro service, replacing the previous user JWT token passthrough approach.

## Problem Statement
The audio microservice was experiencing 401 authentication errors when calling back to the memoro service because:
- User JWT tokens were expiring during long-running transcription processes
- The audio service needed to make callbacks even after the user's session ended
- Service-to-service communication should not depend on user authentication

## Solution Architecture

### 1. Service Authentication Guard
Created `src/guards/service-auth.guard.ts` that:
- Validates requests using Supabase service role keys
- Accepts both `MEMORO_SUPABASE_SERVICE_KEY` and `SUPABASE_SERVICE_KEY` for compatibility
- Marks authenticated requests with `isServiceAuth` flag

### 2. Dedicated Service Endpoints
Created `src/memoro/memoro-service.controller.ts` with service-specific endpoints:
- `/memoro/service/transcription-completed`
- `/memoro/service/append-transcription-completed`
- `/memoro/service/update-batch-metadata`

These endpoints:
- Use `ServiceAuthGuard` instead of regular `AuthGuard`
- Call existing service methods with `token: null`
- Pass userId for ownership validation

### 3. Ownership Validation
Updated service methods to validate memo ownership when using service auth:
- `handleTranscriptionCompleted`: Validates memo.user_id matches provided userId
- `handleAppendTranscriptionCompleted`: Validates memo.user_id matches provided userId
- `updateBatchMetadataByMemoId`: Validates memo.user_id matches provided userId (when userId provided)

### 4. Supabase Client Configuration
Fixed JWT parsing errors by conditionally creating Supabase clients:
```typescript
const authClient = isServiceAuth 
  ? createClient(this.memoroUrl, this.memoroServiceKey)
  : createClient(this.memoroUrl, this.memoroServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
```

## Audio Microservice Changes

### 1. Updated Callback URLs
All callbacks now use `/service/` endpoints:
- `notifyTranscriptionComplete`: Uses `/memoro/service/transcription-completed`
- `notifyAppendTranscriptionComplete`: Uses `/memoro/service/append-transcription-completed`
- `storeBatchJobMetadata`: Uses `/memoro/service/update-batch-metadata`

### 2. Service Key Authentication
Updated to use service role key instead of user tokens:
```typescript
const serviceKey = this.configService.get('MEMORO_SUPABASE_SERVICE_KEY') || 
                   this.configService.get('SUPABASE_SERVICE_KEY');
```

### 3. UserId Parameter
Added userId parameter to batch metadata updates for ownership validation

## Environment Variables

### Memoro Service
```bash
# Primary service key
MEMORO_SUPABASE_SERVICE_KEY=<service-role-key>

# Also accepts for compatibility
SUPABASE_SERVICE_KEY=<service-role-key>
```

### Audio Microservice
```bash
# Primary service key (for memoro callbacks)
MEMORO_SUPABASE_SERVICE_KEY=<service-role-key>

# Original service key (for Supabase operations)
SUPABASE_SERVICE_KEY=<service-role-key>
```

## Deployment Steps

### 1. Deploy Memoro Service
```bash
# Add environment variable
gcloud run services update memoro-service \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --update-env-vars="SUPABASE_SERVICE_KEY=<service-role-key>"

# Build and deploy new code
gcloud builds submit --config=cloudbuild-memoro.yaml
gcloud run deploy memoro-service \
  --project=memo-2c4c4 \
  --image=europe-west3-docker.pkg.dev/memo-2c4c4/memoro-service/memoro-service:v4.9.6 \
  --platform=managed \
  --region=europe-west3 \
  --allow-unauthenticated \
  --memory=1Gi
```

### 2. Deploy Audio Microservice
```bash
# Add environment variable
gcloud run services update audio-microservice \
  --project=memo-2c4c4 \
  --region=europe-west3 \
  --update-env-vars="MEMORO_SUPABASE_SERVICE_KEY=<service-role-key>"

# Build and deploy new code
# (Follow standard audio microservice deployment process)
```

## Security Considerations

1. **Service Role Key Protection**: Service role keys bypass RLS, so they must be:
   - Stored as environment variables only
   - Never exposed to clients
   - Rotated periodically

2. **Ownership Validation**: Even with service auth, the system validates:
   - User owns the memo being updated
   - Prevents unauthorized access across users

3. **Network Security**: Both services run on Google Cloud Run with:
   - HTTPS encryption in transit
   - Network isolation
   - IAM-based access control

## Benefits

1. **Reliability**: No more 401 errors from expired user tokens
2. **Consistency**: Service-to-service auth independent of user sessions
3. **Performance**: Direct service authentication without token validation overhead
4. **Maintainability**: Clear separation between user and service endpoints

## Future Improvements

1. **mTLS**: Implement mutual TLS between services
2. **Service Accounts**: Use Google Cloud service accounts instead of API keys
3. **Rate Limiting**: Add rate limiting to service endpoints
4. **Audit Logging**: Enhanced logging for service-to-service calls