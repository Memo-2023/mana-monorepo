export type SyncState = 'STOPPED' | 'PREPARED' | 'SYNCING' | 'ERROR' | 'RECONNECTING' | 'CATCHUP';

export interface MatrixCredentials {
	homeserver: string;
	accessToken: string;
	userId: string;
	deviceId: string;
}

export interface LoginResult {
	success: boolean;
	credentials?: MatrixCredentials;
	error?: string;
}

export type PresenceState = 'online' | 'offline' | 'unavailable';
export type RoomMembership = 'join' | 'invite' | 'leave' | 'ban' | 'knock';
export type MessageType = 'm.text' | 'm.image' | 'm.file' | 'm.audio' | 'm.video' | 'm.emote' | 'm.notice';

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
	membership: RoomMembership;
	inviter?: string;
	dmUserId?: string;
	presence?: PresenceState;
	lastActiveAgo?: number;
}

export interface MediaInfo {
	mxcUrl: string;
	mimetype?: string;
	size?: number;
	width?: number;
	height?: number;
	filename?: string;
	thumbnailUrl?: string;
	downloadUrl?: string;
	duration?: number;
}

export interface MessageReaction {
	key: string;
	count: number;
	users: string[];
	includesMe: boolean;
}

export interface ReadReceipt {
	userId: string;
	userName: string;
	timestamp: number;
}

export interface SimpleMessage {
	id: string;
	sender: string;
	senderName: string;
	senderAvatar?: string;
	body: string;
	formattedBody?: string;
	timestamp: number;
	type: MessageType;
	isOwn: boolean;
	replyTo?: string;
	replyToBody?: string;
	replyToSenderName?: string;
	edited?: boolean;
	redacted?: boolean;
	media?: MediaInfo;
	reactions?: MessageReaction[];
	readBy?: ReadReceipt[];
}

export interface RoomMember {
	userId: string;
	displayName: string;
	avatarUrl?: string;
	membership: 'join' | 'invite' | 'leave' | 'ban' | 'knock';
	powerLevel: number;
}
