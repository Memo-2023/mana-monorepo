import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MatrixClient, Room, MatrixEvent } from 'matrix-js-sdk';
import type {
	MatrixCredentials,
	SimpleRoom,
	SimpleMessage,
	SyncState,
	MessageType,
	MessageReaction,
	ReadReceipt,
	RoomMember,
} from './types';
import { resolveMxcThumbnail, resolveMxcUrl } from './media';
import { uploadMedia } from './upload';
import { showMessageNotification, setBadgeCount } from '../notifications';

const CREDENTIALS_KEY = 'manalink_credentials';
const LAST_ROOM_KEY = 'manalink_last_room';
const ROOMS_CACHE_KEY = 'manalink_rooms_cache';

interface MatrixState {
	client: MatrixClient | null;
	credentials: MatrixCredentials | null;
	syncState: SyncState;
	rooms: SimpleRoom[];
	invites: SimpleRoom[];
	currentRoomId: string | null;
	messages: SimpleMessage[];
	firstUnreadEventId: string | null;
	typingUsers: string[];
	roomMembers: RoomMember[];
	error: string | null;
	isReady: boolean;

	initialize: (credentials: MatrixCredentials) => Promise<void>;
	restoreSession: () => Promise<boolean>;
	selectRoom: (roomId: string) => void;
	loadRoomMembers: (roomId: string) => void;
	sendMessage: (body: string, replyToEventId?: string) => Promise<void>;
	sendReaction: (eventId: string, key: string) => Promise<void>;
	redactMessage: (eventId: string) => Promise<void>;
	sendTyping: (typing: boolean) => Promise<void>;
	sendImage: (fileUri: string, filename: string, mimetype: string, width?: number, height?: number) => Promise<void>;
	sendFile: (fileUri: string, filename: string, mimetype: string) => Promise<void>;
	editMessage: (eventId: string, newBody: string) => Promise<void>;
	sendVoice: (fileUri: string, durationMs: number) => Promise<void>;
	forwardMessage: (eventId: string, targetRoomId: string) => Promise<void>;
	acceptInvite: (roomId: string) => Promise<void>;
	declineInvite: (roomId: string) => Promise<void>;
	leaveRoom: (roomId: string) => Promise<void>;
	logout: () => Promise<void>;
}

function roomToSimple(room: Room, userId: string, baseUrl: string): SimpleRoom {
	const timeline = room.getLiveTimeline().getEvents();
	const lastMsg = timeline.findLast((e) => e.getType() === 'm.room.message');

	const dmUserId = (() => {
		const members = room.getJoinedMembers();
		if (members.length === 2) return members.find((m) => m.userId !== userId)?.userId;
		return undefined;
	})();

	const rawAvatar = room.getMxcAvatarUrl?.() ?? null;
	const avatar = rawAvatar ? resolveMxcThumbnail(rawAvatar, baseUrl, 96, 96) ?? undefined : undefined;

	return {
		id: room.roomId,
		name: room.name || room.roomId,
		topic: room.currentState.getStateEvents('m.room.topic', '')?.getContent()?.topic,
		avatar,
		lastMessage: lastMsg?.getContent()?.body,
		lastMessageSender: lastMsg?.getSender() ?? undefined,
		lastMessageTime: room.getLastActiveTimestamp?.() ?? undefined,
		unreadCount: room.getUnreadNotificationCount('total') ?? 0,
		highlightCount: room.getUnreadNotificationCount('highlight') ?? 0,
		isDirect: !!dmUserId,
		isEncrypted: room.hasEncryptionStateEvent(),
		memberCount: room.getJoinedMemberCount(),
		membership: (room.getMyMembership() as SimpleRoom['membership']) ?? 'leave',
		inviter: room.getDMInviter?.() ?? undefined,
		dmUserId,
	};
}

function eventToMessage(event: MatrixEvent, userId: string, baseUrl: string, room?: Room): SimpleMessage | null {
	if (event.getType() !== 'm.room.message') return null;

	const content = event.getContent();
	const msgtype = content.msgtype as MessageType;

	// Resolve media if present
	let media = undefined;
	if (['m.image', 'm.file', 'm.audio', 'm.video'].includes(msgtype) && content.url) {
		const mxcUrl = content.url as string;
		const isAudio = msgtype === 'm.audio';
		media = {
			mxcUrl,
			mimetype: content.info?.mimetype,
			size: content.info?.size,
			width: content.info?.w,
			height: content.info?.h,
			filename: content.body,
			thumbnailUrl: isAudio ? undefined : (resolveMxcThumbnail(mxcUrl, baseUrl, 400, 300) ?? undefined),
			downloadUrl: resolveMxcUrl(mxcUrl, baseUrl) ?? undefined,
			duration: content.info?.duration,
		};
	}

	// Resolve sender avatar
	const senderMember = event.sender;
	const rawSenderAvatar = senderMember?.getMxcAvatarUrl?.() ?? null;
	const senderAvatar = rawSenderAvatar
		? resolveMxcThumbnail(rawSenderAvatar, baseUrl, 64, 64) ?? undefined
		: undefined;

	// Reply-to
	const replyRelation = content['m.relates_to']?.['m.in_reply_to'];
	const replyToId: string | undefined = replyRelation?.event_id;
	let replyToBody: string | undefined;
	let replyToSenderName: string | undefined;
	if (replyToId && room) {
		const replyEvent = room.findEventById(replyToId);
		if (replyEvent) {
			replyToBody = replyEvent.getContent()?.body;
			replyToSenderName = replyEvent.sender?.name ?? replyEvent.getSender() ?? undefined;
		}
	}

	// Reactions
	let reactions: MessageReaction[] | undefined;
	if (room) {
		const eventId = event.getId();
		const reactionEvents = room.getLiveTimeline().getEvents().filter(
			(e) =>
				e.getType() === 'm.reaction' &&
				e.getContent()?.['m.relates_to']?.event_id === eventId &&
				e.getContent()?.['m.relates_to']?.rel_type === 'm.annotation',
		);
		if (reactionEvents.length > 0) {
			const grouped = new Map<string, { users: string[]; includesMe: boolean }>();
			for (const re of reactionEvents) {
				const key = re.getContent()['m.relates_to'].key as string;
				if (!grouped.has(key)) grouped.set(key, { users: [], includesMe: false });
				const entry = grouped.get(key)!;
				const sender = re.getSender() ?? '';
				entry.users.push(sender);
				if (sender === userId) entry.includesMe = true;
			}
			reactions = Array.from(grouped.entries()).map(([key, { users, includesMe }]) => ({
				key,
				count: users.length,
				users,
				includesMe,
			}));
		}
	}

	// Read receipts
	let readBy: ReadReceipt[] | undefined;
	if (room) {
		const eventId = event.getId();
		if (eventId) {
			const receipts: ReadReceipt[] = [];
			const members = room.getMembersWithMembership('join');
			for (const member of members) {
				if (member.userId === userId) continue;
				const readUpTo = (room as any).getEventReadUpTo?.(member.userId) as string | null;
				if (readUpTo === eventId) {
					receipts.push({
						userId: member.userId,
						userName: member.name || member.userId,
						timestamp: 0,
					});
				}
			}
			if (receipts.length > 0) readBy = receipts;
		}
	}

	return {
		id: event.getId() ?? `${event.getTs()}_${event.getSender()}`,
		sender: event.getSender() ?? '',
		senderName: senderMember?.name ?? event.getSender() ?? '',
		senderAvatar,
		body: content.body ?? '',
		formattedBody: content.formatted_body,
		timestamp: event.getTs(),
		type: msgtype,
		isOwn: event.getSender() === userId,
		replyTo: replyToId,
		replyToBody,
		replyToSenderName,
		edited: !!event.replacingEvent(),
		redacted: event.isRedacted(),
		media,
		reactions,
		readBy,
	};
}

function buildSimpleRooms(client: MatrixClient, userId: string, baseUrl: string): SimpleRoom[] {
	return client
		.getRooms()
		.filter((r) => r.getMyMembership() === 'join')
		.map((r) => roomToSimple(r, userId, baseUrl))
		.sort((a, b) => (b.lastMessageTime ?? 0) - (a.lastMessageTime ?? 0));
}

function buildInvites(client: MatrixClient, userId: string, baseUrl: string): SimpleRoom[] {
	return client
		.getRooms()
		.filter((r) => r.getMyMembership() === 'invite')
		.map((r) => roomToSimple(r, userId, baseUrl));
}

function buildMessages(room: Room, userId: string, baseUrl: string): SimpleMessage[] {
	return room
		.getLiveTimeline()
		.getEvents()
		.map((e) => eventToMessage(e, userId, baseUrl, room))
		.filter((m): m is SimpleMessage => m !== null);
}

export const useMatrixStore = create<MatrixState>((set, get) => ({
	client: null,
	credentials: null,
	syncState: 'STOPPED',
	rooms: [],
	invites: [],
	currentRoomId: null,
	messages: [],
	firstUnreadEventId: null,
	typingUsers: [],
	roomMembers: [],
	error: null,
	isReady: false,

	initialize: async (credentials: MatrixCredentials) => {
		const existing = get().client;
		if (existing) existing.stopClient();

		await import('./polyfills');
		const { createClient } = await import('matrix-js-sdk');

		const client = createClient({
			baseUrl: credentials.homeserver,
			accessToken: credentials.accessToken,
			userId: credentials.userId,
			deviceId: credentials.deviceId,
		});

		await SecureStore.setItemAsync(CREDENTIALS_KEY, JSON.stringify(credentials));
		set({ client, credentials });

		const { userId, homeserver: baseUrl } = credentials;

		// Load cached rooms immediately for fast startup
		try {
			const cached = await AsyncStorage.getItem(ROOMS_CACHE_KEY);
			if (cached) set({ rooms: JSON.parse(cached) });
		} catch { /* ignore cache errors */ }

		const refresh = () => {
			const rooms = buildSimpleRooms(client, userId, baseUrl);
			const invites = buildInvites(client, userId, baseUrl);
			set({ rooms, invites });
			// Update badge count
			const totalUnread = rooms.reduce((n, r) => n + r.highlightCount, 0);
			setBadgeCount(totalUnread).catch(() => {});
			// Persist rooms cache
			AsyncStorage.setItem(ROOMS_CACHE_KEY, JSON.stringify(rooms)).catch(() => {});
		};

		const refreshMessages = (room: Room) => {
			const { currentRoomId } = get();
			if (room.roomId !== currentRoomId) return;
			set({ messages: buildMessages(room, userId, baseUrl) });
		};

		client.on('sync' as any, (state: SyncState) => {
			set({ syncState: state });
			if (state === 'PREPARED' || state === 'SYNCING') {
				refresh();
				set({ isReady: true, error: null });
			}
			if (state === 'ERROR') set({ error: 'Sync error — reconnecting...' });
		});

		client.on('Room.timeline' as any, (event: MatrixEvent, room: Room) => {
			refresh();
			refreshMessages(room);

			// Foreground notification for incoming messages
			const { currentRoomId } = get();
			if (
				event.getType() === 'm.room.message' &&
				event.getSender() !== userId &&
				room.roomId !== currentRoomId
			) {
				const senderName = event.sender?.name ?? event.getSender() ?? 'Someone';
				const body = event.getContent()?.body ?? 'New message';
				showMessageNotification(senderName, room.name, body, room.roomId).catch(() => {});
			}
		});

		client.on('Room.redaction' as any, (_: unknown, room: Room) => {
			refresh();
			refreshMessages(room);
		});

		client.on('Room.name' as any, () => refresh());
		client.on('RoomState.events' as any, () => refresh());
		client.on('Room.myMembership' as any, () => refresh());
		client.on('Room.receipt' as any, (_: unknown, room: Room) => {
			refreshMessages(room);
		});

		client.on('RoomMember.typing' as any, (_: unknown, member: any) => {
			const { currentRoomId } = get();
			if (!currentRoomId || member.roomId !== currentRoomId) return;
			const room = client.getRoom(currentRoomId);
			if (!room) return;
			const typing = room
				.getMembersWithMembership('join')
				.filter((m: any) => m.typing && m.userId !== userId)
				.map((m: any) => m.name || m.userId);
			set({ typingUsers: typing });
		});

		await client.startClient({ initialSyncLimit: 50 });
	},

	restoreSession: async () => {
		try {
			const stored = await SecureStore.getItemAsync(CREDENTIALS_KEY);
			if (!stored) return false;
			const credentials: MatrixCredentials = JSON.parse(stored);
			await get().initialize(credentials);
			return true;
		} catch {
			return false;
		}
	},

	selectRoom: (roomId: string) => {
		const { client, credentials } = get();
		set({ currentRoomId: roomId, typingUsers: [], messages: [], roomMembers: [], firstUnreadEventId: null });
		if (!client || !credentials) return;

		const room = client.getRoom(roomId);
		if (!room) return;

		// Capture first unread event before marking as read
		const { userId, homeserver: baseUrl } = credentials;
		let firstUnreadEventId: string | null = null;
		const unreadCount = room.getUnreadNotificationCount('total') ?? 0;
		if (unreadCount > 0) {
			const lastReadEventId = (room as any).getEventReadUpTo?.(userId) as string | null;
			if (lastReadEventId) {
				const timeline = room.getLiveTimeline().getEvents();
				const lastReadIdx = timeline.findIndex((e) => e.getId() === lastReadEventId);
				if (lastReadIdx >= 0) {
					const firstUnread = timeline.slice(lastReadIdx + 1).find((e) => e.getType() === 'm.room.message');
					firstUnreadEventId = firstUnread?.getId() ?? null;
				}
			}
		}

		set({ messages: buildMessages(room, userId, baseUrl), firstUnreadEventId });

		SecureStore.setItemAsync(LAST_ROOM_KEY, roomId).catch(() => {});

		const lastEvent = room.getLiveTimeline().getEvents().at(-1);
		if (lastEvent) client.sendReadReceipt(lastEvent).catch(() => {});
	},

	loadRoomMembers: (roomId: string) => {
		const { client, credentials } = get();
		if (!client || !credentials) return;
		const room = client.getRoom(roomId);
		if (!room) return;

		const members: RoomMember[] = room
			.getMembersWithMembership('join')
			.map((m: any) => {
				const rawAvatar = m.getMxcAvatarUrl?.() ?? null;
				return {
					userId: m.userId,
					displayName: m.name || m.userId,
					avatarUrl: rawAvatar
						? resolveMxcThumbnail(rawAvatar, credentials.homeserver, 64, 64) ?? undefined
						: undefined,
					membership: 'join' as const,
					powerLevel: m.powerLevel ?? 0,
				};
			})
			.sort((a: RoomMember, b: RoomMember) => b.powerLevel - a.powerLevel);

		set({ roomMembers: members });
	},

	sendMessage: async (body: string, replyToEventId?: string) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;

		if (replyToEventId) {
			const room = client.getRoom(currentRoomId);
			const replyEvent = room?.findEventById(replyToEventId);
			if (replyEvent) {
				await (client as any).sendMessage(currentRoomId, {
					msgtype: 'm.text',
					body,
					'm.relates_to': {
						'm.in_reply_to': { event_id: replyToEventId },
					},
				});
				return;
			}
		}

		await client.sendTextMessage(currentRoomId, body);
	},

	sendReaction: async (eventId: string, key: string) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		await (client as any).sendEvent(currentRoomId, 'm.reaction', {
			'm.relates_to': { rel_type: 'm.annotation', event_id: eventId, key },
		});
	},

	redactMessage: async (eventId: string) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		await client.redactEvent(currentRoomId, eventId);
	},

	sendTyping: async (typing: boolean) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		client.sendTyping(currentRoomId, typing, 4000).catch(() => {});
	},

	sendImage: async (fileUri, filename, mimetype, width, height) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		const uploaded = await uploadMedia(client, fileUri, filename, mimetype);
		await (client as any).sendMessage(currentRoomId, {
			msgtype: 'm.image',
			body: filename,
			url: uploaded.mxcUrl,
			info: {
				mimetype,
				size: uploaded.size,
				...(width ? { w: width } : {}),
				...(height ? { h: height } : {}),
			},
		});
	},

	sendFile: async (fileUri, filename, mimetype) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		const uploaded = await uploadMedia(client, fileUri, filename, mimetype);
		await (client as any).sendMessage(currentRoomId, {
			msgtype: 'm.file',
			body: filename,
			url: uploaded.mxcUrl,
			info: { mimetype, size: uploaded.size },
		});
	},

	editMessage: async (eventId: string, newBody: string) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		await (client as any).sendMessage(currentRoomId, {
			msgtype: 'm.text',
			body: `* ${newBody}`,
			'm.new_content': { msgtype: 'm.text', body: newBody },
			'm.relates_to': { rel_type: 'm.replace', event_id: eventId },
		});
	},

	sendVoice: async (fileUri: string, durationMs: number) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		const filename = `voice_${Date.now()}.m4a`;
		const uploaded = await uploadMedia(client, fileUri, filename, 'audio/m4a');
		await (client as any).sendMessage(currentRoomId, {
			msgtype: 'm.audio',
			body: filename,
			url: uploaded.mxcUrl,
			info: { mimetype: 'audio/m4a', size: uploaded.size, duration: durationMs },
		});
	},

	forwardMessage: async (eventId: string, targetRoomId: string) => {
		const { client, currentRoomId } = get();
		if (!client || !currentRoomId) return;
		const room = client.getRoom(currentRoomId);
		const event = room?.findEventById(eventId);
		if (!event) return;
		const content = event.getContent();
		const msgtype = content.msgtype ?? 'm.text';
		// Forward as a fresh message (strip reply relations)
		const forwarded: Record<string, any> = { msgtype, body: content.body };
		if (content.url) forwarded.url = content.url;
		if (content.info) forwarded.info = content.info;
		if (content.formatted_body) {
			forwarded.format = content.format;
			forwarded.formatted_body = content.formatted_body;
		}
		await (client as any).sendMessage(targetRoomId, forwarded);
	},

	leaveRoom: async (roomId: string) => {
		const { client } = get();
		if (!client) return;
		await client.leave(roomId);
		// If we left the current room, clear it
		const { currentRoomId } = get();
		if (currentRoomId === roomId) {
			set({ currentRoomId: null, messages: [], roomMembers: [] });
		}
	},

	acceptInvite: async (roomId: string) => {
		const { client } = get();
		if (!client) return;
		await client.joinRoom(roomId);
	},

	declineInvite: async (roomId: string) => {
		const { client } = get();
		if (!client) return;
		await client.leave(roomId);
	},

	logout: async () => {
		const { client } = get();
		try {
			await client?.logout();
		} catch {
			// non-fatal
		}
		client?.stopClient();
		await SecureStore.deleteItemAsync(CREDENTIALS_KEY).catch(() => {});
		await SecureStore.deleteItemAsync(LAST_ROOM_KEY).catch(() => {});
		await AsyncStorage.removeItem(ROOMS_CACHE_KEY).catch(() => {});
		await setBadgeCount(0).catch(() => {});
		set({
			client: null,
			credentials: null,
			syncState: 'STOPPED',
			rooms: [],
			invites: [],
			currentRoomId: null,
			messages: [],
			firstUnreadEventId: null,
			error: null,
			isReady: false,
		});
	},
}));
