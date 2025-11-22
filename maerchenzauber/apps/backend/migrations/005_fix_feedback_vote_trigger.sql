-- Fix feedback vote count trigger to bypass RLS
-- The trigger needs SECURITY DEFINER to update vote_count despite RLS policies

-- Drop and recreate the function with SECURITY DEFINER
DROP FUNCTION IF EXISTS update_feedback_vote_count() CASCADE;

CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER
SECURITY DEFINER  -- This allows the function to bypass RLS
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_feedback
        SET
            vote_count = vote_count + 1,
            upvote_count = upvote_count + 1
        WHERE id = NEW.feedback_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_feedback
        SET
            vote_count = GREATEST(vote_count - 1, 0),  -- Prevent negative counts
            upvote_count = GREATEST(upvote_count - 1, 0)
        WHERE id = OLD.feedback_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER feedback_vote_count_trigger
    AFTER INSERT OR DELETE ON feedback_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_vote_count();

COMMENT ON FUNCTION update_feedback_vote_count() IS 'Automatically updates vote counts when votes are added or removed. Uses SECURITY DEFINER to bypass RLS.';
