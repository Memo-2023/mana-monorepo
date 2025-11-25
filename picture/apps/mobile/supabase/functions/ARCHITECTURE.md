# Image Generation System Architecture

## Overview

This is a **refactored asynchronous image generation system** that uses a job queue pattern to handle image generation via Replicate API. The system is designed to be scalable, reliable, and maintainable.

## System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Mobile/Web)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓
                   POST /start-generation
                             │
┌────────────────────────────┴────────────────────────────────────────┐
│                      START GENERATION FUNCTION                       │
│  • Validates user auth                                               │
│  • Creates generation record                                         │
│  • Enqueues 'generate-image' job                                    │
│  • Returns immediately with generation_id                            │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓ Job inserted into queue
┌────────────────────────────┴────────────────────────────────────────┐
│                         JOB QUEUE (Database)                         │
│  • job_queue table                                                   │
│  • Stores: job_type, payload, status, priority                      │
│  • Atomic claiming with SKIP LOCKED                                  │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ↓ pg_cron triggers every minute
┌────────────────────────────┴────────────────────────────────────────┐
│                      PROCESS JOBS WORKER                             │
│  • Claims up to 3 jobs in parallel                                   │
│  • Routes to appropriate handler                                     │
│  • Handles errors and retries                                        │
└──────┬──────────────────────────────────────────────┬───────────────┘
       │                                              │
       ↓ generate-image job                          ↓ download-image job
┌──────┴──────────────────┐              ┌──────────┴───────────────┐
│ PROCESS GENERATION      │              │ DOWNLOAD & STORE         │
│ • Builds model params   │              │ • Downloads image        │
│ • Calls Replicate API   │              │ • Uploads to Storage     │
│ • Polls for completion  │──────────────│ • Creates image record   │
│ • Enqueues download job │              │ • Marks as completed     │
└─────────────────────────┘              └──────────────────────────┘
```

## Edge Functions

### 1. start-generation
**Purpose**: Accept generation request and enqueue for processing

**Flow**:
1. Validate user authentication
2. Validate model configuration
3. Create generation record (status: 'pending')
4. Enqueue 'generate-image' job
5. Return immediately with generation_id

**Key Feature**: No waiting! Returns in ~100ms

**Location**: `supabase/functions/start-generation/index.ts`

---

### 2. process-jobs (Worker)
**Purpose**: Background worker that processes queued jobs

**Flow**:
1. Triggered by pg_cron every minute
2. Claims next 3 available jobs (parallel processing)
3. Routes to appropriate handler based on job_type
4. Updates job status and handles retries
5. Returns summary of processed jobs

**Supported Job Types**:
- `generate-image`: Start Replicate generation
- `download-image`: Download and store result

**Configuration**:
- `MAX_PARALLEL_JOBS = 3`
- `JOB_TIMEOUT_MS = 600000` (10 minutes)

**Location**: `supabase/functions/process-jobs/index.ts`

---

### 3. process-generation (Module)
**Purpose**: Handle Replicate API interaction

**Flow**:
1. Calculate aspect ratios for model
2. Handle img2img conversion if needed
3. Build model-specific input parameters
4. Call Replicate API to start prediction
5. Poll every 2 seconds until complete
6. Return output URL and metadata

**Supported Models** (15+):
- FLUX (Schnell, Dev, Krea Dev, 1.1 Pro)
- SDXL (Regular, Lightning)
- Ideogram V3 Turbo
- Imagen 4 Fast
- Stable Diffusion 3.5
- SeeDream 3/4
- Recraft V3 (raster & SVG)
- Qwen Image

**Key Features**:
- Model-specific parameter handling
- Automatic aspect ratio mapping
- Image-to-image support
- Format detection

**Location**: `supabase/functions/process-generation/index.ts`

---

### 4. generate-image (Legacy)
**Status**: Keep for now, will be deprecated

The original 667-line monolithic function. Still works but doesn't use the queue system. Will be gradually phased out as the queue system proves stable.

**Location**: `supabase/functions/generate-image/index.ts`

## Database Schema

### Tables

#### image_generations
Tracks generation requests and status.

```sql
CREATE TABLE image_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model TEXT NOT NULL,
  style TEXT,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  steps INTEGER NOT NULL,
  guidance_scale NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  generation_time_seconds INTEGER,
  replicate_prediction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Status values: pending, queued, processing, downloading, completed, failed
```

#### job_queue
Queue for async job processing.

```sql
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority INTEGER NOT NULL DEFAULT 0,
  attempt_number INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_job_queue_pending
  ON job_queue(status, priority DESC, created_at ASC)
  WHERE status = 'pending';

-- Status values: pending, processing, completed, failed
```

#### images
Stores generated image metadata.

```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES image_generations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  format TEXT NOT NULL,
  prompt TEXT,
  negative_prompt TEXT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Database Functions

#### enqueue_job(job_type, payload, priority, max_attempts)
Adds a new job to the queue.

```sql
CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type TEXT,
  p_payload JSONB,
  p_priority INTEGER DEFAULT 0,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO job_queue (job_type, payload, priority, max_attempts)
  VALUES (p_job_type, p_payload, p_priority, p_max_attempts)
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql;
```

#### claim_next_job()
Atomically claims the next available job.

```sql
CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS TABLE(
  id UUID,
  job_type TEXT,
  payload JSONB,
  attempt_number INTEGER,
  max_attempts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE job_queue
  SET
    status = 'processing',
    attempt_number = attempt_number + 1,
    updated_at = now()
  WHERE id = (
    SELECT id FROM job_queue
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING
    job_queue.id,
    job_queue.job_type,
    job_queue.payload,
    job_queue.attempt_number,
    job_queue.max_attempts;
END;
$$ LANGUAGE plpgsql;
```

#### complete_job(job_id, result, error)
Marks job as completed or failed. Handles retries.

```sql
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_job RECORD;
BEGIN
  SELECT * INTO v_job FROM job_queue WHERE id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- If error and retries remain, reset to pending
  IF p_error IS NOT NULL AND v_job.attempt_number < v_job.max_attempts THEN
    UPDATE job_queue
    SET
      status = 'pending',
      error_message = p_error,
      updated_at = now()
    WHERE id = p_job_id;

  -- If error and no retries, mark as failed
  ELSIF p_error IS NOT NULL THEN
    UPDATE job_queue
    SET
      status = 'failed',
      error_message = p_error,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_job_id;

  -- Success - mark as completed
  ELSE
    UPDATE job_queue
    SET
      status = 'completed',
      result = p_result,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Job Flow Example

### End-to-End Flow

```
1. User submits generation request
   └─> POST /functions/v1/start-generation
       {
         "prompt": "A beautiful sunset",
         "model_id": "black-forest-labs/flux-schnell",
         "width": 1024,
         "height": 1024
       }

2. start-generation function
   ├─> Creates image_generations record (id: gen-123, status: 'pending')
   ├─> Calls enqueue_job('generate-image', {...})
   ├─> Updates generation (status: 'queued')
   └─> Returns { generation_id: 'gen-123', status: 'queued' }

   ⏱️  ~100ms response time

3. job_queue table
   └─> New row: { id: 'job-456', job_type: 'generate-image', status: 'pending' }

4. pg_cron triggers (every minute)
   └─> POST /functions/v1/process-jobs

5. process-jobs worker
   ├─> Calls claim_next_job() → Returns job-456
   ├─> Updates job (status: 'processing', attempt: 1)
   └─> Routes to processGenerateImageJob()

6. processGenerateImageJob
   ├─> Updates generation (status: 'processing')
   ├─> Calls processGeneration() from process-generation module
   │   ├─> Builds model input
   │   ├─> Calls Replicate API → prediction-789
   │   ├─> Polls every 2 seconds
   │   └─> Returns { output_url: 'https://...', format: 'webp' }
   ├─> Calls enqueue_job('download-image', {...})
   ├─> Updates generation (status: 'downloading')
   └─> Calls complete_job(job-456, result)

   ⏱️  ~30 seconds for FLUX Schnell

7. job_queue table
   └─> New row: { id: 'job-789', job_type: 'download-image', status: 'pending' }

8. Next pg_cron trigger
   └─> process-jobs claims job-789

9. processDownloadImageJob
   ├─> Downloads image from output_url
   ├─> Uploads to Supabase Storage (bucket: generated-images)
   ├─> Creates images record (id: img-999)
   ├─> Updates generation (status: 'completed')
   └─> Calls complete_job(job-789, result)

   ⏱️  ~2-5 seconds

10. User sees completed image
    └─> Polling generation status or real-time subscription
        { status: 'completed', image_url: 'https://...' }
```

## Status Flow

### Generation Status Lifecycle

```
pending
  ↓
queued (job enqueued)
  ↓
processing (Replicate API called)
  ↓
downloading (image generation complete, downloading)
  ↓
completed (image stored and ready)

     OR

failed (error at any step)
```

### Job Status Lifecycle

```
pending
  ↓
processing (claimed by worker)
  ↓
completed (success)
  OR
failed (max attempts reached)
  OR
pending (retry if attempts remain)
```

## Monitoring & Observability

### Key Metrics

1. **Queue Depth**
   ```sql
   SELECT COUNT(*) FROM job_queue WHERE status = 'pending';
   ```

2. **Processing Rate**
   ```sql
   SELECT
     COUNT(*) as total_jobs,
     COUNT(*) FILTER (WHERE completed_at > now() - interval '1 hour') as last_hour
   FROM job_queue
   WHERE status = 'completed';
   ```

3. **Error Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate_pct
   FROM job_queue
   WHERE created_at > now() - interval '24 hours';
   ```

4. **Average Generation Time**
   ```sql
   SELECT AVG(generation_time_seconds) as avg_time
   FROM image_generations
   WHERE status = 'completed'
     AND created_at > now() - interval '24 hours';
   ```

### Logs

All Edge Functions log to Supabase Edge Function Logs:
- Job claiming and processing
- Replicate API calls
- Database updates
- Errors with stack traces

Access via: Supabase Dashboard → Edge Functions → Logs

### Alerts

Set up alerts for:
- Queue depth > threshold (e.g., 100 jobs)
- High error rate (> 10%)
- Jobs stuck in 'processing' (> 15 minutes)
- No jobs processed in last 5 minutes

## Performance Characteristics

### Current Configuration

- **Throughput**: ~180 generations/hour
  - 60 invocations/hour × 3 jobs/invocation = 180 jobs/hour
- **Latency**:
  - Enqueue: ~100ms
  - FLUX Schnell: ~30 seconds
  - SDXL: ~60 seconds
  - Download/Store: ~2-5 seconds
- **Concurrency**: 3 parallel jobs

### Scaling Strategies

#### Vertical Scaling (Single Worker)
```typescript
// Increase parallel jobs
const MAX_PARALLEL_JOBS = 10;  // 600 jobs/hour
```

#### Horizontal Scaling (Multiple Workers)
```sql
-- Increase cron frequency
SELECT cron.schedule('...', '*/30 * * * * *', ...);  -- Every 30 seconds
-- Result: ~360 jobs/hour with 3 parallel jobs
```

#### Hybrid Scaling
- 10 parallel jobs + 30-second interval = ~1,200 jobs/hour
- Queue system uses SKIP LOCKED for safe concurrency

### Bottlenecks

1. **Replicate API**: Rate limits vary by model
2. **Edge Function Runtime**: Max 150 seconds default (configurable)
3. **Database Connections**: Connection pool size
4. **Storage Bandwidth**: Image upload/download speed

## Error Handling & Recovery

### Retry Strategy

1. **Automatic Retries**:
   - Jobs retry up to `max_attempts` (default: 3)
   - Exponential backoff via pg_cron interval

2. **Manual Recovery**:
   ```sql
   -- Reset stuck jobs
   UPDATE job_queue
   SET status = 'pending', attempt_number = 0
   WHERE status = 'processing'
     AND updated_at < now() - interval '15 minutes';
   ```

3. **Generation Cleanup**:
   ```sql
   -- Mark abandoned generations as failed
   UPDATE image_generations
   SET status = 'failed', error_message = 'Timeout'
   WHERE status IN ('processing', 'downloading')
     AND updated_at < now() - interval '30 minutes';
   ```

### Common Issues

#### Jobs Not Processing
- **Check**: pg_cron installed and scheduled
- **Fix**: `SELECT cron.schedule(...);`

#### High Queue Depth
- **Check**: Worker processing rate vs. incoming rate
- **Fix**: Increase `MAX_PARALLEL_JOBS` or cron frequency

#### Failed Jobs
- **Check**: Job error messages in `job_queue.error_message`
- **Fix**: Address root cause, then reset jobs to pending

## Security

### Authentication
- start-generation: Requires valid user auth token
- process-jobs: Service role access (no user context needed)

### Authorization
- Users can only create generations for themselves
- RLS policies on tables enforce user isolation

### API Keys
- Replicate API token stored in Edge Function secrets
- Never exposed to client

## Testing

### Local Development

```bash
# Start Supabase locally
npx supabase start

# Serve functions
npx supabase functions serve

# Test in separate terminals
curl -X POST http://localhost:54321/functions/v1/start-generation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"prompt":"test","model_id":"black-forest-labs/flux-schnell",...}'

curl -X POST http://localhost:54321/functions/v1/process-jobs \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Integration Tests

1. Enqueue job via start-generation
2. Manually trigger process-jobs
3. Verify generation status progression
4. Verify image is stored correctly

## Deployment

### Deploy Functions

```bash
# Deploy all functions
npx supabase functions deploy start-generation
npx supabase functions deploy process-generation
npx supabase functions deploy process-jobs
```

### Set Up pg_cron

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule worker to run every minute
SELECT cron.schedule(
  'process-jobs-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/process-jobs',
    '{}',
    '{"Content-Type": "application/json"}'::jsonb
  )
  $$
);

-- Verify schedule
SELECT * FROM cron.job;
```

### Environment Variables

Required in Supabase Edge Function settings:
- `REPLICATE_API_TOKEN` or `REPLICATE_API_KEY`
- `SUPABASE_URL` (auto-provided)
- `SUPABASE_ANON_KEY` (auto-provided)
- `SUPABASE_SERVICE_ROLE_KEY` (auto-provided)

## Migration from Legacy System

### Current State
- Legacy `generate-image` function still active
- New queue system running in parallel

### Migration Steps

1. **Phase 1: Parallel Run** (Current)
   - Both systems active
   - New features use queue system
   - Monitor queue system stability

2. **Phase 2: Gradual Cutover**
   - Update mobile/web clients to use start-generation
   - Monitor error rates and performance
   - Keep legacy function for fallback

3. **Phase 3: Deprecation**
   - Disable legacy function
   - Remove old code
   - Update documentation

### Rollback Plan
If issues arise, simply revert clients to use legacy `generate-image` function.

## Future Enhancements

### Short Term
- [ ] Add job priority scheduling
- [ ] Implement progress tracking (0-100%)
- [ ] Add webhook notifications
- [ ] Implement job cancellation

### Medium Term
- [ ] Batch generation support
- [ ] Advanced retry strategies (exponential backoff)
- [ ] Dead letter queue for failed jobs
- [ ] Real-time status updates via Supabase Realtime

### Long Term
- [ ] Multi-region deployment
- [ ] Cost tracking per generation
- [ ] A/B testing framework for models
- [ ] ML-based queue optimization

## References

### Documentation
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Replicate API](https://replicate.com/docs)
- [pg_cron](https://github.com/citusdata/pg_cron)

### Related Files
- `/apps/mobile/supabase/functions/start-generation/index.ts`
- `/apps/mobile/supabase/functions/process-jobs/index.ts`
- `/apps/mobile/supabase/functions/process-generation/index.ts`
- `/apps/mobile/supabase/functions/generate-image/index.ts` (legacy)
