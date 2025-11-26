# Quick Reference - Image Generation Queue System

## Quick Commands

### Deploy Functions
```bash
cd apps/mobile
npx supabase functions deploy start-generation
npx supabase functions deploy process-generation
npx supabase functions deploy process-jobs
```

### Set Secrets
```bash
npx supabase secrets set REPLICATE_API_TOKEN=your_token_here
npx supabase secrets list
```

### Test Functions
```bash
# Test start-generation
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/start-generation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","model_id":"black-forest-labs/flux-schnell","width":1024,"height":1024,"num_inference_steps":4,"guidance_scale":7.5}'

# Manually trigger worker
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/process-jobs \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Quick SQL Queries

### Monitor Queue
```sql
-- Queue overview
SELECT status, COUNT(*) FROM job_queue GROUP BY status;

-- Recent jobs
SELECT id, job_type, status, created_at, completed_at
FROM job_queue
ORDER BY created_at DESC
LIMIT 20;

-- Failed jobs with errors
SELECT id, job_type, error_message, attempt_number, created_at
FROM job_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;

-- Jobs in progress
SELECT id, job_type, attempt_number, updated_at,
       EXTRACT(EPOCH FROM (now() - updated_at))::INTEGER as seconds_in_processing
FROM job_queue
WHERE status = 'processing'
ORDER BY updated_at;
```

### Monitor Generations
```sql
-- Recent generations
SELECT id, prompt, status, created_at, completed_at,
       generation_time_seconds
FROM image_generations
ORDER BY created_at DESC
LIMIT 20;

-- Status breakdown
SELECT status, COUNT(*) FROM image_generations GROUP BY status;

-- Failed generations
SELECT id, prompt, error_message, created_at
FROM image_generations
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

### Monitor Cron
```sql
-- List cron jobs
SELECT * FROM cron.job;

-- Recent cron runs
SELECT jobid, start_time, end_time, status, return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-jobs-worker')
ORDER BY start_time DESC
LIMIT 20;
```

## Quick Fixes

### Reset Stuck Jobs
```sql
-- Reset jobs stuck in processing (over 15 minutes)
UPDATE job_queue
SET status = 'pending', attempt_number = 0
WHERE status = 'processing'
  AND updated_at < now() - interval '15 minutes';
```

### Reset Failed Job
```sql
-- Reset a specific failed job to retry
UPDATE job_queue
SET status = 'pending', attempt_number = 0, error_message = NULL
WHERE id = 'JOB_UUID_HERE';
```

### Clean Old Jobs
```sql
-- Delete completed jobs older than 7 days
DELETE FROM job_queue
WHERE status = 'completed'
  AND completed_at < now() - interval '7 days';
```

### Re-schedule Cron Job
```sql
-- Remove existing
SELECT cron.unschedule('process-jobs-worker');

-- Re-add (every minute)
SELECT cron.schedule(
  'process-jobs-worker',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-jobs',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb
  ) as request_id;
  $$
);
```

## Client Code Snippets

### Submit Generation (React Native/Web)
```typescript
import { supabase } from '@picture/shared';

async function generateImage(prompt: string, modelId: string) {
  const { data, error } = await supabase.functions.invoke('start-generation', {
    body: {
      prompt,
      model_id: modelId,
      width: 1024,
      height: 1024,
      num_inference_steps: 4,
      guidance_scale: 7.5
    }
  });

  if (error) throw error;

  return data.generation_id;
}
```

### Poll for Completion
```typescript
async function pollGeneration(generationId: string) {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      const { data: generation } = await supabase
        .from('image_generations')
        .select('*, images(*)')
        .eq('id', generationId)
        .single();

      if (generation.status === 'completed') {
        clearInterval(interval);
        resolve(generation.images[0]);
      } else if (generation.status === 'failed') {
        clearInterval(interval);
        reject(new Error(generation.error_message));
      }
    }, 2000);
  });
}
```

### Real-Time Subscription
```typescript
function subscribeToGeneration(
  generationId: string,
  onUpdate: (status: string) => void,
  onComplete: (imageUrl: string) => void,
  onError: (error: string) => void
) {
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
      async (payload) => {
        const generation = payload.new;
        onUpdate(generation.status);

        if (generation.status === 'completed') {
          const { data: image } = await supabase
            .from('images')
            .select('public_url')
            .eq('generation_id', generationId)
            .single();

          onComplete(image.public_url);
          subscription.unsubscribe();
        } else if (generation.status === 'failed') {
          onError(generation.error_message);
          subscription.unsubscribe();
        }
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}
```

## Configuration Values

### Default Settings
```typescript
// process-jobs/index.ts
const MAX_PARALLEL_JOBS = 3;      // Jobs processed per invocation
const JOB_TIMEOUT_MS = 600000;    // 10 minutes per job

// Cron schedule
'* * * * *'                       // Every minute

// Job defaults
max_attempts: 3                   // Retry up to 3 times
priority: 0                       // Default priority
```

### Scaling Settings
```typescript
// For higher throughput
const MAX_PARALLEL_JOBS = 10;     // Process 10 jobs at once
'*/30 * * * * *'                  // Every 30 seconds

// Result: ~1,200 jobs/hour
```

## Status Values

### Generation Status
- `pending` - Just created
- `queued` - Job enqueued
- `processing` - Replicate API called
- `downloading` - Image being downloaded
- `completed` - Done successfully
- `failed` - Error occurred

### Job Status
- `pending` - Waiting to be processed
- `processing` - Currently being worked on
- `completed` - Successfully finished
- `failed` - Failed after max attempts

## Model IDs Reference

### Fast Models (< 5 seconds)
```typescript
'black-forest-labs/flux-schnell'          // FLUX Schnell (4 steps)
'bytedance/sdxl-lightning-4step'          // SDXL Lightning
```

### Quality Models (30-60 seconds)
```typescript
'black-forest-labs/flux-dev'              // FLUX Dev
'black-forest-labs/flux-1.1-pro'          // FLUX 1.1 Pro
'stability-ai/sdxl'                       // SDXL
'ideogram-ai/ideogram-v3-turbo'          // Ideogram V3
'google-deepmind/imagen-4-fast'          // Imagen 4
```

### Specialized Models
```typescript
'fofr/recraft-v3-svg'                    // Vector SVG output
'stability-ai/stable-diffusion-3.5-large' // SD 3.5
'qwen/qwen-image'                        // Qwen Image
```

## File Structure
```
apps/mobile/supabase/functions/
├── ARCHITECTURE.md           # System design overview
├── DEPLOYMENT_GUIDE.md       # Step-by-step deployment
├── QUICK_REFERENCE.md        # This file
├── start-generation/
│   ├── index.ts             # Entry point function
│   └── README.md
├── process-jobs/
│   ├── index.ts             # Background worker
│   └── README.md
├── process-generation/
│   ├── index.ts             # Replicate API handler
│   └── README.md
└── generate-image/          # Legacy function (keep for now)
    └── index.ts
```

## Monitoring Checklist

Daily:
- [ ] Check queue depth (should be < 10)
- [ ] Check error rate (should be < 5%)
- [ ] Check cron job runs (should run every minute)
- [ ] Check stuck jobs (should be 0)

Weekly:
- [ ] Review failed jobs for patterns
- [ ] Clean up old completed jobs
- [ ] Check Edge Function logs for errors
- [ ] Verify storage bucket size

Monthly:
- [ ] Review performance metrics
- [ ] Optimize queue settings if needed
- [ ] Update models if new versions available

## Key Metrics Targets

- **Queue depth**: < 10 pending jobs
- **Processing time**: < 60 seconds average
- **Error rate**: < 5%
- **Stuck jobs**: 0
- **Throughput**: ~180 jobs/hour (default config)

## Common Error Messages

**"Replicate API token not configured"**
- Fix: `npx supabase secrets set REPLICATE_API_TOKEN=...`

**"No authorization header"**
- Fix: Include `Authorization: Bearer YOUR_ANON_KEY` in request

**"Replicate API error (401)"**
- Fix: Token invalid/expired, generate new token

**"Generation timeout after 10 minutes"**
- Model too slow or Replicate issue
- Check Replicate status page

**"Failed to download generated image"**
- Transient network issue
- Will retry automatically

## Support Links

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Replicate API Docs](https://replicate.com/docs)
- [pg_cron GitHub](https://github.com/citusdata/pg_cron)

## Version Info

- Supabase CLI: `supabase --version`
- Node/Deno: Edge Functions run on Deno runtime
- PostgreSQL Extensions: pg_cron, http
