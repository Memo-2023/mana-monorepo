-- ⚠️ WICHTIG: Diese Migration in Supabase SQL Editor ausführen!
-- 
-- Diese Migration fügt Publishing-Funktionen zu Stories hinzu
-- Datum: 2025-09-29
-- 
-- Führe diese Befehle in deinem Supabase Dashboard aus:
-- 1. Gehe zu: https://supabase.com/dashboard/project/dyywxrmonxoiojsjmymc/sql
-- 2. Kopiere diesen gesamten SQL Code
-- 3. Führe ihn aus

-- ============================================
-- Add publishing fields to stories table
-- ============================================

-- Add is_published flag
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;

-- Add sharing preference
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS sharing_preference text DEFAULT 'private' 
CHECK (sharing_preference IN ('private', 'link_only', 'public'));

-- Add published timestamp
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Add share code for link sharing
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS share_code text;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_share_code 
ON stories(share_code) 
WHERE share_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stories_public 
ON stories(is_published, sharing_preference, published_at DESC) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_stories_user_published 
ON stories(user_id, is_published) 
WHERE is_published = true;

-- ============================================
-- Verify the changes
-- ============================================

-- Check if columns were added successfully
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'stories' 
AND column_name IN ('is_published', 'sharing_preference', 'published_at', 'share_code')
ORDER BY column_name;

-- Show message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Stories table now has publishing fields.';
END $$;