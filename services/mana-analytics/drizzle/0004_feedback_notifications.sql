-- 0004_feedback_notifications.sql
--
-- Phase 3.B.1 von docs/plans/feedback-rewards-and-identity.md.
--
-- Per-User-Inbox-Tabelle für Status-Change-Notifications. Server
-- enqueued bei jedem adminUpdate, Web-App pollt beim Boot und rendert
-- Unread-Items als Toast.
--
-- ON DELETE CASCADE: wenn ein feedback-Item gelöscht wird, sind
-- baumelnde Notifications irrelevant.

BEGIN;

CREATE TABLE IF NOT EXISTS feedback.feedback_notifications (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id text NOT NULL,
	feedback_id uuid NOT NULL REFERENCES feedback.user_feedback(id) ON DELETE CASCADE,
	kind text NOT NULL,
	title text NOT NULL,
	body text,
	credits_awarded integer NOT NULL DEFAULT 0,
	read_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_notifications_unread_idx
	ON feedback.feedback_notifications (user_id, created_at);

CREATE INDEX IF NOT EXISTS feedback_notifications_feedback_idx
	ON feedback.feedback_notifications (feedback_id);

COMMIT;
