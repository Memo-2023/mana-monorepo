-- Remove foreign key constraint on decks.user_id
-- This allows storing Mana Core user IDs without requiring a local users table
ALTER TABLE decks DROP CONSTRAINT IF EXISTS decks_user_id_fkey;

-- Optional: Add a comment to document that user_id references Mana Core users
COMMENT ON COLUMN decks.user_id IS 'User ID from Mana Core authentication system';
