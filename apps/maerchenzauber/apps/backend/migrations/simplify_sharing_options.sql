-- Simplify sharing options by converting 'commons' to 'public'
-- Update any existing 'commons' entries to 'public'
UPDATE characters 
SET sharing_preference = 'public' 
WHERE sharing_preference = 'commons';

-- Update the constraint to only allow the simplified options
ALTER TABLE characters 
DROP CONSTRAINT IF EXISTS characters_sharing_preference_check;

ALTER TABLE characters 
ADD CONSTRAINT characters_sharing_preference_check 
CHECK (sharing_preference IN ('private', 'link_only', 'public'));

-- Update RLS policies for simplified sharing
DROP POLICY IF EXISTS "View public characters" ON characters;

CREATE POLICY "View public characters" ON characters
  FOR SELECT
  USING (
    (sharing_preference = 'public' AND is_published = true)
    OR (sharing_preference = 'link_only' AND is_published = true AND share_code IS NOT NULL)
    OR auth.uid()::text = user_id
  );

-- Update character_collections to reflect simplified approach
UPDATE character_collections 
SET description = 'Die beliebtesten öffentlichen Charaktere' 
WHERE id = 'community';

-- Verify the changes
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published,
  COUNT(CASE WHEN sharing_preference = 'public' THEN 1 END) as public_pref,
  COUNT(CASE WHEN sharing_preference = 'private' THEN 1 END) as private_pref,
  COUNT(CASE WHEN sharing_preference = 'link_only' THEN 1 END) as link_only_pref
FROM characters;