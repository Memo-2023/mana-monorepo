-- Make the first character public for testing
-- This updates one character to be publicly visible

UPDATE characters 
SET 
  sharing_preference = 'public',
  is_published = true,
  published_at = NOW(),
  share_code = substring(md5(random()::text), 1, 12)
WHERE id = (
  SELECT id 
  FROM characters 
  ORDER BY created_at DESC 
  LIMIT 1
)
RETURNING id, name, sharing_preference, is_published, share_code;

-- Verify the update
SELECT 
  id,
  name,
  sharing_preference,
  is_published,
  published_at,
  share_code
FROM characters
WHERE is_published = true;