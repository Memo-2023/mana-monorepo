# Async Job Queue System - Deployment Guide

This guide covers the complete deployment process for the async job queue system that replaces synchronous image generation with a scalable, background processing solution.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Database Setup](#step-1-database-setup)
3. [Step 2: Edge Functions Deployment](#step-2-edge-functions-deployment)
4. [Step 3: pg_cron Setup](#step-3-pg_cron-setup)
5. [Step 4: Client Application Updates](#step-4-client-application-updates)
6. [Step 5: Testing](#step-5-testing)
7. [Step 6: Monitoring](#step-6-monitoring)
8. [Step 7: Rollback Plan](#step-7-rollback-plan)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting deployment, ensure you have:

- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Supabase project credentials configured
- [ ] Database access (service_role key)
- [ ] Replicate API token configured
- [ ] Git repository with latest code
- [ ] Access to Supabase Dashboard

### Environment Variables Required

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Replicate
REPLICATE_API_TOKEN=your_replicate_token
```

---

## Step 1: Database Setup

### 1.1 Connect to Your Project

```bash
# From project root
cd apps/mobile

# Link to your Supabase project
npx supabase link --project-ref <your-project-ref>
```

### 1.2 Run the Migration

```bash
# Apply the job queue migration
npx supabase db push

# Or apply specific migration file
npx supabase db push supabase/migrations/20251009_job_queue_system.sql
```

### 1.3 Verify Tables Were Created

Run this SQL in the Supabase SQL Editor:

```sql
-- Check if job_queue table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'job_queue';

-- Should return 14 rows with columns:
-- id, job_type, payload, status, attempts, max_attempts, scheduled_at,
-- started_at, completed_at, error_message, error_details, created_by,
-- priority, created_at, updated_at
```

### 1.4 Verify Functions Were Created

```sql
-- Check database functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('enqueue_job', 'claim_next_job', 'complete_job');

-- Should return 3 rows
```

### 1.5 Verify Views Were Created

```sql
-- Check monitoring views
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('queue_health', 'failed_jobs_recent', 'stuck_jobs');

-- Should return 3 rows with table_type = 'VIEW'
```

### 1.6 Verify RLS Policies

```sql
-- Check RLS policies on job_queue
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'job_queue';

-- Should return at least 2 policies:
-- 1. "Users can view their own jobs" (SELECT)
-- 2. "Service role has full access" (ALL)
```

### 1.7 Test Enqueue Function

```sql
-- Test enqueueing a job
SELECT enqueue_job(
  'generate-image'::text,
  '{"test": true, "prompt": "Test prompt"}'::jsonb,
  0,
  NOW(),
  3
) AS job_id;

-- Should return a UUID
-- Clean up test job
DELETE FROM job_queue WHERE payload->>'test' = 'true';
```

---

## Step 2: Edge Functions Deployment

### 2.1 Set Environment Variables

First, set required environment variables for Edge Functions:

```bash
# Set Replicate API token
npx supabase secrets set REPLICATE_API_TOKEN=your_replicate_token

# Verify secrets are set
npx supabase secrets list

# Should show:
# - REPLICATE_API_TOKEN (set)
# - SUPABASE_URL (automatically set)
# - SUPABASE_ANON_KEY (automatically set)
# - SUPABASE_SERVICE_ROLE_KEY (automatically set)
```

### 2.2 Deploy start-generation Function

This function receives generation requests and enqueues them.

```bash
npx supabase functions deploy start-generation

# Verify deployment
npx supabase functions list
```

**Test the function:**

```bash
# Get your anon key
ANON_KEY=$(npx supabase status | grep "anon key" | awk '{print $3}')

# Test the function
curl -i --location --request POST \
  "https://your-project.supabase.co/functions/v1/start-generation" \
  --header "Authorization: Bearer $ANON_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "prompt": "A test image",
    "model_id": "black-forest-labs/flux-schnell",
    "width": 512,
    "height": 512
  }'

# Should return:
# {
#   "success": true,
#   "generation_id": "uuid",
#   "job_id": "uuid",
#   "status": "queued"
# }
```

### 2.3 Deploy process-generation Function

This function handles the actual Replicate API calls.

```bash
npx supabase functions deploy process-generation

# Verify deployment
npx supabase functions list
```

### 2.4 Deploy process-jobs Worker Function

This is the main worker that processes the queue.

```bash
npx supabase functions deploy process-jobs

# Verify deployment
npx supabase functions list
```

**Test the worker manually:**

```bash
# Get your service role key
SERVICE_KEY=$(npx supabase status | grep "service_role key" | awk '{print $3}')

# Manually trigger worker
curl -i --location --request POST \
  "https://your-project.supabase.co/functions/v1/process-jobs" \
  --header "Authorization: Bearer $SERVICE_KEY" \
  --header "Content-Type: application/json"

# Should return:
# {
#   "success": true,
#   "processed": 1,
#   "errors": 0,
#   "message": "Processed 1 job(s) with 0 error(s)"
# }
```

### 2.5 Verify All Functions Are Deployed

```bash
npx supabase functions list

# Should show:
# ┌─────────────────────┬─────────┬───────────────────────┬─────────┐
# │ NAME                │ STATUS  │ VERSION               │ UPDATED │
# ├─────────────────────┼─────────┼───────────────────────┼─────────┤
# │ start-generation    │ ACTIVE  │ v1                    │ ...     │
# │ process-generation  │ ACTIVE  │ v1                    │ ...     │
# │ process-jobs        │ ACTIVE  │ v1                    │ ...     │
# └─────────────────────┴─────────┴───────────────────────┴─────────┘
```

---

## Step 3: pg_cron Setup

pg_cron is a PostgreSQL extension that runs scheduled jobs. We'll use it to trigger the worker every minute.

### 3.1 Enable pg_cron Extension

Run this SQL in the Supabase SQL Editor:

```sql
-- Enable pg_cron extension (requires superuser)
-- This should already be enabled on Supabase, but verify:
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Verify it's enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

### 3.2 Schedule the Worker Job

```sql
-- Schedule process-jobs to run every minute
SELECT cron.schedule(
  'process-job-queue',                    -- Job name
  '* * * * *',                            -- Every minute (cron expression)
  $$
    SELECT
      net.http_post(
        url := 'https://your-project.supabase.co/functions/v1/process-jobs',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
        ),
        body := '{}'::jsonb
      ) AS request_id;
  $$
);

-- IMPORTANT: Replace 'your-project.supabase.co' with your actual Supabase URL
```

### 3.3 Set Service Role Key in Database Settings

For pg_cron to authenticate with Edge Functions, we need to store the service role key:

```sql
-- Set service role key (replace with your actual key)
ALTER DATABASE postgres SET app.settings.service_role_key TO 'your-service-role-key';

-- Reload configuration
SELECT pg_reload_conf();
```

**Alternative: Use Supabase Dashboard**

1. Go to Settings > Database > Custom Postgres Configuration
2. Add: `app.settings.service_role_key = 'your-service-role-key'`
3. Save and restart database

### 3.4 Verify Cron Job Is Scheduled

```sql
-- List all scheduled cron jobs
SELECT * FROM cron.job;

-- Should show:
-- jobid | schedule  | command            | nodename | nodeport | database | username | active | jobname
-- 1     | * * * * * | SELECT net.http... | ...      | ...      | postgres | ...      | t      | process-job-queue
```

### 3.5 Check Cron Job Execution History

```sql
-- View recent cron job runs
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-job-queue')
ORDER BY start_time DESC
LIMIT 10;

-- status should be 'succeeded'
-- return_message should contain request_id
```

### 3.6 Monitor Cron Job Health

```sql
-- Check for failed cron runs
SELECT
  start_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-job-queue')
  AND status != 'succeeded'
ORDER BY start_time DESC
LIMIT 10;

-- Should return no rows (or investigate failures)
```

---

## Step 4: Client Application Updates

### 4.1 Web App (SvelteKit)

#### Update Web App Code

The web app already uses the queue system if you've been following along. Verify:

```bash
# Check if web app imports from @picture/shared/queue
grep -r "from '@picture/shared/queue'" apps/web/src/
```

**No changes needed if already using async API.**

### 4.2 Mobile App (React Native)

#### Update Mobile App Code

1. **Import the new async service:**

```typescript
// Before (old sync version)
import { generateImage } from '~/services/imageGeneration';

// After (new async version)
import { useImageGeneration } from '~/services/imageGenerationAsync';
```

2. **Update component to use the hook:**

```typescript
// Example: Update your generate screen
import { useImageGeneration } from '~/services/imageGenerationAsync';

export default function GenerateScreen() {
  const { status, progress, imageUrl, error, generate } = useImageGeneration();

  const handleGenerate = async () => {
    try {
      await generate({
        prompt: userPrompt,
        model_id: selectedModel,
        width: 1024,
        height: 1024
      });
    } catch (err) {
      console.error('Generation failed:', err);
    }
  };

  return (
    <View>
      {status === 'idle' && (
        <Button onPress={handleGenerate}>Generate</Button>
      )}
      {status !== 'idle' && status !== 'completed' && (
        <View>
          <Text>Status: {status}</Text>
          <ProgressBar progress={progress / 100} />
        </View>
      )}
      {status === 'completed' && imageUrl && (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}
```

### 4.3 Migration Path (Run Old + New in Parallel)

You can run both systems in parallel during migration:

**Option 1: Feature Flag**

```typescript
const USE_ASYNC_GENERATION = true; // Toggle this

if (USE_ASYNC_GENERATION) {
  // Use new async system
  const { generate } = useImageGeneration();
  await generate(params);
} else {
  // Use old sync system
  await generateImage(params);
}
```

**Option 2: Gradual Rollout**

```typescript
// Randomly assign users to new system (10% rollout)
const useAsyncForUser = Math.random() < 0.10;

if (useAsyncForUser) {
  // New async system
} else {
  // Old sync system
}
```

---

## Step 5: Testing

### 5.1 Test Database Functions

```sql
-- Test 1: Enqueue a job
DO $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Enqueue test job
  SELECT enqueue_job(
    'generate-image',
    jsonb_build_object(
      'prompt', 'Test image',
      'model_id', 'black-forest-labs/flux-schnell'
    ),
    0
  ) INTO v_job_id;

  RAISE NOTICE 'Job enqueued: %', v_job_id;

  -- Wait a moment for processing
  PERFORM pg_sleep(2);

  -- Check job status
  SELECT
    id,
    status,
    attempts,
    error_message
  FROM job_queue
  WHERE id = v_job_id;
END $$;
```

### 5.2 Test Edge Functions

#### Test start-generation

```bash
# Create a test generation
curl -X POST \
  "https://your-project.supabase.co/functions/v1/start-generation" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful test image",
    "model_id": "black-forest-labs/flux-schnell",
    "width": 512,
    "height": 512
  }'

# Save the generation_id from response
```

#### Test process-jobs Worker

```bash
# Trigger worker manually
curl -X POST \
  "https://your-project.supabase.co/functions/v1/process-jobs" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# Check response:
# - processed: should be > 0
# - errors: should be 0
```

### 5.3 Test End-to-End Generation

**From Web App:**

```typescript
// In browser console or test file
import { startImageGeneration, subscribeToGeneration } from '@picture/shared/queue';
import { supabase } from '$lib/supabase';

// Start generation
const { generationId, jobId } = await startImageGeneration(supabase, {
  prompt: 'A sunset over mountains',
  model_id: 'black-forest-labs/flux-schnell'
});

console.log('Generation started:', { generationId, jobId });

// Subscribe to updates
subscribeToGeneration(supabase, generationId, (generation) => {
  console.log('Status:', generation.status);
  if (generation.status === 'completed') {
    console.log('Image ready!');
  }
});
```

**From Mobile App:**

```typescript
// In your app
const { generate } = useImageGeneration();

await generate({
  prompt: 'A test image',
  model_id: 'black-forest-labs/flux-schnell'
});

// Watch the console for status updates
```

### 5.4 Test Realtime Subscriptions

Open Supabase Dashboard > Database > Realtime and verify:

- [ ] Realtime is enabled for `job_queue` table
- [ ] Realtime is enabled for `image_generations` table

**Enable if needed:**

```sql
-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE job_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE image_generations;
```

### 5.5 Test Error Handling

```sql
-- Create a job with invalid payload to test error handling
SELECT enqueue_job(
  'generate-image',
  jsonb_build_object(
    'prompt', 'Test',
    'model_id', 'invalid-model-id'
  ),
  0
);

-- Wait for processing (about 1 minute)
-- Then check failed jobs
SELECT * FROM failed_jobs_recent;
```

### 5.6 Test Rate Limiting

```sql
-- Check rate limits for a user
SELECT get_user_limits('user-uuid-here');

-- Should return:
-- {
--   "can_generate": true,
--   "daily_limit": 100,
--   "daily_used": 5,
--   "hourly_limit": 20,
--   "hourly_used": 1
-- }
```

---

## Step 6: Monitoring

### 6.1 Queue Health Dashboard

```sql
-- Real-time queue health
SELECT * FROM queue_health
ORDER BY job_type, status;

-- Key metrics to watch:
-- - pending count (should be low, < 100)
-- - processing count (should match worker capacity)
-- - failed count (should be 0 or investigate)
-- - avg_duration_seconds (should be reasonable, < 120s)
```

### 6.2 Failed Jobs Monitoring

```sql
-- Recent failures (last 24 hours)
SELECT
  id,
  job_type,
  payload->>'generation_id' as generation_id,
  error_message,
  attempts,
  created_at,
  completed_at
FROM failed_jobs_recent
ORDER BY created_at DESC
LIMIT 20;

-- Group failures by error type
SELECT
  error_message,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM failed_jobs_recent
GROUP BY error_message
ORDER BY count DESC;
```

### 6.3 Stuck Jobs Monitoring

```sql
-- Jobs stuck in processing (> 10 minutes)
SELECT * FROM stuck_jobs;

-- If found, investigate or reset:
UPDATE job_queue
SET
  status = 'pending',
  started_at = NULL,
  updated_at = NOW()
WHERE id IN (SELECT id FROM stuck_jobs);
```

### 6.4 Performance Monitoring

```sql
-- Average generation time by model
SELECT
  payload->>'model_id' as model,
  COUNT(*) as total_generations,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_time_seconds,
  MIN(EXTRACT(EPOCH FROM (completed_at - created_at))) as min_time_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - created_at))) as max_time_seconds
FROM job_queue
WHERE job_type = 'generate-image'
  AND status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY payload->>'model_id'
ORDER BY avg_time_seconds DESC;
```

### 6.5 System Load Monitoring

```sql
-- Queue throughput (jobs/hour)
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_duration
FROM job_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### 6.6 Set Up Alerts

Create alerts for critical conditions:

```sql
-- Alert if too many pending jobs (> 100)
SELECT COUNT(*) as pending_count
FROM job_queue
WHERE status = 'pending'
HAVING COUNT(*) > 100;

-- Alert if high failure rate (> 10% in last hour)
SELECT
  COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) as failure_rate
FROM job_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
HAVING COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / COUNT(*) > 10;

-- Alert if worker is stuck (no completions in 5 minutes)
SELECT MAX(completed_at) as last_completion
FROM job_queue
WHERE status = 'completed'
HAVING MAX(completed_at) < NOW() - INTERVAL '5 minutes';
```

**Integrate with monitoring service:**

You can use Supabase Webhooks to trigger alerts:

1. Go to Database > Webhooks
2. Create webhook for `job_queue` table
3. Filter: `status = 'failed'`
4. Send to your monitoring endpoint (PagerDuty, Slack, etc.)

---

## Step 7: Rollback Plan

### 7.1 Disable pg_cron Worker

If you need to stop processing immediately:

```sql
-- Unschedule the worker
SELECT cron.unschedule('process-job-queue');

-- Verify it's unscheduled
SELECT * FROM cron.job WHERE jobname = 'process-job-queue';
-- Should return no rows
```

### 7.2 Revert Client Code

```bash
# Revert to previous commit
git revert HEAD

# Or manually switch back to old generation service
# In your components, change:
# import { useImageGeneration } from '~/services/imageGenerationAsync';
# to:
# import { generateImage } from '~/services/imageGeneration';
```

### 7.3 Keep Queue Tables (Don't Drop)

**DO NOT drop the queue tables** - they contain valuable job history.

Instead, just stop processing:

```sql
-- Mark all pending jobs as cancelled
UPDATE job_queue
SET status = 'cancelled', updated_at = NOW()
WHERE status IN ('pending', 'processing');
```

### 7.4 Re-enable Old Edge Function

If you had an old `generate-image` function:

```bash
# Redeploy old version from git history
git checkout <old-commit> -- supabase/functions/generate-image
npx supabase functions deploy generate-image
```

### 7.5 Rollback Checklist

When rolling back, complete these steps in order:

- [ ] Disable pg_cron worker
- [ ] Update client code to use old generation service
- [ ] Cancel pending jobs in queue
- [ ] Verify old Edge Function is working
- [ ] Notify users of any ongoing generations that were cancelled
- [ ] Monitor logs for errors
- [ ] Investigate root cause before attempting re-deployment

### 7.6 Data Preservation

Even after rollback, preserve queue data for analysis:

```sql
-- Export failed jobs for analysis
COPY (
  SELECT * FROM failed_jobs_recent
) TO '/tmp/failed_jobs.csv' CSV HEADER;

-- Export queue health metrics
COPY (
  SELECT * FROM queue_health
) TO '/tmp/queue_health.csv' CSV HEADER;
```

---

## Troubleshooting

### Issue: Jobs Stay in Pending Status

**Symptoms:**
- Jobs are created but never processed
- `queue_health` shows high pending count

**Possible Causes:**

1. **Worker not running**
   ```sql
   -- Check if pg_cron job exists
   SELECT * FROM cron.job WHERE jobname = 'process-job-queue';

   -- Check recent runs
   SELECT * FROM cron.job_run_details
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-job-queue')
   ORDER BY start_time DESC LIMIT 5;
   ```

2. **Service role key not set**
   ```sql
   -- Verify setting
   SHOW app.settings.service_role_key;
   -- Should return your key, not empty
   ```

3. **Edge Function not deployed**
   ```bash
   npx supabase functions list
   # Should show process-jobs as ACTIVE
   ```

**Solution:**
- Verify pg_cron is scheduled (Step 3.2)
- Set service role key (Step 3.3)
- Redeploy Edge Functions (Step 2.4)

---

### Issue: Jobs Fail Immediately

**Symptoms:**
- Jobs move from pending to failed quickly
- Error message in `failed_jobs_recent`

**Diagnosis:**

```sql
-- Check error messages
SELECT
  error_message,
  error_details,
  payload
FROM failed_jobs_recent
LIMIT 5;
```

**Common Errors:**

1. **"Replicate API token not configured"**
   ```bash
   # Set the secret
   npx supabase secrets set REPLICATE_API_TOKEN=your_token
   ```

2. **"Model not found"**
   - Check `model_id` in payload
   - Verify model exists in `models` table

3. **"User not authenticated"**
   - Check `created_by` field in job
   - Verify user still exists

---

### Issue: Stuck Jobs (Processing Forever)

**Symptoms:**
- Jobs in processing status for > 10 minutes
- `stuck_jobs` view returns rows

**Solution:**

```sql
-- Reset stuck jobs to pending
UPDATE job_queue
SET
  status = 'pending',
  started_at = NULL,
  attempts = attempts,  -- Don't increment
  updated_at = NOW()
WHERE id IN (SELECT id FROM stuck_jobs);

-- If consistently stuck, may indicate:
-- - Replicate API timeout
-- - Network issues
-- - Invalid model parameters
```

---

### Issue: High Failure Rate

**Symptoms:**
- Many jobs failing repeatedly
- Failure rate > 10%

**Diagnosis:**

```sql
-- Identify failure patterns
SELECT
  error_message,
  COUNT(*) as count,
  COUNT(DISTINCT payload->>'model_id') as affected_models,
  COUNT(DISTINCT created_by) as affected_users
FROM failed_jobs_recent
GROUP BY error_message
ORDER BY count DESC;
```

**Common Solutions:**

1. **Replicate rate limits**
   - Slow down job processing
   - Increase delays between retries

2. **Invalid model parameters**
   - Update model default values in database
   - Add validation before enqueuing

3. **Insufficient credits**
   - Check Replicate account balance
   - Notify users of credit issues

---

### Issue: Realtime Not Working

**Symptoms:**
- Client doesn't receive updates
- Status stays on "queued" forever

**Diagnosis:**

1. **Check Realtime is enabled**
   ```sql
   -- Check publication
   SELECT * FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';

   -- Should include:
   -- - job_queue
   -- - image_generations
   ```

2. **Enable if missing**
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE job_queue;
   ALTER PUBLICATION supabase_realtime ADD TABLE image_generations;
   ```

3. **Check client subscription**
   ```typescript
   // In browser console
   supabase
     .channel('test')
     .on('postgres_changes',
       { event: '*', schema: 'public', table: 'job_queue' },
       (payload) => console.log('Change:', payload)
     )
     .subscribe(status => console.log('Status:', status));

   // Should log: Status: SUBSCRIBED
   ```

---

### Issue: Duplicate Jobs Created

**Symptoms:**
- Multiple jobs for same generation_id
- Users report multiple images generated

**Cause:**
- Client retrying on timeout
- Double-click on generate button

**Prevention:**

```typescript
// Debounce generate button
const [isGenerating, setIsGenerating] = useState(false);

const handleGenerate = async () => {
  if (isGenerating) return; // Prevent duplicate

  setIsGenerating(true);
  try {
    await generate(params);
  } finally {
    setIsGenerating(false);
  }
};
```

**Cleanup:**

```sql
-- Find duplicate jobs (same generation_id)
SELECT
  payload->>'generation_id' as generation_id,
  COUNT(*) as job_count
FROM job_queue
WHERE job_type = 'generate-image'
GROUP BY payload->>'generation_id'
HAVING COUNT(*) > 1;

-- Cancel duplicates (keep oldest)
DELETE FROM job_queue
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY payload->>'generation_id'
        ORDER BY created_at ASC
      ) as rn
    FROM job_queue
    WHERE job_type = 'generate-image'
  ) sub
  WHERE rn > 1
);
```

---

### Issue: Performance Degradation

**Symptoms:**
- Jobs taking longer to process
- Queue growing over time

**Diagnosis:**

```sql
-- Check queue size trend
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))) as avg_time
FROM job_queue
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

**Solutions:**

1. **Increase worker frequency**
   ```sql
   -- Run worker every 30 seconds instead of 1 minute
   SELECT cron.unschedule('process-job-queue');
   SELECT cron.schedule(
     'process-job-queue',
     '*/30 * * * * *',  -- Every 30 seconds
     $$ ... $$
   );
   ```

2. **Process more jobs in parallel**
   ```typescript
   // In process-jobs/index.ts
   const MAX_PARALLEL_JOBS = 5; // Increase from 3
   ```

3. **Add more workers**
   ```sql
   -- Schedule a second worker with offset
   SELECT cron.schedule(
     'process-job-queue-2',
     '30 * * * * *',  -- Offset by 30 seconds
     $$ ... $$
   );
   ```

---

## Additional Resources

### Useful SQL Queries

```sql
-- Queue summary
SELECT
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM job_queue
GROUP BY status;

-- User generation history
SELECT
  u.email,
  COUNT(*) as total_generations,
  COUNT(*) FILTER (WHERE jq.status = 'completed') as completed,
  COUNT(*) FILTER (WHERE jq.status = 'failed') as failed
FROM job_queue jq
JOIN auth.users u ON u.id = jq.created_by
WHERE jq.job_type = 'generate-image'
  AND jq.created_at > NOW() - INTERVAL '7 days'
GROUP BY u.email
ORDER BY total_generations DESC;

-- Most used models
SELECT
  payload->>'model_id' as model,
  COUNT(*) as usage_count,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_time
FROM job_queue
WHERE job_type = 'generate-image'
  AND status = 'completed'
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY model
ORDER BY usage_count DESC;
```

### Log Locations

- **Edge Function logs**: Supabase Dashboard > Edge Functions > [function-name] > Logs
- **Database logs**: Supabase Dashboard > Database > Logs
- **Cron logs**: Query `cron.job_run_details` table
- **Client logs**: Browser console / Mobile device logs

### Support Contacts

- **Supabase Support**: https://supabase.com/support
- **Replicate Support**: https://replicate.com/support
- **Project Documentation**: See `/docs` folder

---

## Success Checklist

After deployment, verify:

- [ ] Database migration applied successfully
- [ ] All database functions and views created
- [ ] RLS policies are active
- [ ] All Edge Functions deployed and active
- [ ] pg_cron scheduled and running
- [ ] Service role key configured
- [ ] Client apps updated and tested
- [ ] Realtime subscriptions working
- [ ] End-to-end generation test passed
- [ ] Monitoring queries return expected results
- [ ] No failed jobs in queue
- [ ] No stuck jobs in processing
- [ ] Team trained on monitoring and troubleshooting

---

## Maintenance Schedule

### Daily
- Check `failed_jobs_recent` for errors
- Monitor queue size and throughput
- Review cron job execution logs

### Weekly
- Analyze performance metrics
- Review and clean up old completed jobs
- Update model configurations as needed

### Monthly
- Review rate limiting policies
- Optimize worker configuration
- Plan capacity for growth

---

**Deployment Status**: ⬜ Not Started | ⏳ In Progress | ✅ Completed

Mark your progress as you go!

---

For questions or issues, contact the development team or open an issue in the project repository.
