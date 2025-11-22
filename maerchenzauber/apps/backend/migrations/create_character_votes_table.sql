-- Create character_votes table
CREATE TABLE IF NOT EXISTS character_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL,
  user_id UUID NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('like', 'love', 'star')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure one vote per user per character
  UNIQUE(character_id, user_id),
  
  -- Foreign key to characters table (assuming it exists)
  CONSTRAINT fk_character
    FOREIGN KEY(character_id) 
    REFERENCES characters(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_character_votes_character_id ON character_votes(character_id);
CREATE INDEX idx_character_votes_user_id ON character_votes(user_id);
CREATE INDEX idx_character_votes_vote_type ON character_votes(vote_type);

-- Enable Row Level Security
ALTER TABLE character_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy: Users can view all votes (for counting)
CREATE POLICY "Allow viewing all votes" ON character_votes
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own votes
CREATE POLICY "Users can create their own votes" ON character_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own votes
CREATE POLICY "Users can update their own votes" ON character_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own votes
CREATE POLICY "Users can delete their own votes" ON character_votes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_character_votes_updated_at BEFORE UPDATE
  ON character_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();