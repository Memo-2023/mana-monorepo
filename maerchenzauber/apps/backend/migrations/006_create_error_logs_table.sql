-- Create error_logs table for tracking application errors
-- This table stores user-friendly categorized errors with technical details for debugging

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- Required - comes from Mana Core JWT, no FK constraint as users are in central auth
  error_category TEXT NOT NULL,
  technical_message TEXT NOT NULL,
  technical_stack TEXT,
  context JSONB,
  endpoint TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);

-- Create index on error_category for analytics
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(error_category);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Create composite index for user + time queries
CREATE INDEX IF NOT EXISTS idx_error_logs_user_time ON error_logs(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own error logs
CREATE POLICY error_logs_select_own
  ON error_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Service role can insert error logs
CREATE POLICY error_logs_insert_service
  ON error_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Service role can view all error logs (for monitoring/analytics)
CREATE POLICY error_logs_select_service
  ON error_logs
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Add comment to table
COMMENT ON TABLE error_logs IS 'Stores categorized application errors with user-friendly messages and technical details for debugging';

-- Add comments to columns
COMMENT ON COLUMN error_logs.error_category IS 'Error category enum: RATE_LIMIT, NETWORK_ERROR, GENERATION_FAILED, etc.';
COMMENT ON COLUMN error_logs.technical_message IS 'Original technical error message for debugging';
COMMENT ON COLUMN error_logs.technical_stack IS 'Error stack trace (if available)';
COMMENT ON COLUMN error_logs.context IS 'Additional context like request body, query params, etc.';
COMMENT ON COLUMN error_logs.endpoint IS 'API endpoint where error occurred';
COMMENT ON COLUMN error_logs.user_agent IS 'User agent string from request';
