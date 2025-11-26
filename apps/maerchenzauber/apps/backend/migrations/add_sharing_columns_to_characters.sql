-- Add sharing_preference and related columns to characters table
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS sharing_preference VARCHAR(20) DEFAULT 'private' 
  CHECK (sharing_preference IN ('private', 'link_only', 'public', 'commons'));

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS share_code VARCHAR(20) UNIQUE;

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS total_vote_score INTEGER DEFAULT 0;

ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS stories_count INTEGER DEFAULT 0;

ALTER TABLE characters
ADD COLUMN IF NOT EXISTS cloned_from UUID;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_characters_sharing_preference ON characters(sharing_preference);
CREATE INDEX IF NOT EXISTS idx_characters_is_published ON characters(is_published);
CREATE INDEX IF NOT EXISTS idx_characters_share_code ON characters(share_code);
CREATE INDEX IF NOT EXISTS idx_characters_total_vote_score ON characters(total_vote_score);

-- Add foreign key constraint for cloned_from
ALTER TABLE characters
ADD CONSTRAINT fk_cloned_from 
  FOREIGN KEY (cloned_from) 
  REFERENCES characters(id)
  ON DELETE SET NULL;

-- Update RLS policies to consider sharing preferences
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "View public characters" ON characters;
DROP POLICY IF EXISTS "Users can update own characters" ON characters;
DROP POLICY IF EXISTS "Users can delete own characters" ON characters;

-- Allow everyone to view public and commons characters
CREATE POLICY "View public characters" ON characters
  FOR SELECT
  USING (
    (sharing_preference IN ('public', 'commons') 
    AND is_published = true)
    OR auth.uid()::text = user_id
  );

-- Only owners can update their characters
CREATE POLICY "Users can update own characters" ON characters
  FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Only owners can delete their characters
CREATE POLICY "Users can delete own characters" ON characters
  FOR DELETE
  USING (auth.uid()::text = user_id);