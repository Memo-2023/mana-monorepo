-- Test query to check public characters
-- First, let's see all characters and their sharing settings
SELECT 
  id,
  name,
  sharing_preference,
  is_published,
  published_at,
  share_code,
  user_id,
  created_at
FROM characters
ORDER BY created_at DESC
LIMIT 10;

-- Check specifically for public/commons characters
SELECT 
  id,
  name,
  sharing_preference,
  is_published,
  published_at
FROM characters
WHERE sharing_preference IN ('public', 'commons')
  OR is_published = true;

-- Check if any character has is_published = true
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN is_published = true THEN 1 END) as published,
  COUNT(CASE WHEN sharing_preference = 'public' THEN 1 END) as public_pref,
  COUNT(CASE WHEN sharing_preference = 'commons' THEN 1 END) as commons_pref,
  COUNT(CASE WHEN sharing_preference = 'private' THEN 1 END) as private_pref,
  COUNT(CASE WHEN sharing_preference = 'link_only' THEN 1 END) as link_only_pref
FROM characters;