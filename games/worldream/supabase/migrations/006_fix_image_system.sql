-- Migration to fix the image system by enhancing attachments and removing node_images

-- First, enhance the attachments table with image-specific features
ALTER TABLE attachments 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS generation_prompt TEXT;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_attachments_is_primary ON attachments(is_primary);
CREATE INDEX IF NOT EXISTS idx_attachments_sort_order ON attachments(sort_order);

-- Function to ensure only one primary attachment per node per kind
CREATE OR REPLACE FUNCTION ensure_single_primary_attachment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true THEN
        UPDATE attachments
        SET is_primary = false
        WHERE node_slug = NEW.node_slug
        AND kind = NEW.kind
        AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single primary attachment per kind
DROP TRIGGER IF EXISTS enforce_single_primary_attachment ON attachments;
CREATE TRIGGER enforce_single_primary_attachment
    AFTER INSERT OR UPDATE OF is_primary ON attachments
    FOR EACH ROW
    WHEN (NEW.is_primary = true)
    EXECUTE FUNCTION ensure_single_primary_attachment();

-- Migrate existing image_url from content_nodes to attachments
INSERT INTO attachments (node_slug, kind, url, is_primary, generation_prompt, created_at)
SELECT 
    slug,
    'image',
    image_url,
    true,
    generation_prompt,
    created_at
FROM content_nodes
WHERE image_url IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM attachments 
    WHERE attachments.node_slug = content_nodes.slug 
    AND attachments.kind = 'image'
    AND attachments.url = content_nodes.image_url
);

-- Drop the problematic node_images table if it exists
-- (It has wrong foreign key references anyway)
DROP TABLE IF EXISTS node_images;

-- Clean up the old columns from content_nodes (optional, can be done later)
-- ALTER TABLE content_nodes DROP COLUMN IF EXISTS image_url;
-- ALTER TABLE content_nodes DROP COLUMN IF EXISTS generation_prompt;