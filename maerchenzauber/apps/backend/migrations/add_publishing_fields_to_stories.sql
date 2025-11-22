-- Add publishing fields to stories table
-- These fields enable story sharing and public discovery features

-- Add is_published flag
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Add sharing preference enum
-- 'private': Only visible to the owner
-- 'link_only': Accessible via share code only
-- 'public': Visible in public discovery
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS sharing_preference text DEFAULT 'private' 
CHECK (sharing_preference IN ('private', 'link_only', 'public'));

-- Add published timestamp
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Add share code for link sharing
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS share_code text;

-- Create index on share_code for quick lookups
CREATE INDEX IF NOT EXISTS idx_stories_share_code 
ON stories(share_code) 
WHERE share_code IS NOT NULL;

-- Create index for public stories queries
CREATE INDEX IF NOT EXISTS idx_stories_public 
ON stories(is_published, sharing_preference, published_at DESC) 
WHERE is_published = true;

-- Create index for user's published stories
CREATE INDEX IF NOT EXISTS idx_stories_user_published 
ON stories(user_id, is_published) 
WHERE is_published = true;

-- Add comment to explain the fields
COMMENT ON COLUMN stories.is_published IS 'Whether the story is published for sharing';
COMMENT ON COLUMN stories.sharing_preference IS 'Visibility level: private, link_only, or public';
COMMENT ON COLUMN stories.published_at IS 'Timestamp when the story was first published';
COMMENT ON COLUMN stories.share_code IS 'Unique code for sharing the story via link';