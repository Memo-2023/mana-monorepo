import { browser } from '$app/environment';
import type { MatrixClient, Room, MatrixEvent, RoomMember as SDKRoomMember } from 'matrix-js-sdk';
import type { SyncState, MatrixCredentials, SimpleRoom, SimpleMessage, RoomMember } from './types';

const STORAGE_KEY = 'matrix_credentials';

/**
 * Reactive Matrix store using Svelte 5 runes
 */
class MatrixStore {
	// ─────────────────────────────────────────────────────────
	// Private State
	// ─────────────────────────────────────────────────────────
	private _client = $state<MatrixClient | null>(null);
	private _syncState = $state<SyncState>('STOPPED');
	private _rooms = $state<Room[]>([]);
	private _currentRoomId = $state<string | null>(null);
	private _timeline = $state<MatrixEvent[]>([]);
	private _typingUsers = $state<Map<string, string[]>>(new Map());
	private _error = $state<string | null>(null);
	private _initialized = $state(false);

	// ─────────────────────────────────────────────────────────
	// Public Getters
	// ─────────────────────────────────────────────────────────
	get client() {
		return this._client;
	}
	get syncState() {
		return this._syncState;
	}
	get error() {
		return this._error;
	}
	get initialized() {
		return this._initialized;
	}
	get currentRoomId() {
		return this._currentRoomId;
	}

	// ─────────────────────────────────────────────────────────
	// Derived State
	// ─────────────────────────────────────────────────────────

	/** Is the client ready to use? */
	isReady = $derived(this._syncState === 'PREPARED' || this._syncState === 'SYNCING');

	/** Is currently syncing? */
	isSyncing = $derived(this._syncState === 'SYNCING' || this._syncState === 'CATCHUP');

	/** Current user ID */
	userId = $derived(this._client?.getUserId() || null);

	/** Simplified room list sorted by last activity */
	rooms = $derived<SimpleRoom[]>(
		this._rooms
			.map((room) => this.roomToSimpleRoom(room))
			.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0))
	);

	/** Direct message rooms */
	directRooms = $derived(this.rooms.filter((r) => r.isDirect));

	/** Group rooms (non-DM) */
	groupRooms = $derived(this.rooms.filter((r) => !r.isDirect));

	/** Current selected room */
	currentRoom = $derived(
		this._currentRoomId ? this._rooms.find((r) => r.roomId === this._currentRoomId) || null : null
	);

	/** Current room as SimpleRoom */
	currentSimpleRoom = $derived(this.currentRoom ? this.roomToSimpleRoom(this.currentRoom) : null);

	/** Messages in current room */
	messages = $derived<SimpleMessage[]>(
		this._timeline
			.filter((e) => e.getType() === 'm.room.message')
			.map((e) => this.eventToSimpleMessage(e))
	);

	/** Users currently typing in current room */
	currentRoomTyping = $derived(
		this._currentRoomId ? this._typingUsers.get(this._currentRoomId) || [] : []
	);

	/** Total unread count across all rooms */
	totalUnreadCount = $derived(this.rooms.reduce((sum, r) => sum + r.unreadCount, 0));

	// ─────────────────────────────────────────────────────────
	// Initialization
	// ─────────────────────────────────────────────────────────

	/**
	 * Initialize the Matrix client
	 * @param credentials Optional credentials, will load from storage if not provided
	 */
	async initialize(credentials?: MatrixCredentials): Promise<boolean> {
		if (!browser) return false;
		if (this._initialized && this._client) return true;

		// Load polyfills first
		await import('./polyfills');

		// Get credentials
		const creds = credentials || this.loadCredentials();
		if (!creds) {
			this._error = 'No credentials available';
			return false;
		}

		try {
			const sdk = await import('matrix-js-sdk');

			this._client = sdk.createClient({
				baseUrl: creds.homeserver,
				accessToken: creds.accessToken,
				userId: creds.userId,
				deviceId: creds.deviceId,
				timelineSupport: true,
			});

			this.setupEventHandlers(sdk);

			await this._client.startClient({
				initialSyncLimit: 20,
				lazyLoadMembers: true,
			});

			this.saveCredentials(creds);
			this._initialized = true;
			this._error = null;

			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to initialize Matrix client';
			console.error('Matrix initialization error:', err);
			return false;
		}
	}

	/**
	 * Setup event handlers for Matrix SDK events
	 */
	private setupEventHandlers(sdk: typeof import('matrix-js-sdk')) {
		if (!this._client) return;

		// Sync state changes
		this._client.on(sdk.ClientEvent.Sync, (state, prevState) => {
			this._syncState = state as SyncState;

			if (state === 'PREPARED') {
				this._rooms = this._client!.getRooms();
				console.log(`Matrix sync prepared, ${this._rooms.length} rooms loaded`);
			}

			if (state === 'ERROR') {
				this._error = 'Sync error occurred';
			}
		});

		// Room timeline updates (new messages)
		this._client.on(sdk.RoomEvent.Timeline, (event, room, toStartOfTimeline) => {
			// Skip historical events from pagination
			if (toStartOfTimeline) return;

			// Update rooms list
			this._rooms = this._client!.getRooms();

			// Update timeline if we're in this room
			if (room?.roomId === this._currentRoomId) {
				this._timeline = [...(room.getLiveTimeline().getEvents() || [])];
			}
		});

		// Typing indicators
		this._client.on(sdk.RoomMemberEvent.Typing, (event, member) => {
			const roomId = event.getRoomId();
			if (!roomId) return;

			const room = this._client!.getRoom(roomId);
			const typingMembers =
				room
					?.getMembersWithMembership('join')
					.filter((m) => m.typing && m.userId !== this._client!.getUserId())
					.map((m) => m.name || m.userId) || [];

			// Trigger reactivity by creating new Map
			const newMap = new Map(this._typingUsers);
			newMap.set(roomId, typingMembers);
			this._typingUsers = newMap;
		});

		// Room membership changes (invites, joins, leaves)
		this._client.on(sdk.RoomEvent.MyMembership, (room, membership, prevMembership) => {
			console.log(`Membership changed: ${room.roomId} - ${prevMembership} -> ${membership}`);
			this._rooms = this._client!.getRooms();
		});

		// Room name/state changes
		this._client.on(sdk.RoomStateEvent.Events, (event, state, prevEvent) => {
			// Trigger reactivity for room updates
			this._rooms = this._client!.getRooms();
		});
	}

	// ─────────────────────────────────────────────────────────
	// Room Actions
	// ─────────────────────────────────────────────────────────

	/**
	 * Select a room to view
	 */
	selectRoom(roomId: string) {
		this._currentRoomId = roomId;
		const room = this._client?.getRoom(roomId);

		if (room) {
			this._timeline = room.getLiveTimeline().getEvents() || [];

			// Mark as read
			const lastEvent = this._timeline[this._timeline.length - 1];
			if (lastEvent) {
				this._client?.sendReadReceipt(lastEvent).catch(console.error);
			}
		} else {
			this._timeline = [];
		}
	}

	/**
	 * Clear current room selection
	 */
	clearRoom() {
		this._currentRoomId = null;
		this._timeline = [];
	}

	/**
	 * Join a room by ID or alias
	 */
	async joinRoom(roomIdOrAlias: string): Promise<boolean> {
		if (!this._client) return false;

		try {
			await this._client.joinRoom(roomIdOrAlias);
			this._rooms = this._client.getRooms();
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to join room';
			return false;
		}
	}

	/**
	 * Leave a room
	 */
	async leaveRoom(roomId: string): Promise<boolean> {
		if (!this._client) return false;

		try {
			await this._client.leave(roomId);

			if (this._currentRoomId === roomId) {
				this.clearRoom();
			}

			this._rooms = this._client.getRooms();
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to leave room';
			return false;
		}
	}

	/**
	 * Create a new room
	 */
	async createRoom(options: {
		name?: string;
		topic?: string;
		isDirect?: boolean;
		invite?: string[];
	}): Promise<string | null> {
		if (!this._client) return null;

		try {
			const result = await this._client.createRoom({
				name: options.name,
				topic: options.topic,
				is_direct: options.isDirect,
				invite: options.invite,
				preset: options.isDirect ? 'trusted_private_chat' : 'private_chat',
			});

			this._rooms = this._client.getRooms();
			return result.room_id;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to create room';
			return null;
		}
	}

	// ─────────────────────────────────────────────────────────
	// Message Actions
	// ─────────────────────────────────────────────────────────

	/**
	 * Send a text message to current room
	 */
	async sendMessage(body: string): Promise<boolean> {
		if (!this._client || !this._currentRoomId) return false;

		try {
			await this._client.sendTextMessage(this._currentRoomId, body);
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to send message';
			return false;
		}
	}

	/**
	 * Send typing indicator
	 */
	async sendTyping(typing: boolean): Promise<void> {
		if (!this._client || !this._currentRoomId) return;

		try {
			await this._client.sendTyping(this._currentRoomId, typing, typing ? 30000 : 0);
		} catch (err) {
			// Ignore typing errors
		}
	}

	/**
	 * Load more messages (pagination)
	 */
	async loadMoreMessages(limit = 50): Promise<boolean> {
		if (!this._client || !this._currentRoomId) return false;

		const room = this._client.getRoom(this._currentRoomId);
		if (!room) return false;

		try {
			await this._client.scrollback(room, limit);
			this._timeline = room.getLiveTimeline().getEvents() || [];
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to load messages';
			return false;
		}
	}

	/**
	 * Send a file/image to current room
	 */
	async sendFile(
		file: File,
		onProgress?: (progress: number) => void
	): Promise<boolean> {
		if (!this._client || !this._currentRoomId) return false;

		try {
			// Upload to Matrix media repo
			const uploadResponse = await this._client.uploadContent(file, {
				progressHandler: (progress) => {
					if (onProgress) {
						onProgress(Math.round((progress.loaded / progress.total) * 100));
					}
				},
			});

			const mxcUrl = uploadResponse.content_uri;

			// Determine message type based on MIME type
			const isImage = file.type.startsWith('image/');
			const isVideo = file.type.startsWith('video/');
			const isAudio = file.type.startsWith('audio/');

			let msgtype = 'm.file';
			if (isImage) msgtype = 'm.image';
			if (isVideo) msgtype = 'm.video';
			if (isAudio) msgtype = 'm.audio';

			// Build content based on type
			const content: Record<string, unknown> = {
				msgtype,
				body: file.name,
				filename: file.name,
				info: {
					mimetype: file.type,
					size: file.size,
				},
				url: mxcUrl,
			};

			// Add dimensions for images
			if (isImage) {
				const dimensions = await this.getImageDimensions(file);
				if (dimensions) {
					(content.info as Record<string, unknown>).w = dimensions.width;
					(content.info as Record<string, unknown>).h = dimensions.height;
				}
			}

			await this._client.sendMessage(this._currentRoomId, content);
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to send file';
			return false;
		}
	}

	/**
	 * Get image dimensions
	 */
	private getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
		return new Promise((resolve) => {
			if (!file.type.startsWith('image/')) {
				resolve(null);
				return;
			}

			const img = new Image();
			img.onload = () => {
				resolve({ width: img.width, height: img.height });
				URL.revokeObjectURL(img.src);
			};
			img.onerror = () => resolve(null);
			img.src = URL.createObjectURL(file);
		});
	}

	/**
	 * Get HTTP URL for Matrix media (mxc:// URLs)
	 */
	getMediaUrl(mxcUrl: string, width?: number, height?: number): string | null {
		if (!this._client || !mxcUrl?.startsWith('mxc://')) return null;

		if (width && height) {
			return this._client.mxcUrlToHttp(mxcUrl, width, height, 'scale') || null;
		}
		return this._client.mxcUrlToHttp(mxcUrl) || null;
	}

	/**
	 * Reply to a message
	 */
	async replyToMessage(eventId: string, body: string): Promise<boolean> {
		if (!this._client || !this._currentRoomId) return false;

		const room = this._client.getRoom(this._currentRoomId);
		const originalEvent = room?.findEventById(eventId);
		if (!originalEvent) return false;

		try {
			const content = {
				msgtype: 'm.text',
				body: `> <${originalEvent.getSender()}> ${originalEvent.getContent().body}\n\n${body}`,
				format: 'org.matrix.custom.html',
				formatted_body: `<mx-reply><blockquote><a href="https://matrix.to/#/${this._currentRoomId}/${eventId}">In reply to</a> <a href="https://matrix.to/#/${originalEvent.getSender()}">${originalEvent.getSender()}</a><br>${originalEvent.getContent().body}</blockquote></mx-reply>${body}`,
				'm.relates_to': {
					'm.in_reply_to': {
						event_id: eventId,
					},
				},
			};

			await this._client.sendMessage(this._currentRoomId, content);
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to send reply';
			return false;
		}
	}

	/**
	 * Edit a message
	 */
	async editMessage(eventId: string, newBody: string): Promise<boolean> {
		if (!this._client || !this._currentRoomId) return false;

		try {
			const content = {
				msgtype: 'm.text',
				body: `* ${newBody}`,
				'm.new_content': {
					msgtype: 'm.text',
					body: newBody,
				},
				'm.relates_to': {
					rel_type: 'm.replace',
					event_id: eventId,
				},
			};

			await this._client.sendMessage(this._currentRoomId, content);
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to edit message';
			return false;
		}
	}

	/**
	 * Delete (redact) a message
	 */
	async deleteMessage(eventId: string, reason?: string): Promise<boolean> {
		if (!this._client || !this._currentRoomId) return false;

		try {
			await this._client.redactEvent(this._currentRoomId, eventId, undefined, { reason });
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to delete message';
			return false;
		}
	}

	/**
	 * React to a message with an emoji
	 */
	async reactToMessage(eventId: string, emoji: string): Promise<boolean> {
		if (!this._client || !this._currentRoomId) return false;

		try {
			await this._client.sendEvent(this._currentRoomId, 'm.reaction', {
				'm.relates_to': {
					rel_type: 'm.annotation',
					event_id: eventId,
					key: emoji,
				},
			});
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to react';
			return false;
		}
	}

	// ─────────────────────────────────────────────────────────
	// User Actions
	// ─────────────────────────────────────────────────────────

	/**
	 * Invite a user to a room
	 */
	async inviteUser(roomId: string, userId: string): Promise<boolean> {
		if (!this._client) return false;

		try {
			await this._client.invite(roomId, userId);
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to invite user';
			return false;
		}
	}

	/**
	 * Kick a user from a room
	 */
	async kickUser(roomId: string, userId: string, reason?: string): Promise<boolean> {
		if (!this._client) return false;

		try {
			await this._client.kick(roomId, userId, reason);
			return true;
		} catch (err) {
			this._error = err instanceof Error ? err.message : 'Failed to kick user';
			return false;
		}
	}

	/**
	 * Search for users by name or ID
	 */
	async searchUsers(query: string, limit = 10): Promise<{ userId: string; displayName?: string; avatarUrl?: string }[]> {
		if (!this._client || !query.trim()) return [];

		try {
			const result = await this._client.searchUserDirectory({ term: query, limit });
			return result.results.map((user) => ({
				userId: user.user_id,
				displayName: user.display_name,
				avatarUrl: user.avatar_url ? this.getMediaUrl(user.avatar_url, 40, 40) || undefined : undefined,
			}));
		} catch {
			return [];
		}
	}

	/**
	 * Get room members
	 */
	getRoomMembers(roomId?: string): RoomMember[] {
		const id = roomId || this._currentRoomId;
		if (!this._client || !id) return [];

		const room = this._client.getRoom(id);
		if (!room) return [];

		return room.getMembersWithMembership('join').map((member) => ({
			userId: member.userId,
			displayName: member.name || member.userId,
			avatarUrl: member.getAvatarUrl(this._client!.baseUrl, 40, 40, 'scale', false, false) || undefined,
			membership: member.membership as RoomMember['membership'],
			powerLevel: room.getMemberPowerLevel(member.userId),
		}));
	}

	// ─────────────────────────────────────────────────────────
	// Cleanup
	// ─────────────────────────────────────────────────────────

	/**
	 * Stop the client and clean up
	 */
	destroy() {
		this._client?.stopClient();
		this._client = null;
		this._syncState = 'STOPPED';
		this._rooms = [];
		this._timeline = [];
		this._currentRoomId = null;
		this._typingUsers = new Map();
		this._initialized = false;
	}

	/**
	 * Logout and clear credentials
	 */
	logout() {
		this.destroy();
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	// ─────────────────────────────────────────────────────────
	// Helper Methods
	// ─────────────────────────────────────────────────────────

	/**
	 * Convert SDK Room to SimpleRoom
	 */
	private roomToSimpleRoom(room: Room): SimpleRoom {
		const lastEvent = room
			.getLiveTimeline()
			.getEvents()
			.filter((e) => e.getType() === 'm.room.message')
			.pop();

		return {
			id: room.roomId,
			name: room.name || 'Unnamed Room',
			topic: room.currentState.getStateEvents('m.room.topic', '')?.[0]?.getContent()?.topic,
			avatar: room.getAvatarUrl(this._client?.baseUrl || '', 48, 48, 'scale') || undefined,
			lastMessage: lastEvent?.getContent()?.body,
			lastMessageSender: lastEvent ? this.getSenderName(lastEvent) : undefined,
			lastMessageTime: room.getLastActiveTimestamp() || undefined,
			unreadCount: room.getUnreadNotificationCount('total') || 0,
			highlightCount: room.getUnreadNotificationCount('highlight') || 0,
			isDirect: this.isDirectRoom(room),
			isEncrypted: room.hasEncryptionStateEvent(),
			memberCount: room.getJoinedMemberCount(),
		};
	}

	/**
	 * Convert SDK MatrixEvent to SimpleMessage
	 */
	private eventToSimpleMessage(event: MatrixEvent): SimpleMessage {
		const content = event.getContent();
		const relatesTo = content['m.relates_to'];
		const msgtype = content.msgtype || 'm.text';

		// Check if message was redacted
		const isRedacted = event.isRedacted();

		// Extract media info for file/image/video/audio messages
		let media: SimpleMessage['media'] = undefined;
		if (['m.image', 'm.file', 'm.video', 'm.audio'].includes(msgtype) && content.url) {
			const info = content.info || {};
			media = {
				mxcUrl: content.url,
				mimetype: info.mimetype,
				size: info.size,
				width: info.w,
				height: info.h,
				filename: content.filename || content.body,
				thumbnailUrl: info.thumbnail_url,
				duration: info.duration,
			};
		}

		// Get reply-to body if this is a reply
		let replyToBody: string | undefined;
		const replyToId = relatesTo?.['m.in_reply_to']?.event_id;
		if (replyToId) {
			const room = this._client?.getRoom(event.getRoomId() || '');
			const replyEvent = room?.findEventById(replyToId);
			if (replyEvent) {
				replyToBody = replyEvent.getContent().body;
			}
		}

		return {
			id: event.getId() || '',
			sender: event.getSender() || '',
			senderName: this.getSenderName(event),
			body: isRedacted ? 'Message deleted' : (content.body || ''),
			formattedBody: content.formatted_body,
			timestamp: event.getTs(),
			type: msgtype,
			isOwn: event.getSender() === this._client?.getUserId(),
			replyTo: replyToId,
			replyToBody,
			edited: !!event.replacingEvent(),
			redacted: isRedacted,
			media,
		};
	}

	/**
	 * Get display name for message sender
	 */
	private getSenderName(event: MatrixEvent): string {
		const room = this._client?.getRoom(event.getRoomId() || '');
		const member = room?.getMember(event.getSender() || '');
		return member?.name || event.getSender()?.split(':')[0].substring(1) || 'Unknown';
	}

	/**
	 * Check if room is a direct message room
	 */
	private isDirectRoom(room: Room): boolean {
		const dominated = this._client?.getAccountData('m.direct')?.getContent() || {};
		return Object.values(dominated).flat().includes(room.roomId);
	}

	/**
	 * Load credentials from localStorage
	 */
	private loadCredentials(): MatrixCredentials | null {
		if (!browser) return null;

		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : null;
		} catch {
			return null;
		}
	}

	/**
	 * Save credentials to localStorage
	 */
	private saveCredentials(creds: MatrixCredentials) {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
		}
	}

	/**
	 * Check if credentials exist in storage
	 */
	hasStoredCredentials(): boolean {
		return this.loadCredentials() !== null;
	}
}

// Export singleton instance
export const matrixStore = new MatrixStore();
