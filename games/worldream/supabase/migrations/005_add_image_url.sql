-- Add image_url column to content_nodes
ALTER TABLE content_nodes
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for faster queries on nodes with images
CREATE INDEX IF NOT EXISTS idx_content_nodes_has_image 
ON content_nodes(id) 
WHERE image_url IS NOT NULL;