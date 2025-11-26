-- Add is_favorite column to stories table for private favorites
-- This is separate from story_votes which is used for public stories

ALTER TABLE stories
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- Create index for filtering favorite stories
CREATE INDEX IF NOT EXISTS idx_stories_favorite
ON stories(user_id, is_favorite)
WHERE is_favorite = true;

-- Add comment for documentation
COMMENT ON COLUMN stories.is_favorite IS 'Personal favorite flag for user''s own stories (different from public voting)';
