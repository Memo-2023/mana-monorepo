-- Feedback System Migration
-- Create tables for user feedback with voting functionality

-- Main Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,

    -- Content
    title TEXT,
    feedback_text TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'feature' CHECK (category IN (
        'bug',           -- Bug Report
        'feature',       -- Feature Request
        'improvement',   -- Verbesserungsvorschlag
        'question',      -- Frage
        'other'          -- Sonstiges
    )),

    -- Status & Publishing
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN (
        'submitted',     -- Neu eingereicht
        'under_review',  -- Wird geprüft
        'planned',       -- Geplant
        'in_progress',   -- In Bearbeitung
        'completed',     -- Umgesetzt
        'declined'       -- Abgelehnt
    )),
    is_public BOOLEAN DEFAULT FALSE,
    admin_response TEXT,

    -- Voting
    vote_count INTEGER DEFAULT 0,
    upvote_count INTEGER DEFAULT 0,

    -- Metadata
    source VARCHAR(50) DEFAULT 'mobile',
    device_info JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    published_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- User Votes Table
CREATE TABLE IF NOT EXISTS feedback_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID NOT NULL REFERENCES user_feedback(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote_type VARCHAR(20) DEFAULT 'upvote' CHECK (vote_type IN ('upvote')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(feedback_id, user_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status, is_public);
CREATE INDEX IF NOT EXISTS idx_feedback_public ON user_feedback(is_public, published_at DESC)
    WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_feedback_votes ON user_feedback(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user ON user_feedback(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_feedback ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON feedback_votes(user_id);

-- Enable Row Level Security
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_feedback
-- Users can view their own feedback
CREATE POLICY "users_view_own_feedback" ON user_feedback
    FOR SELECT USING (user_id = auth.uid()::text);

-- Users can view public feedback
CREATE POLICY "users_view_public_feedback" ON user_feedback
    FOR SELECT USING (is_public = true);

-- Users can create feedback
CREATE POLICY "users_create_feedback" ON user_feedback
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- RLS Policies for feedback_votes
-- Users can vote on public feedback
CREATE POLICY "users_vote_on_feedback" ON feedback_votes
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- Users can delete their own votes
CREATE POLICY "users_delete_own_vote" ON feedback_votes
    FOR DELETE USING (user_id = auth.uid()::text);

-- Users can view all votes
CREATE POLICY "users_view_votes" ON feedback_votes
    FOR SELECT USING (true);

-- Trigger to update vote count automatically
CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER AS $$
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
            vote_count = vote_count - 1,
            upvote_count = upvote_count - 1
        WHERE id = OLD.feedback_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_vote_count_trigger
    AFTER INSERT OR DELETE ON feedback_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_vote_count();

-- Trigger for updated_at timestamp
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_feedback IS 'User feedback, feature requests, and bug reports';
COMMENT ON COLUMN user_feedback.is_public IS 'Set to true by admin to make feedback visible to all users';
COMMENT ON COLUMN user_feedback.status IS 'Current status of the feedback item';
COMMENT ON COLUMN user_feedback.vote_count IS 'Total number of upvotes (automatically updated by trigger)';
