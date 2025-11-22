-- Phase 1: Foundation for Central Stories System
-- This migration sets up the scalable structure for central/curated stories

-- 1. Extend stories table with publishing fields
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS published_by TEXT, -- 'system', 'user', 'curator'
ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'private' 
    CHECK (visibility IN ('private', 'public', 'central', 'featured')),
ADD COLUMN IF NOT EXISTS featured_score DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_story_visibility ON stories(visibility, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_metadata ON stories USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_story_published ON stories(is_published) WHERE is_published = true;

-- 3. Create story collections table
CREATE TABLE IF NOT EXISTS story_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'manual' CHECK (type IN ('manual', 'automatic', 'contest', 'seasonal')),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create junction table for collection stories
CREATE TABLE IF NOT EXISTS collection_stories (
    collection_id UUID NOT NULL REFERENCES story_collections(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by TEXT,
    PRIMARY KEY (collection_id, story_id)
);

-- 5. Create indices for collection queries
CREATE INDEX IF NOT EXISTS idx_collection_stories_collection ON collection_stories(collection_id, position);
CREATE INDEX IF NOT EXISTS idx_collection_stories_story ON collection_stories(story_id);

-- 6. Update RLS policies for stories
DROP POLICY IF EXISTS "Users can view their own stories" ON stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON stories;

-- New visibility-aware policies
CREATE POLICY "story_visibility_policy_select" ON stories
    FOR SELECT USING (
        user_id = auth.uid()::text 
        OR visibility IN ('public', 'central', 'featured')
    );

CREATE POLICY "story_visibility_policy_insert" ON stories
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "story_visibility_policy_update" ON stories
    FOR UPDATE USING (user_id = auth.uid()::text)
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "story_visibility_policy_delete" ON stories
    FOR DELETE USING (user_id = auth.uid()::text);

-- 7. Enable RLS for collections tables
ALTER TABLE story_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_stories ENABLE ROW LEVEL SECURITY;

-- Collections are publicly readable
CREATE POLICY "collections_public_read" ON story_collections
    FOR SELECT USING (is_active = true);

CREATE POLICY "collection_stories_public_read" ON collection_stories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM story_collections sc 
            WHERE sc.id = collection_stories.collection_id 
            AND sc.is_active = true
        )
    );

-- 8. Insert initial central stories collection
INSERT INTO story_collections (slug, name, description, type, sort_order) 
VALUES (
    'central-stories', 
    'Märchenzauber Geschichten', 
    'Offizielle Geschichten von Märchenzauber - liebevoll für euch ausgewählt', 
    'manual',
    1
) ON CONFLICT (slug) DO NOTHING;

-- 9. Create helper function for adding stories to collections
CREATE OR REPLACE FUNCTION add_story_to_collection(
    p_story_id UUID,
    p_collection_slug VARCHAR(50),
    p_position INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_collection_id UUID;
    v_max_position INTEGER;
BEGIN
    -- Get collection ID
    SELECT id INTO v_collection_id
    FROM story_collections
    WHERE slug = p_collection_slug AND is_active = true;
    
    IF v_collection_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate position if not provided
    IF p_position IS NULL THEN
        SELECT COALESCE(MAX(position), 0) + 1 INTO v_max_position
        FROM collection_stories
        WHERE collection_id = v_collection_id;
        p_position := v_max_position;
    END IF;
    
    -- Insert into collection
    INSERT INTO collection_stories (collection_id, story_id, position, added_by)
    VALUES (v_collection_id, p_story_id, p_position, 'system')
    ON CONFLICT (collection_id, story_id) 
    DO UPDATE SET position = p_position, added_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 10. Create view for easier querying of central stories
CREATE OR REPLACE VIEW v_central_stories AS
SELECT 
    s.*,
    cs.position as collection_position,
    cs.added_at as added_to_collection_at
FROM stories s
INNER JOIN collection_stories cs ON cs.story_id = s.id
INNER JOIN story_collections sc ON sc.id = cs.collection_id
WHERE sc.slug = 'central-stories'
    AND sc.is_active = true
    AND s.visibility IN ('central', 'featured')
ORDER BY cs.position, s.created_at DESC;

-- Grant access to the view
GRANT SELECT ON v_central_stories TO authenticated;
GRANT SELECT ON v_central_stories TO anon;