/**
 * Shared types for Matrix client
 */

export type SyncState = 'STOPPED' | 'PREPARED' | 'SYNCING' | 'ERROR' | 'RECONNECTING' | 'CATCHUP';

export interface MatrixCredentials {
	homeserver: string;
	accessToken: string;
	userId: string;
	deviceId: string;
}

export type MessageType = 'm.text' | 'm.image' | 'm.file' | 'm.audio' | 'm.video' | 'm.emote' | 'm.notice';

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
	edited?: boolean;
}

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
