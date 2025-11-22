-- Migration: Add public character support
-- Date: 2025-01-10
-- Description: Adds fields and tables for public character sharing, voting, and collections

-- 1. Extend characters table with public sharing fields
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS share_code VARCHAR(12) UNIQUE,
ADD COLUMN IF NOT EXISTS total_vote_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stories_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sharing_preference VARCHAR(20) DEFAULT 'private' 
  CHECK (sharing_preference IN ('private', 'link_only', 'public', 'commons')),
ADD COLUMN IF NOT EXISTS original_creator_id TEXT,
ADD COLUMN IF NOT EXISTS original_character_id UUID;

-- 2. Create character collections table
CREATE TABLE IF NOT EXISTS character_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('official', 'community', 'seasonal', 'contest')),
    is_official BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    icon_url TEXT,
    banner_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. Create collection_characters junction table
CREATE TABLE IF NOT EXISTS collection_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES character_collections(id) ON DELETE CASCADE,
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    position INTEGER DEFAULT 0,
    added_by TEXT,
    UNIQUE(collection_id, character_id)
);

-- 4. Create character voting table
CREATE TABLE IF NOT EXISTS character_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote_type VARCHAR(20) DEFAULT 'like' CHECK (vote_type IN ('like', 'love', 'star')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(character_id, user_id)
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_characters_is_published ON characters(is_published);
CREATE INDEX IF NOT EXISTS idx_characters_published_at ON characters(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_characters_total_vote_score ON characters(total_vote_score DESC);
CREATE INDEX IF NOT EXISTS idx_characters_share_code ON characters(share_code);
CREATE INDEX IF NOT EXISTS idx_character_votes_character_id ON character_votes(character_id);
CREATE INDEX IF NOT EXISTS idx_character_votes_user_id ON character_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_characters_collection_id ON collection_characters(collection_id);

-- 6. Create function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS VARCHAR(12) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(12) := '';
    i INT;
BEGIN
    -- Generate a 12-character code
    FOR i IN 1..12 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-generate share codes
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.share_code IS NULL THEN
        LOOP
            NEW.share_code := generate_share_code();
            EXIT WHEN NOT EXISTS (SELECT 1 FROM characters WHERE share_code = NEW.share_code);
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_share_code
BEFORE INSERT ON characters
FOR EACH ROW
EXECUTE FUNCTION set_share_code();

-- 8. Create view for public characters with vote counts
CREATE OR REPLACE VIEW public_characters AS
SELECT 
    c.*,
    COALESCE(v.vote_count, 0) as vote_count,
    COALESCE(v.love_count, 0) as love_count,
    COALESCE(v.star_count, 0) as star_count
FROM characters c
LEFT JOIN (
    SELECT 
        character_id,
        COUNT(*) as vote_count,
        COUNT(*) FILTER (WHERE vote_type = 'love') as love_count,
        COUNT(*) FILTER (WHERE vote_type = 'star') as star_count
    FROM character_votes
    GROUP BY character_id
) v ON c.id = v.character_id
WHERE c.is_published = true AND c.sharing_preference IN ('public', 'commons');

-- 9. Add some initial character collections
INSERT INTO character_collections (name, description, type, is_official, sort_order) VALUES
('Märchenhelden', 'Die beliebtesten Charaktere unserer Community', 'official', true, 1),
('Neue Freunde', 'Frisch erschaffene Charaktere entdecken', 'official', true, 2),
('Tierfreunde', 'Süße Tiere und magische Kreaturen', 'community', false, 3),
('Fantasiewesen', 'Drachen, Einhörner und andere magische Wesen', 'community', false, 4)
ON CONFLICT DO NOTHING;