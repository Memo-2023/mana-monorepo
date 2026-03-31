/**
 * DTO for creating a meeting bot
 */
export class CreateBotDto {
	meeting_url: string;
	space_id?: string;
}

/**
 * DTO for stopping a meeting bot
 */
export class StopBotDto {
	bot_id: string;
}

/**
 * Query params for listing bots
 */
export class ListBotsQueryDto {
	state?: string;
	space_id?: string;
	limit?: number;
	offset?: number;
}

/**
 * Query params for listing recordings
 */
export class ListRecordingsQueryDto {
	space_id?: string;
	limit?: number;
	offset?: number;
}
