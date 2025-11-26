# Process Jobs Worker Edge Function

## Overview

Background worker that processes queued jobs from the `job_queue` table. This is the heart of the asynchronous image generation system.

## Purpose

- Claim and process jobs from the queue
- Handle multiple job types (generate-image, download-image)
- Process jobs in parallel for better throughput
- Update job status and handle retries
- Enqueue follow-up jobs as needed

## Architecture

```
pg_cron (every minute)
    ↓
process-jobs worker
    ↓
claims 3 jobs in parallel
    ↓
┌─────────────┬─────────────┬─────────────┐
│ Job 1       │ Job 2       │ Job 3       │
└─────────────┴─────────────┴─────────────┘
    ↓               ↓               ↓
generate-image  download-image  generate-image
    ↓               ↓               ↓
Replicate API   Storage Upload  Replicate API
```

## Configuration

```typescript
const MAX_PARALLEL_JOBS = 3;      // Jobs processed concurrently
const JOB_TIMEOUT_MS = 600000;    // 10 minutes per job
```

Adjust these based on:
- Server capacity
- Replicate API rate limits
- Storage bandwidth
- Average generation time

## Job Types

### 1. generate-image

Generates an image using Replicate API.

**Payload:**
```typescript
{
  generation_id: string;
  user_id: string;
  prompt: string;
  negative_prompt?: string;
  model_id: string;
  model_version?: string;
  width: number;
  height: number;
  num_inference_steps: number;
  guidance_scale: number;
  seed?: number;
  source_image_url?: string;  // For img2img
  strength?: number;           // For img2img
}
```

**Process:**
1. Update generation status to 'processing'
2. Call `processGeneration()` from process-generation function
3. Wait for Replicate completion (polls every 2 seconds)
4. Enqueue 'download-image' job with result URL
5. Update generation status to 'downloading'
6. Complete job

**On Error:**
- Update generation to 'failed'
- Complete job with error (will retry if attempts remain)

### 2. download-image

Downloads generated image and stores it in Supabase Storage.

**Payload:**
```typescript
{
  generation_id: string;
  user_id: string;
  output_url: string;
  format: string;
  width: number;
  height: number;
  prompt: string;
  negative_prompt?: string;
  model_id: string;
}
```

**Process:**
1. Download image from Replicate URL
2. Upload to Supabase Storage (bucket: generated-images)
3. Create record in 'images' table
4. Update generation status to 'completed'
5. Complete job

**On Error:**
- Retry if attempts remain
- If final attempt fails, mark generation as 'failed'

## How It Works

### 1. Invocation

The function can be triggered in multiple ways:

**Via pg_cron (Production):**
```sql
-- Runs every minute
SELECT cron.schedule(
  'process-jobs-worker',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/process-jobs',
    '{}',
    '{"Content-Type": "application/json"}'::jsonb
  )
  $$
);
```

**Manually (Testing):**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-jobs \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 2. Job Claiming

Uses `claim_next_job()` database function:
- Atomically claims next pending job
- Updates status to 'processing'
- Increments attempt number
- Returns job or NULL if queue empty

### 3. Parallel Processing

```typescript
// Claim and process 3 jobs simultaneously
const jobPromises = [];
for (let i = 0; i < MAX_PARALLEL_JOBS; i++) {
  jobPromises.push(claimAndProcessJob(supabaseAdmin));
}
await Promise.all(jobPromises);
```

### 4. Job Completion

Uses `complete_job()` database function:
- If successful: Updates to 'completed', stores result
- If error and retries remain: Resets to 'pending'
- If error and no retries: Updates to 'failed'

## Database Integration

### Required Database Functions

**claim_next_job()**: Claims next available job
```sql
CREATE OR REPLACE FUNCTION claim_next_job()
RETURNS TABLE(...) AS $$
  -- Atomically claim next pending job
  UPDATE job_queue
  SET status = 'processing',
      attempt_number = attempt_number + 1,
      updated_at = now()
  WHERE id = (
    SELECT id FROM job_queue
    WHERE status = 'pending'
    ORDER BY priority DESC, created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  RETURNING *;
$$ LANGUAGE sql;
```

**complete_job()**: Marks job as completed or failed
```sql
CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
  -- Update job status based on result
  -- Handle retries if error and attempts remain
$$ LANGUAGE plpgsql;
```

**enqueue_job()**: Adds new job to queue
```sql
CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type TEXT,
  p_payload JSONB,
  p_priority INTEGER DEFAULT 0,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS UUID AS $$
  -- Insert new job and return ID
$$ LANGUAGE plpgsql;
```

### Required Tables

**job_queue**:
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
```

## Error Handling

### Job-Level Errors
- Caught and passed to `complete_job()`
- Job retried if attempts remain
- Generation marked as failed on final attempt

### Transient Errors
- Network issues during polling
- Temporary Replicate API errors
- Retried on next attempt

### Fatal Errors
- Invalid job payload
- Missing required configuration
- Job marked as failed immediately

### Timeout Handling
```typescript
await Promise.race([
  processJob(job, supabaseAdmin),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Job timeout')), JOB_TIMEOUT_MS)
  )
]);
```

## Monitoring

### Success Response
```json
{
  "success": true,
  "processed": 3,
  "errors": 0,
  "message": "Processed 3 job(s) with 0 error(s)"
}
```

### Logs
All operations are logged:
- Job claiming
- Job processing start/complete
- API calls
- Database updates
- Errors with stack traces

### Metrics to Monitor
- Jobs processed per invocation
- Average job duration
- Error rate by job type
- Queue depth (pending jobs)
- Failed jobs requiring attention

## Performance Optimization

### Current Configuration
- Runs every minute
- Processes up to 3 jobs per run
- Max throughput: ~180 jobs/hour

### Scaling Up
**More parallel jobs:**
```typescript
const MAX_PARALLEL_JOBS = 10; // Process more at once
```

**More frequent runs:**
```sql
-- Every 30 seconds
SELECT cron.schedule('...', '*/30 * * * * *', ...);
```

**Multiple workers:**
```sql
-- Deploy multiple worker instances
-- Queue uses SKIP LOCKED for safe concurrency
```

### Resource Considerations
- Replicate API rate limits
- Supabase Edge Function concurrency limits
- Database connection pool size
- Storage bandwidth

## Testing

### Local Testing
```bash
# Start functions locally
npx supabase functions serve process-jobs

# Trigger manually
curl -X POST http://localhost:54321/functions/v1/process-jobs \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Enqueue Test Job
```sql
SELECT enqueue_job(
  'generate-image',
  '{
    "generation_id": "test-123",
    "user_id": "user-123",
    "prompt": "test prompt",
    "model_id": "black-forest-labs/flux-schnell",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 4,
    "guidance_scale": 7.5
  }'::jsonb
);
```

### Check Job Status
```sql
SELECT * FROM job_queue
ORDER BY created_at DESC
LIMIT 10;
```

## Deployment

```bash
# Deploy function
npx supabase functions deploy process-jobs

# Set up pg_cron job
psql $DATABASE_URL -c "
SELECT cron.schedule(
  'process-jobs-worker',
  '* * * * *',
  \$\$
  SELECT net.http_post(
    'https://your-project.supabase.co/functions/v1/process-jobs',
    '{}',
    '{\"Content-Type\": \"application/json\"}'::jsonb
  )
  \$\$
);
"
```

## Troubleshooting

### Jobs Not Processing
1. Check pg_cron is installed: `SELECT * FROM cron.job;`
2. Check cron job is scheduled: `SELECT * FROM cron.job_run_details;`
3. Check function is deployed: Test with manual curl
4. Check function logs: Supabase dashboard → Edge Functions → Logs

### Jobs Stuck in Processing
- Likely crashed mid-processing
- Reset manually: `UPDATE job_queue SET status='pending' WHERE status='processing';`
- Jobs will be retried

### High Error Rate
- Check Replicate API status
- Verify API token is valid
- Check database functions exist
- Review job payloads for invalid data

## Future Enhancements

- [ ] Add job priority scheduling
- [ ] Implement dead letter queue for failed jobs
- [ ] Add job progress tracking (0-100%)
- [ ] Support job cancellation
- [ ] Add webhook notifications on completion
- [ ] Implement job batching for efficiency
- [ ] Add health check endpoint
- [ ] Store performance metrics in database
