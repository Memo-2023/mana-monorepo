/**
 * Meeting Bot States - matches meeting-bot service enum
 */
export type MeetingBotState =
	| 'registering'
	| 'provisioning'
	| 'joining'
	| 'waiting_room'
	| 'joined'
	| 'recording'
	| 'recording_error'
	| 'leaving'
	| 'left'
	| 'error';

/**
 * Meeting platform/vendor
 */
export type MeetingVendor = 'teams' | 'meet' | 'zoom';

/**
 * Meeting Bot record from database
 */
export interface MeetingBot {
	id: string;
	created_at: string;
	ended_at?: string;
	updated_at: string;
	vendor: MeetingVendor;
	state: MeetingBotState;
	meeting_id?: string;
	meeting_code: string;
	meeting_url?: string;
	external_bot_id?: string;
	user_id: string;
	space_id?: string;
	credits_consumed?: number;
	duration_seconds?: number;
}

/**
 * Recording record from database
 */
export interface MeetingRecording {
	id: string;
	created_at: string;
	updated_at: string;
	file_url?: string;
	video_url?: string;
	audio_url?: string;
	transcript?: string;
	duration_seconds?: number;
	bot_id: string;
	user_id: string;
	space_id?: string;
	// Signed URLs for playback (generated at runtime)
	audio_signed_url?: string | null;
	video_signed_url?: string | null;
}

/**
 * Create bot request to meeting-bot service
 */
export interface CreateBotRequest {
	user_id: string;
	space_id?: string;
	meeting_url: string;
	completed_webhook_url?: string;
	failed_webhook_url?: string;
}

/**
 * Create bot response from meeting-bot service
 */
export interface CreateBotResponse {
	id: string;
	external_bot_id: string;
	meeting_url: string;
	state: MeetingBotState;
	created_at: string;
}

/**
 * Webhook event payload from meeting-bot
 */
export interface MeetingWebhookPayload {
	event: 'recording.completed' | 'recording.failed';
	timestamp: string;
	bot: {
		id: string;
		external_bot_id: string;
		user_id: string;
		space_id?: string;
		state: MeetingBotState;
		completed_at?: string;
		failed_at?: string;
	};
	recording?: {
		id: string;
		video_url?: string;
		audio_url?: string;
		file_url?: string;
		transcript?: string;
		speakers?: object;
		duration_seconds?: number;
		created_at: string;
	};
	error?: {
		code: string;
		message: string;
	};
}

/**
 * Bot with recording details
 */
export interface MeetingBotWithRecording extends MeetingBot {
	recording?: MeetingRecording;
}

/**
 * List bots response
 */
export interface ListBotsResponse {
	bots: MeetingBotWithRecording[];
	total: number;
}

/**
 * List recordings response
 */
export interface ListRecordingsResponse {
	recordings: MeetingRecording[];
	total: number;
}
