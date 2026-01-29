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

export type MessageType =
	| 'm.text'
	| 'm.image'
	| 'm.file'
	| 'm.audio'
	| 'm.video'
	| 'm.emote'
	| 'm.notice';

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

// ─────────────────────────────────────────────────────────
// Crypto Types
// ─────────────────────────────────────────────────────────

/**
 * Device verification status
 */
export type VerificationStatus = 'unverified' | 'verified' | 'unknown';

/**
 * Device info for crypto
 */
export interface DeviceInfo {
	deviceId: string;
	displayName?: string;
	lastSeenIp?: string;
	lastSeenTs?: number;
	verified: boolean;
	blocked: boolean;
	isCurrentDevice: boolean;
}

/**
 * User device list
 */
export interface UserDevices {
	userId: string;
	devices: DeviceInfo[];
}

/**
 * Verification request state
 */
export type VerificationRequestState =
	| 'created'
	| 'requested'
	| 'ready'
	| 'started'
	| 'done'
	| 'cancelled';

/**
 * Verification method
 */
export type VerificationMethod = 'sas' | 'reciprocate' | 'show_qr' | 'scan_qr';

/**
 * SAS (Short Authentication String) verification data
 */
export interface SasVerification {
	emoji?: { emoji: string; description: string }[];
	decimal?: [number, number, number];
}

/**
 * Crypto event callbacks for UI handling
 */
export interface CryptoCallbacks {
	onVerificationRequest?: (request: VerificationRequest) => void;
	onDeviceVerified?: (userId: string, deviceId: string) => void;
	onKeyBackupStatus?: (enabled: boolean) => void;
}

/**
 * Verification request wrapper
 */
export interface VerificationRequest {
	requestId: string;
	otherUserId: string;
	otherDeviceId?: string;
	phase: VerificationRequestState;
	isSelfVerification: boolean;
	methods: VerificationMethod[];
}

/**
 * Extended SimpleMessage with crypto info
 */
export interface SimpleMessageWithCrypto extends SimpleMessage {
	encrypted?: boolean;
	decryptionError?: string;
	senderVerified?: boolean;
}

/**
 * Cross-signing status
 */
export interface CrossSigningStatus {
	publicKeysOnDevice: boolean;
	privateKeysInSecretStorage: boolean;
	privateKeysCachedLocally: boolean;
}
