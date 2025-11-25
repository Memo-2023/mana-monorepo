-- VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify the migration was successful

-- ============================================================================
-- 1. CHECK TABLES
-- ============================================================================

SELECT 'job_queue table' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_queue'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ============================================================================
-- 2. CHECK FUNCTIONS
-- ============================================================================

SELECT 'enqueue_job function' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'enqueue_job'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status

UNION ALL

SELECT 'claim_next_job function' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'claim_next_job'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status

UNION ALL

SELECT 'complete_job function' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'complete_job'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ============================================================================
-- 3. CHECK VIEWS
-- ============================================================================

SELECT 'queue_health view' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'queue_health'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status

UNION ALL

SELECT 'failed_jobs_recent view' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'failed_jobs_recent'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status

UNION ALL

SELECT 'stuck_jobs view' as check_name,
  CASE WHEN EXISTS (
    SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'stuck_jobs'
  ) THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- ============================================================================
-- 4. CHECK INDEXES
-- ============================================================================

SELECT
  'Indexes on job_queue' as check_name,
  COUNT(*)::text || ' indexes created' as status
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'job_queue';

-- ============================================================================
-- 5. TEST ENQUEUE FUNCTION
-- ============================================================================

-- Create a test job
DO $$
DECLARE
  v_job_id UUID;
BEGIN
  SELECT enqueue_job(
    'generate-image',
    '{"test": true, "prompt": "Database verification test"}'::JSONB,
    0
  ) INTO v_job_id;

  RAISE NOTICE '✅ Test job created: %', v_job_id;

  -- Clean up test job
  DELETE FROM job_queue WHERE id = v_job_id;
  RAISE NOTICE '✅ Test job cleaned up';
END $$;

-- ============================================================================
-- 6. FINAL STATUS
-- ============================================================================

SELECT
  '🎉 DATABASE SETUP COMPLETE!' as message,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_queue') as tables_created,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('enqueue_job', 'claim_next_job', 'complete_job')) as functions_created,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND viewname IN ('queue_health', 'failed_jobs_recent', 'stuck_jobs')) as views_created;
