-- Migration: Change user_id from UUID to TEXT
-- This allows compatibility with Better Auth nanoid-based user IDs

-- Step 1: Add a temporary column with the new type
ALTER TABLE decks ADD COLUMN user_id_new TEXT;

-- Step 2: Copy and convert existing data (UUID to TEXT)
UPDATE decks SET user_id_new = user_id::text WHERE user_id IS NOT NULL;

-- Step 3: Drop the old column
ALTER TABLE decks DROP COLUMN user_id;

-- Step 4: Rename the new column
ALTER TABLE decks RENAME COLUMN user_id_new TO user_id;

-- Step 5: Add NOT NULL constraint
ALTER TABLE decks ALTER COLUMN user_id SET NOT NULL;

-- Step 6: Add index for performance
CREATE INDEX IF NOT EXISTS decks_user_id_idx ON decks(user_id);
