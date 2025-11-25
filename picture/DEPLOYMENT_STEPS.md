# 🚀 DEPLOYMENT - Job Queue System

**Status:** In Progress
**Started:** 2025-10-09

---

## ✅ Step 1: Database Migration

### Option A: Via Supabase Dashboard (EMPFOHLEN für Production)

1. **Öffne Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/mjuvnnjxwfwlmxjsgkqu
   ```

2. **Navigiere zu:** SQL Editor (linkes Menü)

3. **Kopiere die Migration:**
   - Datei: `apps/mobile/supabase/migrations/20251009_job_queue_system.sql`
   - Kompletten Inhalt kopieren

4. **Führe aus:**
   - New Query → Paste → Run
   - Warte auf Success Message

5. **Verifiziere:**
   ```sql
   -- Check tables
   SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_queue';

   -- Check functions
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public' AND routine_name IN ('enqueue_job', 'claim_next_job', 'complete_job');

   -- Check views
   SELECT viewname FROM pg_views WHERE schemaname = 'public'
   AND viewname IN ('queue_health', 'failed_jobs_recent', 'stuck_jobs');
   ```

### Option B: Via CLI (Local → Remote)

```bash
# WARNUNG: Funktioniert nur wenn lokale DB version matches
# (haben DB version 17 vs 15 Mismatch)

# Falls du trotzdem CLI nutzen willst:
cd apps/mobile
npx supabase db push
```

---

## ⏳ Step 2: Deploy Edge Functions

### 2.1 Deploy start-generation

```bash
cd apps/mobile
npx supabase functions deploy start-generation --project-ref mjuvnnjxwfwlmxjsgkqu
```

**Expected Output:**
```
✓ Deployed Function start-generation
```

### 2.2 Deploy process-generation

```bash
npx supabase functions deploy process-generation --project-ref mjuvnnjxwfwlmxjsgkqu
```

### 2.3 Deploy process-jobs

```bash
npx supabase functions deploy process-jobs --project-ref mjuvnnjxwfwlmxjsgkqu
```

---

## 🔐 Step 3: Set Environment Secrets

```bash
# Replicate API Token (KRITISCH!)
npx supabase secrets set REPLICATE_API_TOKEN=r8_... --project-ref mjuvnnjxwfwlmxjsgkqu

# Verify secrets
npx supabase secrets list --project-ref mjuvnnjxwfwlmxjsgkqu
```

**Secrets needed:**
- `REPLICATE_API_TOKEN` - Your Replicate API key
- `SUPABASE_URL` - Auto-set
- `SUPABASE_ANON_KEY` - Auto-set
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set

---

## ⏰ Step 4: Setup pg_cron Worker

### 4.1 Enable pg_cron Extension

**Via SQL Editor:**
```sql
-- Enable extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;
```

### 4.2 Get Service Role Key

1. Gehe zu: **Settings → API** im Supabase Dashboard
2. Kopiere: `service_role` key (secret!)
3. Speichere sicher (brauchen wir gleich)

### 4.3 Schedule Worker Job

**WICHTIG:** Ersetze `YOUR_SERVICE_ROLE_KEY` mit dem echten Key!

```sql
-- Schedule process-jobs to run every minute
SELECT cron.schedule(
  'process-job-queue',
  '* * * * *', -- Every minute
  $$
    SELECT net.http_post(
      url := 'https://mjuvnnjxwfwlmxjsgkqu.supabase.co/functions/v1/process-jobs',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      ),
      body := '{}'::jsonb
    );
  $$
);
```

### 4.4 Verify Cron Job

```sql
-- Check scheduled jobs
SELECT * FROM cron.job;

-- Check execution history
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;
```

---

## 🧪 Step 5: Test the System

### 5.1 Test Database Functions

```sql
-- Test: Enqueue a test job
SELECT enqueue_job(
  'generate-image',
  '{"test": true, "prompt": "Test deployment"}'::jsonb,
  0
);
-- Should return: UUID of job

-- Check if job was created
SELECT * FROM job_queue ORDER BY created_at DESC LIMIT 1;

-- Test: Claim the job (simulates worker)
SELECT * FROM claim_next_job();

-- Test: Complete the job
-- (Use the job ID from above)
SELECT complete_job('job-id-here', NULL, NULL);
```

### 5.2 Test Edge Functions

#### Test start-generation:
```bash
curl -X POST \
  https://mjuvnnjxwfwlmxjsgkqu.supabase.co/functions/v1/start-generation \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "A beautiful sunset",
    "model_id": "black-forest-labs/flux-schnell"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "generation_id": "uuid-here",
  "job_id": "uuid-here",
  "status": "queued"
}
```

#### Test process-jobs (manual trigger):
```bash
curl -X POST \
  https://mjuvnnjxwfwlmxjsgkqu.supabase.co/functions/v1/process-jobs \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

### 5.3 Monitor Queue

```sql
-- Queue health
SELECT * FROM queue_health;

-- Pending jobs
SELECT COUNT(*) FROM job_queue WHERE status = 'pending';

-- Failed jobs (last 24h)
SELECT * FROM failed_jobs_recent;
```

---

## 📊 Step 6: Monitoring

### Key Metrics to Watch:

```sql
-- 1. Queue Depth (should stay low)
SELECT job_type, status, COUNT(*)
FROM job_queue
GROUP BY job_type, status;

-- 2. Average Processing Time
SELECT
  job_type,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
FROM job_queue
WHERE status = 'completed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY job_type;

-- 3. Success Rate
SELECT
  job_type,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
  ROUND(100.0 * COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*), 2) as success_rate
FROM job_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY job_type;

-- 4. Stuck Jobs (processing > 10 min)
SELECT * FROM stuck_jobs;
```

---

## ✅ Deployment Checklist

- [ ] Database migration applied successfully
- [ ] `job_queue` table created
- [ ] Database functions created (enqueue_job, claim_next_job, complete_job)
- [ ] Monitoring views created (queue_health, failed_jobs_recent, stuck_jobs)
- [ ] start-generation function deployed
- [ ] process-generation function deployed
- [ ] process-jobs function deployed
- [ ] REPLICATE_API_TOKEN secret set
- [ ] pg_cron extension enabled
- [ ] Cron job scheduled (process-job-queue)
- [ ] Test job completed successfully
- [ ] Monitoring queries working

---

## 🐛 Troubleshooting

### Issue: Jobs stuck in pending

**Check:**
```sql
-- Is cron running?
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;

-- Is process-jobs working?
SELECT * FROM job_queue WHERE status = 'processing';
```

**Fix:**
- Manually trigger: `curl ... /process-jobs`
- Check service role key is correct
- Check Edge Function logs

### Issue: Jobs failing

**Check:**
```sql
SELECT error_message FROM failed_jobs_recent;
```

**Common Causes:**
- Missing REPLICATE_API_TOKEN
- Invalid model_id
- Replicate API down

---

## 📝 Notes

**Project:**
- ID: mjuvnnjxwfwlmxjsgkqu
- URL: https://mjuvnnjxwfwlmxjsgkqu.supabase.co
- Region: EU Central

**Important URLs:**
- Dashboard: https://supabase.com/dashboard/project/mjuvnnjxwfwlmxjsgkqu
- SQL Editor: https://supabase.com/dashboard/project/mjuvnnjxwfwlmxjsgkqu/sql
- Functions: https://supabase.com/dashboard/project/mjuvnnjxwfwlmxjsgkqu/functions
- Logs: https://supabase.com/dashboard/project/mjuvnnjxwfwlmxjsgkqu/logs/explorer

---

**Last Updated:** 2025-10-09
**Status:** Ready for deployment
