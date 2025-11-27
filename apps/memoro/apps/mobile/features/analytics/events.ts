// Authentication Events
export const AUTH_EVENTS = {
	USER_SIGNED_IN: 'user_signed_in',
	USER_SIGNED_UP: 'user_signed_up',
	USER_SIGNED_OUT: 'user_signed_out',
} as const;

// Recording Events
export const RECORDING_EVENTS = {
	RECORDING_STARTED: 'recording_started',
	RECORDING_STOPPED: 'recording_stopped',
	RECORDING_PAUSED: 'recording_paused',
	RECORDING_RESUMED: 'recording_resumed',
} as const;

// Memo Events
export const MEMO_EVENTS = {
	MEMO_CREATED: 'memo_created',
	MEMO_VIEWED: 'memo_viewed',
	MEMO_EDITED: 'memo_edited',
	MEMO_DELETED: 'memo_deleted',
	MEMO_SHARED: 'memo_shared',
	MEMO_COMBINED: 'memo_combined',
	MEMO_TRANSLATED: 'memo_translated',
} as const;

// AI Processing Events
export const AI_EVENTS = {
	TRANSCRIPTION_STARTED: 'transcription_started',
	TRANSCRIPTION_COMPLETED: 'transcription_completed',
	TRANSCRIPTION_FAILED: 'transcription_failed',
	BLUEPRINT_APPLIED: 'blueprint_applied',
	PROMPT_EXECUTED: 'prompt_executed',
	QUESTION_ASKED: 'question_asked',
} as const;

// Space Events
export const SPACE_EVENTS = {
	SPACE_CREATED: 'space_created',
	SPACE_JOINED: 'space_joined',
	SPACE_LEFT: 'space_left',
	SPACE_INVITE_SENT: 'space_invite_sent',
	SPACE_INVITE_ACCEPTED: 'space_invite_accepted',
} as const;

// Settings Events
export const SETTINGS_EVENTS = {
	LANGUAGE_CHANGED: 'language_changed',
	THEME_CHANGED: 'theme_changed',
	NOTIFICATION_PERMISSION_GRANTED: 'notification_permission_granted',
	LOCATION_PERMISSION_GRANTED: 'location_permission_granted',
} as const;

// Navigation Events
export const NAVIGATION_EVENTS = {
	SCREEN_VIEWED: 'screen_viewed',
	TAB_CHANGED: 'tab_changed',
} as const;

// Error Events
export const ERROR_EVENTS = {
	ERROR_OCCURRED: 'error_occurred',
	CRASH_DETECTED: 'crash_detected',
} as const;

// Rating Events
export const RATING_EVENTS = {
	RATING_PROMPT_SHOWN: 'rating_prompt_shown',
	RATING_ACCEPTED: 'rating_accepted',
	RATING_DECLINED: 'rating_declined',
	RATING_NEVER_ASK: 'rating_never_ask',
} as const;

// Export all events for convenience
export const ANALYTICS_EVENTS = {
	...AUTH_EVENTS,
	...RECORDING_EVENTS,
	...MEMO_EVENTS,
	...AI_EVENTS,
	...SPACE_EVENTS,
	...SETTINGS_EVENTS,
	...NAVIGATION_EVENTS,
	...ERROR_EVENTS,
	...RATING_EVENTS,
} as const;
