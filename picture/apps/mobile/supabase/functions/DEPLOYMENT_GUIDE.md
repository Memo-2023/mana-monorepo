# Deployment Guide - Image Generation Queue System

## Prerequisites

Before deploying, ensure you have:

1. **Supabase CLI** installed and authenticated
   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. **Replicate API Token**
   - Sign up at [replicate.com](https://replicate.com)
   - Generate API token from dashboard
   - Have it ready for Edge Function secrets

3. **Database Extensions**
   - `pg_cron` extension enabled
   - `http` extension enabled (for net.http_post)

## Step 1: Create Database Schema

Run these SQL commands in Supabase SQL Editor:

### 1.1 Enable Required Extensions

```sql
-- Enable pg_cron for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http for making HTTP requests from cron
CREATE EXTENSION IF NOT EXISTS http;
```

### 1.2 Create job_queue Table

```sql
CREATE TABLE IF NOT EXISTS job_queue (
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
  completed_at TIMESTAMPTZ,

  CONSTRAINT job_queue_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Index for efficient job claiming
CREATE INDEX IF NOT EXISTS idx_job_queue_pending
  ON job_queue(status, priority DESC, created_at ASC)
  WHERE status = 'pending';

-- Index for monitoring
CREATE INDEX IF NOT EXISTS idx_job_queue_created_at
  ON job_queue(created_at DESC);

-- Index for job type filtering
CREATE INDEX IF NOT EXISTS idx_job_queue_type
  ON job_queue(job_type, status);
```

### 1.3 Create Database Functions

**enqueue_job()** - Add job to queue:

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**claim_next_job()** - Atomically claim next job:

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
    SELECT job_queue.id
    FROM job_queue
    WHERE job_queue.status = 'pending'
    ORDER BY job_queue.priority DESC, job_queue.created_at ASC
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**complete_job()** - Mark job as complete or failed:

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
  -- Get current job state
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

  -- If error and no retries left, mark as failed
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
      error_message = NULL,
      completed_at = now(),
      updated_at = now()
    WHERE id = p_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 1.4 Update image_generations Table

Add new status values if not already present:

```sql
-- Add 'queued' and 'downloading' statuses
-- Adjust the check constraint if it exists
ALTER TABLE image_generations
  DROP CONSTRAINT IF EXISTS image_generations_status_check;

ALTER TABLE image_generations
  ADD CONSTRAINT image_generations_status_check
  CHECK (status IN ('pending', 'queued', 'processing', 'downloading', 'completed', 'failed'));
```

## Step 2: Deploy Edge Functions

### 2.1 Deploy Functions

```bash
# From the root of your project
cd apps/mobile

# Deploy all functions
npx supabase functions deploy start-generation
npx supabase functions deploy process-generation
npx supabase functions deploy process-jobs
```

### 2.2 Set Environment Secrets

```bash
# Set Replicate API token
npx supabase secrets set REPLICATE_API_TOKEN=your_replicate_token_here

# Verify secrets are set
npx supabase secrets list
```

## Step 3: Set Up Cron Job

### 3.1 Schedule process-jobs Worker

Run in Supabase SQL Editor:

```sql
-- Schedule worker to run every minute
SELECT cron.schedule(
  'process-jobs-worker',
  '* * * * *',  -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-jobs',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
```

**Important**: Replace `YOUR_PROJECT_REF` with your actual Supabase project reference.

### 3.2 Verify Cron Job

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- View recent cron job runs
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

### 3.3 (Optional) Adjust Frequency

For higher throughput, run more frequently:

```sql
-- Every 30 seconds (requires pg_cron 1.5+)
SELECT cron.schedule(
  'process-jobs-worker',
  '*/30 * * * * *',  -- Every 30 seconds
  $$ ... $$
);

-- To update existing job
SELECT cron.unschedule('process-jobs-worker');
-- Then create new schedule
```

## Step 4: Testing

### 4.1 Manual Function Test

Test start-generation:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/start-generation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains",
    "model_id": "black-forest-labs/flux-schnell",
    "width": 1024,
    "height": 1024,
    "num_inference_steps": 4,
    "guidance_scale": 7.5
  }'
```

Expected response:
```json
{
  "success": true,
  "generation_id": "uuid-here",
  "job_id": "uuid-here",
  "status": "queued",
  "message": "Image generation started. You will be notified when complete."
}
```

### 4.2 Manually Trigger Worker

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-jobs \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected response:
```json
{
  "success": true,
  "processed": 1,
  "errors": 0,
  "message": "Processed 1 job(s) with 0 error(s)"
}
```

### 4.3 Check Job Queue

```sql
-- View pending jobs
SELECT * FROM job_queue
WHERE status = 'pending'
ORDER BY created_at DESC;

-- View recent completed jobs
SELECT * FROM job_queue
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 10;

-- View failed jobs
SELECT id, job_type, error_message, attempt_number
FROM job_queue
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### 4.4 Check Generation Status

```sql
-- View recent generations
SELECT id, prompt, status, error_message, created_at, completed_at
FROM image_generations
ORDER BY created_at DESC
LIMIT 10;

-- Check specific generation
SELECT * FROM image_generations
WHERE id = 'YOUR_GENERATION_ID';
```

### 4.5 End-to-End Test

1. Submit generation request via start-generation
2. Note the generation_id and job_id
3. Wait ~1 minute for cron to trigger (or manually trigger process-jobs)
4. Check generation status (should go: queued → processing → downloading → completed)
5. Verify image appears in images table
6. Verify image is in Storage bucket

## Step 5: Monitoring Setup

### 5.1 Create Monitoring Views

```sql
-- Queue health view
CREATE OR REPLACE VIEW queue_health AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_jobs,
  COUNT(*) FILTER (WHERE status = 'completed' AND completed_at > now() - interval '1 hour') as completed_last_hour,
  COUNT(*) FILTER (WHERE status = 'failed' AND updated_at > now() - interval '1 hour') as failed_last_hour,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE status = 'completed' AND completed_at > now() - interval '1 hour') as avg_processing_time_seconds
FROM job_queue;

-- View queue health
SELECT * FROM queue_health;
```

### 5.2 Set Up Alerts

Create alerts for:

1. **High Queue Depth**
   ```sql
   SELECT COUNT(*) FROM job_queue WHERE status = 'pending';
   -- Alert if > 50
   ```

2. **Stuck Jobs**
   ```sql
   SELECT COUNT(*) FROM job_queue
   WHERE status = 'processing'
     AND updated_at < now() - interval '15 minutes';
   -- Alert if > 0
   ```

3. **High Error Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as error_rate
   FROM job_queue
   WHERE created_at > now() - interval '1 hour';
   -- Alert if > 10%
   ```

### 5.3 Edge Function Logs

View logs in Supabase Dashboard:
1. Go to Edge Functions
2. Select function (process-jobs, start-generation, etc.)
3. Click "Logs" tab
4. Filter by time range and log level

## Step 6: Client Integration

### 6.1 Update API Calls

**Before (Old System):**
```typescript
// Direct call that waits for completion
const response = await supabase.functions.invoke('generate-image', {
  body: { prompt, model_id, ... }
});
// Wait ~30-60 seconds for response
```

**After (New Queue System):**
```typescript
// 1. Enqueue generation (instant response)
const { data } = await supabase.functions.invoke('start-generation', {
  body: { prompt, model_id, ... }
});

const generationId = data.generation_id;

// 2. Poll for completion
const checkStatus = async () => {
  const { data: generation } = await supabase
    .from('image_generations')
    .select('*, images(*)')
    .eq('id', generationId)
    .single();

  return generation;
};

// Poll every 2 seconds
const pollInterval = setInterval(async () => {
  const generation = await checkStatus();

  if (generation.status === 'completed') {
    clearInterval(pollInterval);
    // Show image: generation.images[0].public_url
  } else if (generation.status === 'failed') {
    clearInterval(pollInterval);
    // Show error: generation.error_message
  }
}, 2000);
```

### 6.2 Real-Time Subscription (Better UX)

```typescript
// 1. Enqueue generation
const { data } = await supabase.functions.invoke('start-generation', {
  body: { prompt, model_id, ... }
});

const generationId = data.generation_id;

// 2. Subscribe to real-time updates
const subscription = supabase
  .channel(`generation:${generationId}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'image_generations',
      filter: `id=eq.${generationId}`
    },
    (payload) => {
      const generation = payload.new;

      if (generation.status === 'completed') {
        // Fetch image record
        supabase
          .from('images')
          .select('*')
          .eq('generation_id', generationId)
          .single()
          .then(({ data: image }) => {
            // Show image: image.public_url
          });
      } else if (generation.status === 'failed') {
        // Show error: generation.error_message
      }

      // Update UI with current status
      console.log('Status:', generation.status);
    }
  )
  .subscribe();
```

## Step 7: Scaling Configuration

### 7.1 Increase Parallel Jobs

Edit `apps/mobile/supabase/functions/process-jobs/index.ts`:

```typescript
const MAX_PARALLEL_JOBS = 10;  // Increase from 3 to 10
```

Then redeploy:
```bash
npx supabase functions deploy process-jobs
```

### 7.2 Increase Cron Frequency

```sql
-- Every 30 seconds instead of 60
SELECT cron.unschedule('process-jobs-worker');

SELECT cron.schedule(
  'process-jobs-worker',
  '*/30 * * * * *',
  $$ ... $$
);
```

### 7.3 Resource Monitoring

Monitor these metrics:
- Edge Function invocation count
- Edge Function duration
- Database CPU usage
- Database connection count
- Storage bandwidth

Adjust scaling parameters based on:
- Replicate API rate limits
- Database capacity
- Budget constraints

## Rollback Plan

If issues arise, rollback to legacy system:

1. **Stop Cron Job**
   ```sql
   SELECT cron.unschedule('process-jobs-worker');
   ```

2. **Revert Client Code**
   Use direct calls to `generate-image` function

3. **Investigation**
   - Check Edge Function logs
   - Check job_queue table for errors
   - Check cron.job_run_details for cron issues

4. **Re-enable When Fixed**
   ```sql
   SELECT cron.schedule(...);
   ```

## Troubleshooting

### Jobs Not Being Processed

**Check 1**: Is cron job scheduled?
```sql
SELECT * FROM cron.job WHERE jobname = 'process-jobs-worker';
```

**Check 2**: Are cron jobs running?
```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-jobs-worker')
ORDER BY start_time DESC
LIMIT 5;
```

**Check 3**: Can cron make HTTP requests?
```sql
-- Test net.http_post
SELECT net.http_post(
  url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-jobs',
  body := '{}'::jsonb,
  headers := '{"Content-Type": "application/json"}'::jsonb
);
```

### High Error Rate

**Check**: What errors are occurring?
```sql
SELECT error_message, COUNT(*)
FROM job_queue
WHERE status = 'failed'
  AND created_at > now() - interval '24 hours'
GROUP BY error_message
ORDER BY count DESC;
```

Common fixes:
- Replicate API token invalid/expired
- Invalid model_id in payload
- Network issues (transient, will retry)

### Stuck in Processing

**Check**: Jobs stuck in 'processing'?
```sql
SELECT id, job_type, attempt_number, updated_at
FROM job_queue
WHERE status = 'processing'
  AND updated_at < now() - interval '15 minutes';
```

**Fix**: Reset to pending
```sql
UPDATE job_queue
SET status = 'pending', attempt_number = 0
WHERE status = 'processing'
  AND updated_at < now() - interval '15 minutes';
```

## Performance Benchmarks

Expected performance with default configuration:

- **Enqueue latency**: ~100ms
- **Queue throughput**: ~180 jobs/hour (3 parallel × 60 invocations)
- **FLUX Schnell generation**: ~30 seconds
- **SDXL generation**: ~60 seconds
- **Download/store**: ~2-5 seconds
- **Total (FLUX Schnell)**: ~35-40 seconds end-to-end

Scaled configuration (10 parallel, 30-second interval):
- **Queue throughput**: ~1,200 jobs/hour

## Maintenance

### Regular Cleanup

Clean up old completed jobs (optional):

```sql
-- Delete completed jobs older than 7 days
DELETE FROM job_queue
WHERE status = 'completed'
  AND completed_at < now() - interval '7 days';

-- Or archive them
CREATE TABLE job_queue_archive AS
SELECT * FROM job_queue
WHERE status IN ('completed', 'failed')
  AND completed_at < now() - interval '30 days';

DELETE FROM job_queue
WHERE id IN (SELECT id FROM job_queue_archive);
```

Set up as a cron job:
```sql
SELECT cron.schedule(
  'cleanup-old-jobs',
  '0 2 * * *',  -- Daily at 2 AM
  $$
  DELETE FROM job_queue
  WHERE status = 'completed'
    AND completed_at < now() - interval '7 days';
  $$
);
```

## Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Check `job_queue` table for error messages
3. Review ARCHITECTURE.md for system design
4. Check function-specific README.md files
