-- Add blurhash field to stories pages for smooth image loading
-- BlurHash allows instant placeholder rendering while images load

-- Add blur_hash column to stories table (for cover images)
ALTER TABLE stories
ADD COLUMN IF NOT EXISTS blur_hash TEXT;

-- Add blur_hash to each page in the pages JSONB array
-- We'll store it alongside the image URL for each page
-- Example page structure: { "image": "url", "blur_hash": "LEHV6nWB...", "text": "..." }

-- Add blur_hash column to characters table
ALTER TABLE characters
ADD COLUMN IF NOT EXISTS blur_hash TEXT;

-- Create index for faster queries when blur_hash is needed
CREATE INDEX IF NOT EXISTS idx_stories_blurhash ON stories(blur_hash) WHERE blur_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_characters_blurhash ON characters(blur_hash) WHERE blur_hash IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN stories.blur_hash IS 'BlurHash string for cover image placeholder (first page)';
COMMENT ON COLUMN characters.blur_hash IS 'BlurHash string for character image placeholder';
