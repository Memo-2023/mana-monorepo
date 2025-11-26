-- ============================================================================
-- SETUP pg_cron WORKER for Job Queue Processing
-- ============================================================================
--
-- Führe dieses SQL-Statement im Supabase Dashboard SQL Editor aus:
-- https://supabase.com/dashboard/project/mjuvnnjxwfwlmxjsgkqu/sql
--
-- Dieses Statement erstellt einen Cron-Job, der jede Minute die
-- process-jobs Edge Function aufruft, um Jobs aus der Queue zu verarbeiten.
-- ============================================================================

-- Schedule process-jobs to run every minute
SELECT cron.schedule(
  'process-job-queue',
  '* * * * *', -- Every minute
  $$
    SELECT net.http_post(
      url := 'https://mjuvnnjxwfwlmxjsgkqu.supabase.co/functions/v1/process-jobs',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdXZubmp4d2Z3bG14anNna3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjI1ODk1NSwiZXhwIjoyMDcxODM0OTU1fQ.c_30KdU1wD94r-w9Y_Vgg_FYRHJiPT8Peiv3SQJbhZg'
      ),
      body := '{}'::jsonb
    );
  $$
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Nach dem Ausführen, prüfe ob der Cron-Job erfolgreich erstellt wurde:

-- 1. Check if cron job exists
SELECT
  jobid,
  jobname,
  schedule,
  active,
  nodename
FROM cron.job
WHERE jobname = 'process-job-queue';

-- 2. Wait 1-2 minutes, then check execution history
SELECT
  jobid,
  runid,
  job_pid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'process-job-queue')
ORDER BY start_time DESC
LIMIT 10;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If you need to delete and recreate the cron job:
-- SELECT cron.unschedule('process-job-queue');
-- Then run the schedule command again

-- If the job is failing, check the Edge Function logs:
-- https://supabase.com/dashboard/project/mjuvnnjxwfwlmxjsgkqu/logs/edge-functions
