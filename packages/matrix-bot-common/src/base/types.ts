/**
 * Matrix bot configuration
 */
export interface MatrixBotConfig {
	/** Matrix homeserver URL */
	homeserverUrl: string;
	/** Bot access token */
	accessToken: string;
	/** Path to store bot state */
	storagePath: string;
	/** Allowed room IDs (empty = all rooms) */
	allowedRooms: string[];
}

/**
 * Matrix room event
 */
export interface MatrixRoomEvent {
	event_id: string;
	type: string;
	sender: string;
	room_id: string;
	origin_server_ts: number;
	content: {
		msgtype?: string;
		body?: string;
		format?: string;
		formatted_body?: string;
		url?: string;
		info?: Record<string, unknown>;
		'm.relates_to'?: {
			'm.in_reply_to'?: { event_id: string };
			rel_type?: string;
			event_id?: string;
		};
	};
}

/**
 * Matrix message event (subset of room event)
 */
export interface MatrixMessageEvent extends MatrixRoomEvent {
	content: MatrixRoomEvent['content'] & {
		msgtype: string;
		body: string;
	};
}

/**
 * Check if event is a text message
 */
export function isTextMessage(event: MatrixRoomEvent): event is MatrixMessageEvent {
	return event.content?.msgtype === 'm.text' && typeof event.content?.body === 'string';
}

/**
 * Check if event is an audio message
 */
export function isAudioMessage(event: MatrixRoomEvent): boolean {
	return event.content?.msgtype === 'm.audio';
}

/**
 * Check if event is an image message
 */
export function isImageMessage(event: MatrixRoomEvent): boolean {
	return event.content?.msgtype === 'm.image';
}

/**
 * Check if event is a file message
 */
export function isFileMessage(event: MatrixRoomEvent): boolean {
	return event.content?.msgtype === 'm.file';
}
