-- Migration: Add is_favorite column to stories table
-- Purpose: Allow users to mark their own stories as favorites
-- Date: 2025-10-15

-- Add is_favorite column to stories table
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_stories_is_favorite
ON stories(user_id, is_favorite)
WHERE is_favorite = true;

-- Comment on the column
COMMENT ON COLUMN stories.is_favorite IS 'Indicates if the story owner has marked it as a favorite';
