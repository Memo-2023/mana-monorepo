-- Check if trigger exists
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'feedback_vote_count_trigger';

-- Check current vote count and actual vote records for the problematic feedback
SELECT
    uf.id,
    uf.title,
    uf.vote_count,
    uf.upvote_count,
    (SELECT COUNT(*) FROM feedback_votes WHERE feedback_id = uf.id) as actual_votes
FROM user_feedback uf
WHERE uf.id = '7367caac-b773-4947-b1fd-a5495c123be7';

-- Check all votes for this feedback
SELECT * FROM feedback_votes WHERE feedback_id = '7367caac-b773-4947-b1fd-a5495c123be7';
