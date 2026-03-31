/**
 * DTO for webhook events from meeting-bot service
 */
export class WebhookEventDto {
	event: 'recording.completed' | 'recording.failed';
	timestamp: string;
	bot: {
		id: string;
		external_bot_id: string;
		user_id: string;
		space_id?: string;
		state: string;
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
