import type { Room, MatrixEvent, MatrixClient } from 'matrix-js-sdk';

/**
 * Matrix sync states
 */
export type SyncState = 'STOPPED' | 'PREPARED' | 'SYNCING' | 'ERROR' | 'RECONNECTING' | 'CATCHUP';

/**
 * Credentials for Matrix authentication
 */
export interface MatrixCredentials {
	homeserver: string;
	accessToken: string;
	userId: string;
	deviceId: string;
}

/**
 * Media info for files/images
 */
export interface MediaInfo {
	mxcUrl: string;
	mimetype?: string;
	size?: number;
	width?: number;
	height?: number;
	filename?: string;
	thumbnailUrl?: string;
	duration?: number; // For audio/video
}

/**
 * Simplified message for UI rendering
 */
export interface SimpleMessage {
	id: string;
	sender: string;
	senderName: string;
	body: string;
	formattedBody?: string;
	timestamp: number;
	type: MessageType;
	isOwn: boolean;
	replyTo?: string;
	replyToBody?: string;
	edited?: boolean;
	redacted?: boolean;
	media?: MediaInfo;
}

export type MessageType = 'm.text' | 'm.image' | 'm.file' | 'm.audio' | 'm.video' | 'm.emote' | 'm.notice';

/**
 * Simplified room for UI rendering
 */
export interface SimpleRoom {
	id: string;
	name: string;
	topic?: string;
	avatar?: string;
	lastMessage?: string;
	lastMessageSender?: string;
	lastMessageTime?: number;
	unreadCount: number;
	highlightCount: number;
	isDirect: boolean;
	isEncrypted: boolean;
	memberCount: number;
}

/**
 * Room member info
 */
export interface RoomMember {
	userId: string;
	displayName: string;
	avatarUrl?: string;
	membership: 'join' | 'invite' | 'leave' | 'ban' | 'knock';
	powerLevel: number;
}

/**
 * Login result
 */
export interface LoginResult {
	success: boolean;
	credentials?: MatrixCredentials;
	error?: string;
}

/**
 * Matrix store state (for debugging)
 */
export interface MatrixStoreState {
	syncState: SyncState;
	roomCount: number;
	currentRoomId: string | null;
	messageCount: number;
	error: string | null;
}
