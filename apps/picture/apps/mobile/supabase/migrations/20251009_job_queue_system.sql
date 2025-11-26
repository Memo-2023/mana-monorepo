-- Migration: Add Job Queue System for Async Image Generation
-- Created: 2025-10-09
-- Purpose: Replace synchronous Edge Function with async queue system

-- ============================================================================
-- 1. CREATE JOB QUEUE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job identification
  job_type TEXT NOT NULL CHECK (job_type IN (
    'generate-image',
    'download-image',
    'process-webhook',
    'cleanup-storage'
  )),

  -- Job data
  payload JSONB NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
  )),

  -- Retry logic
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,

  -- Scheduling
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority INTEGER DEFAULT 0, -- Higher = more important

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_job_queue_status_scheduled ON job_queue(status, scheduled_at)
  WHERE status IN ('pending', 'processing');

CREATE INDEX idx_job_queue_type_status ON job_queue(job_type, status);

CREATE INDEX idx_job_queue_created_by ON job_queue(created_by);

CREATE INDEX idx_job_queue_priority ON job_queue(priority DESC, created_at ASC)
  WHERE status = 'pending';

-- ============================================================================
-- 2. CREATE FUNCTION TO CLAIM NEXT JOB (with locking)
-- ============================================================================

CREATE OR REPLACE FUNCTION claim_next_job(
  p_job_types TEXT[] DEFAULT NULL
)
RETURNS SETOF job_queue
LANGUAGE plpgsql
AS $$
DECLARE
  v_job job_queue;
BEGIN
  -- Find and lock the next available job
  SELECT * INTO v_job
  FROM job_queue
  WHERE status = 'pending'
    AND scheduled_at <= NOW()
    AND (p_job_types IS NULL OR job_type = ANY(p_job_types))
  ORDER BY priority DESC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED; -- Critical: prevents race conditions

  -- If no job found, return null
  IF v_job IS NULL THEN
    RETURN;
  END IF;

  -- Update job status to processing
  UPDATE job_queue
  SET
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = v_job.id;

  -- Return the claimed job
  RETURN QUERY SELECT * FROM job_queue WHERE id = v_job.id;
END;
$$;

-- ============================================================================
-- 3. CREATE FUNCTION TO ENQUEUE JOB
-- ============================================================================

CREATE OR REPLACE FUNCTION enqueue_job(
  p_job_type TEXT,
  p_payload JSONB,
  p_priority INTEGER DEFAULT 0,
  p_scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
DECLARE
  v_job_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user ID (if authenticated)
  v_user_id := auth.uid();

  -- Insert job
  INSERT INTO job_queue (
    job_type,
    payload,
    priority,
    scheduled_at,
    max_attempts,
    created_by
  )
  VALUES (
    p_job_type,
    p_payload,
    p_priority,
    p_scheduled_at,
    p_max_attempts,
    v_user_id
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- ============================================================================
-- 4. CREATE FUNCTION TO HANDLE JOB COMPLETION
-- ============================================================================

CREATE OR REPLACE FUNCTION complete_job(
  p_job_id UUID,
  p_error_message TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_job job_queue;
BEGIN
  -- Get current job state
  SELECT * INTO v_job FROM job_queue WHERE id = p_job_id FOR UPDATE;

  IF v_job IS NULL THEN
    RAISE EXCEPTION 'Job not found: %', p_job_id;
  END IF;

  -- If error provided, handle failure
  IF p_error_message IS NOT NULL THEN
    -- Check if we should retry
    IF v_job.attempts < v_job.max_attempts THEN
      -- Retry with exponential backoff
      UPDATE job_queue
      SET
        status = 'pending',
        attempts = attempts + 1,
        scheduled_at = NOW() + (INTERVAL '1 second' * POWER(2, attempts + 1)), -- 2s, 4s, 8s
        error_message = p_error_message,
        error_details = p_error_details,
        updated_at = NOW()
      WHERE id = p_job_id;
    ELSE
      -- Max retries reached, mark as failed
      UPDATE job_queue
      SET
        status = 'failed',
        completed_at = NOW(),
        error_message = p_error_message,
        error_details = p_error_details,
        updated_at = NOW()
      WHERE id = p_job_id;
    END IF;
  ELSE
    -- Success! Mark as completed
    UPDATE job_queue
    SET
      status = 'completed',
      completed_at = NOW(),
      updated_at = NOW()
    WHERE id = p_job_id;
  END IF;
END;
$$;

-- ============================================================================
-- 5. CREATE MONITORING VIEWS
-- ============================================================================

-- View: Queue Health
CREATE OR REPLACE VIEW queue_health AS
SELECT
  job_type,
  status,
  COUNT(*) as count,
  MIN(created_at) as oldest_job,
  MAX(created_at) as newest_job,
  AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - created_at))) as avg_duration_seconds,
  AVG(attempts) as avg_attempts
FROM job_queue
GROUP BY job_type, status;

-- View: Failed Jobs (last 24h)
CREATE OR REPLACE VIEW failed_jobs_recent AS
SELECT
  id,
  job_type,
  payload,
  attempts,
  error_message,
  created_at,
  completed_at
FROM job_queue
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- View: Stuck Jobs (processing for >10 min)
CREATE OR REPLACE VIEW stuck_jobs AS
SELECT
  id,
  job_type,
  payload,
  started_at,
  EXTRACT(EPOCH FROM (NOW() - started_at)) / 60 as minutes_stuck
FROM job_queue
WHERE status = 'processing'
  AND started_at < NOW() - INTERVAL '10 minutes'
ORDER BY started_at ASC;

-- ============================================================================
-- 6. ADD TRIGGER TO UPDATE updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_queue_updated_at
  BEFORE UPDATE ON job_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ADD RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Users can see their own jobs
CREATE POLICY "Users can view their own jobs"
  ON job_queue
  FOR SELECT
  USING (created_by = auth.uid());

-- Service role can do everything (for Edge Functions)
CREATE POLICY "Service role has full access"
  ON job_queue
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users
GRANT SELECT ON job_queue TO authenticated;
GRANT SELECT ON queue_health TO authenticated;
GRANT SELECT ON failed_jobs_recent TO authenticated;
GRANT SELECT ON stuck_jobs TO authenticated;

-- Grant execution of functions
GRANT EXECUTE ON FUNCTION enqueue_job TO authenticated;
GRANT EXECUTE ON FUNCTION claim_next_job TO service_role;
GRANT EXECUTE ON FUNCTION complete_job TO service_role;

-- ============================================================================
-- 9. ADD COMMENT DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE job_queue IS 'Async job queue for background processing';
COMMENT ON COLUMN job_queue.job_type IS 'Type of job to process';
COMMENT ON COLUMN job_queue.payload IS 'Job data as JSON';
COMMENT ON COLUMN job_queue.status IS 'Current job status';
COMMENT ON COLUMN job_queue.attempts IS 'Number of processing attempts';
COMMENT ON COLUMN job_queue.max_attempts IS 'Maximum retry attempts before failure';
COMMENT ON COLUMN job_queue.priority IS 'Job priority (higher = more important)';

COMMENT ON FUNCTION claim_next_job IS 'Atomically claim next available job with locking';
COMMENT ON FUNCTION enqueue_job IS 'Add a new job to the queue';
COMMENT ON FUNCTION complete_job IS 'Mark job as complete or retry if failed';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Insert a test job to verify setup
DO $$
DECLARE
  v_test_job_id UUID;
BEGIN
  SELECT enqueue_job(
    'generate-image',
    '{"test": true, "prompt": "Migration test"}'::JSONB,
    0
  ) INTO v_test_job_id;

  RAISE NOTICE 'Job queue system installed successfully! Test job ID: %', v_test_job_id;

  -- Clean up test job
  DELETE FROM job_queue WHERE id = v_test_job_id;
END $$;
