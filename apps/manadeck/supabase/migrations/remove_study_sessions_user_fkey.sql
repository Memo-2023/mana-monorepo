-- Remove foreign key constraint on study_sessions.user_id
-- This allows storing Mana Core user IDs without requiring a local users table
ALTER TABLE study_sessions DROP CONSTRAINT IF EXISTS study_sessions_user_id_fkey;

-- Remove foreign key constraint on card_progress.user_id
ALTER TABLE card_progress DROP CONSTRAINT IF EXISTS card_progress_user_id_fkey;

-- Add comments to document that user_id references Mana Core users
COMMENT ON COLUMN study_sessions.user_id IS 'User ID from Mana Core authentication system';
COMMENT ON COLUMN card_progress.user_id IS 'User ID from Mana Core authentication system';
