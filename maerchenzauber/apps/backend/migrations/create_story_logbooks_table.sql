-- Create story_logbooks table for storing detailed creation logs
CREATE TABLE IF NOT EXISTS story_logbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  user_id UUID NOT NULL,
  
  -- Character IDs array to support multiple characters per story
  character_ids UUID[] DEFAULT '{}',
  
  -- Timing information
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  total_duration_ms INTEGER,
  
  -- Status and metadata
  success BOOLEAN DEFAULT false,
  environment TEXT DEFAULT 'production',
  
  -- Core logbook data (JSONB for flexibility)
  entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Summary for quick viewing
  summary TEXT,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_story_logbooks_story_id ON story_logbooks(story_id);
CREATE INDEX idx_story_logbooks_user_id ON story_logbooks(user_id);
CREATE INDEX idx_story_logbooks_character_ids ON story_logbooks USING GIN(character_ids);
CREATE INDEX idx_story_logbooks_created_at ON story_logbooks(created_at DESC);
CREATE INDEX idx_story_logbooks_success ON story_logbooks(success);

-- Enable RLS
ALTER TABLE story_logbooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Since we're using Mana Core for auth, not Supabase Auth,
-- we'll create a permissive policy for service role access
-- The backend service will handle user authorization
CREATE POLICY "Service role has full access" ON story_logbooks
  FOR ALL USING (true);  -- Backend handles auth via Mana Core

-- Add comment
COMMENT ON TABLE story_logbooks IS 'Stores detailed logs of story creation process including AI prompts, responses, and errors';