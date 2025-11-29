-- Create story_votes table
CREATE TABLE IF NOT EXISTS story_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'love', 'star')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

  -- Ensure one vote per user per story
  UNIQUE(story_id, user_id),

  -- Foreign key to stories table
  CONSTRAINT fk_story
    FOREIGN KEY(story_id)
    REFERENCES stories(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_story_votes_story_id ON story_votes(story_id);
CREATE INDEX idx_story_votes_user_id ON story_votes(user_id);
CREATE INDEX idx_story_votes_vote_type ON story_votes(vote_type);

-- Enable Row Level Security
ALTER TABLE story_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view all votes (for counting)
CREATE POLICY "Allow viewing all votes" ON story_votes
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own votes
CREATE POLICY "Users can create their own votes" ON story_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own votes
CREATE POLICY "Users can update their own votes" ON story_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON story_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Reuse existing update_updated_at_column function if it exists
-- Otherwise create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = TIMEZONE('utc'::text, NOW());
      RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END $$;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_story_votes_updated_at BEFORE UPDATE
  ON story_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
