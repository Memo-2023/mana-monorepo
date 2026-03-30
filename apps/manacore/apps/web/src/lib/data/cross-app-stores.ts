/**
 * Cross-App IndexedDB Readers
 *
 * Opens other apps' IndexedDB databases for direct read access.
 * All apps on the same origin share IndexedDB, so ManaCore can
 * read from manacore-todo, manacore-calendar, etc. directly.
 *
 * Data is reactive via Dexie's liveQuery — updates when any app
 * writes to the same database (including via sync).
 *
 * NOTE: These stores are read-only from ManaCore's perspective.
 * Writes that need sync should go through the owning app's collections.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';

// ─── Todo Types ─────────────────────────────────────────────

export interface CrossAppTask extends BaseRecord {
	title: string;
	description?: string;
	projectId?: string | null;
	priority: 'low' | 'medium' | 'high' | 'urgent';
	isCompleted: boolean;
	completedAt?: string | null;
	dueDate?: string | null;
	dueTime?: string | null;
	scheduledDate?: string | null;
	estimatedDuration?: number | null;
	order: number;
	subtasks?: { id: string; title: string; isCompleted: boolean; order: number }[] | null;
	labels?: { id: string; name: string; color: string }[];
}

export interface CrossAppProject extends BaseRecord {
	name: string;
	color: string;
	icon?: string | null;
	order: number;
	isArchived: boolean;
	isDefault: boolean;
}

// ─── Calendar Types ─────────────────────────────────────────

export interface CrossAppEvent extends BaseRecord {
	calendarId: string;
	title: string;
	description?: string | null;
	startDate: string;
	endDate: string;
	allDay: boolean;
	location?: string | null;
	recurrenceRule?: string | null;
	color?: string | null;
}

export interface CrossAppCalendar extends BaseRecord {
	name: string;
	color: string;
	isDefault: boolean;
	isVisible: boolean;
}

// ─── Contacts Types ─────────────────────────────────────────

export interface CrossAppContact extends BaseRecord {
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	company?: string;
	jobTitle?: string;
	photoUrl?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
}

// ─── Chat Types ─────────────────────────────────────────────

export interface CrossAppConversation extends BaseRecord {
	title?: string;
	modelId?: string;
	isArchived?: boolean;
	isPinned?: boolean;
	spaceId?: string;
}

export interface CrossAppMessage extends BaseRecord {
	conversationId: string;
	sender: 'user' | 'assistant' | 'system';
	messageText: string;
}

// ─── Zitare Types ───────────────────────────────────────────

export interface CrossAppFavorite extends BaseRecord {
	quoteId: string;
}

// ─── Picture Types ──────────────────────────────────────────

export interface CrossAppImage extends BaseRecord {
	prompt?: string;
	publicUrl?: string;
	storagePath?: string;
	filename?: string;
	width?: number;
	height?: number;
	isFavorite?: boolean;
	isPublic?: boolean;
	archivedAt?: string | null;
}

// ─── Clock Types ────────────────────────────────────────────

export interface CrossAppAlarm extends BaseRecord {
	label?: string;
	time: string;
	enabled: boolean;
	repeatDays?: number[];
}

export interface CrossAppTimer extends BaseRecord {
	label?: string;
	durationSeconds: number;
	remainingSeconds: number;
	status: 'idle' | 'running' | 'paused' | 'finished';
	startedAt?: string;
}

// ─── Storage Types ──────────────────────────────────────────

export interface CrossAppFile extends BaseRecord {
	name: string;
	originalName?: string;
	mimeType?: string;
	size?: number;
	parentFolderId?: string | null;
	isFavorite?: boolean;
	isDeleted?: boolean;
}

export interface CrossAppFolder extends BaseRecord {
	name: string;
	parentFolderId?: string | null;
	path?: string;
	depth?: number;
	isFavorite?: boolean;
	isDeleted?: boolean;
}

// ─── Mukke Types ────────────────────────────────────────────

export interface CrossAppSong extends BaseRecord {
	title: string;
	artist?: string;
	album?: string;
	duration?: number;
	favorite?: boolean;
}

export interface CrossAppPlaylist extends BaseRecord {
	name: string;
	description?: string;
}

// ─── Presi Types ────────────────────────────────────────────

export interface CrossAppDeck extends BaseRecord {
	title: string;
	description?: string;
	isPublic?: boolean;
}

export interface CrossAppSlide extends BaseRecord {
	deckId: string;
	order: number;
	content?: unknown;
}

// ─── Context Types ──────────────────────────────────────────

export interface CrossAppSpace extends BaseRecord {
	name: string;
	description?: string;
	pinned?: boolean;
}

export interface CrossAppDocument extends BaseRecord {
	spaceId: string;
	title: string;
	type?: 'text' | 'context' | 'prompt';
	pinned?: boolean;
}

// ─── ManaDeck Types ─────────────────────────────────────────

export interface CrossAppManadeckDeck extends BaseRecord {
	name: string;
	description?: string;
	color?: string;
	cardCount?: number;
	lastStudied?: string;
	isPublic?: boolean;
}

export interface CrossAppManadeckCard extends BaseRecord {
	deckId: string;
	front: string;
	back: string;
	difficulty?: number;
	nextReview?: string;
	reviewCount?: number;
}

// ─── Store Instances ────────────────────────────────────────
// These open existing IndexedDB databases created by other apps.
// No sync config — ManaCore only reads, the owning app handles sync.

export const todoReader = createLocalStore({
	appId: 'todo',
	collections: [
		{
			name: 'tasks',
			indexes: [
				'projectId',
				'dueDate',
				'isCompleted',
				'priority',
				'order',
				'[isCompleted+order]',
				'[projectId+order]',
			],
		},
		{
			name: 'projects',
			indexes: ['order', 'isArchived'],
		},
	],
});

export const calendarReader = createLocalStore({
	appId: 'calendar',
	collections: [
		{
			name: 'events',
			indexes: ['calendarId', 'startDate', 'endDate', 'allDay', '[calendarId+startDate]'],
		},
		{
			name: 'calendars',
			indexes: ['isDefault', 'isVisible'],
		},
	],
});

export const contactsReader = createLocalStore({
	appId: 'contacts',
	collections: [
		{
			name: 'contacts',
			indexes: ['firstName', 'lastName', 'email', 'company', 'isFavorite', 'isArchived'],
		},
	],
});

export const chatReader = createLocalStore({
	appId: 'chat',
	collections: [
		{ name: 'conversations', indexes: ['isArchived', 'isPinned', 'spaceId'] },
		{ name: 'messages', indexes: ['conversationId', 'sender', '[conversationId+sender]'] },
	],
});

export const zitareReader = createLocalStore({
	appId: 'zitare',
	collections: [{ name: 'favorites', indexes: ['quoteId'] }],
});

export const pictureReader = createLocalStore({
	appId: 'picture',
	collections: [{ name: 'images', indexes: ['isFavorite', 'isPublic', 'archivedAt', 'prompt'] }],
});

export const clockReader = createLocalStore({
	appId: 'clock',
	collections: [
		{ name: 'alarms', indexes: ['enabled', 'time'] },
		{ name: 'timers', indexes: ['status'] },
	],
});

export const storageReader = createLocalStore({
	appId: 'storage',
	collections: [
		{
			name: 'files',
			indexes: ['parentFolderId', 'mimeType', 'isFavorite', 'isDeleted', 'name'],
		},
		{ name: 'folders', indexes: ['parentFolderId', 'path', 'depth', 'isFavorite', 'isDeleted'] },
	],
});

export const mukkeReader = createLocalStore({
	appId: 'mukke',
	collections: [
		{ name: 'songs', indexes: ['artist', 'album', 'genre', 'favorite', 'title'] },
		{ name: 'playlists', indexes: ['name'] },
	],
});

export const presiReader = createLocalStore({
	appId: 'presi',
	collections: [
		{ name: 'decks', indexes: ['isPublic'] },
		{ name: 'slides', indexes: ['deckId', 'order', '[deckId+order]'] },
	],
});

export const contextReader = createLocalStore({
	appId: 'context',
	collections: [
		{ name: 'spaces', indexes: ['pinned', 'prefix'] },
		{ name: 'documents', indexes: ['spaceId', 'type', 'pinned', 'title', '[spaceId+type]'] },
	],
});

export const manadeckReader = createLocalStore({
	appId: 'manadeck',
	collections: [
		{ name: 'decks', indexes: ['isPublic'] },
		{ name: 'cards', indexes: ['deckId', 'difficulty', 'nextReview', 'order', '[deckId+order]'] },
	],
});

// ─── Typed Collection Accessors ─────────────────────────────

// Todo
export const crossTaskCollection = todoReader.collection<CrossAppTask>('tasks');
export const crossProjectCollection = todoReader.collection<CrossAppProject>('projects');

// Calendar
export const crossEventCollection = calendarReader.collection<CrossAppEvent>('events');
export const crossCalendarCollection = calendarReader.collection<CrossAppCalendar>('calendars');

// Contacts
export const crossContactCollection = contactsReader.collection<CrossAppContact>('contacts');

// Chat
export const crossConversationCollection =
	chatReader.collection<CrossAppConversation>('conversations');
export const crossMessageCollection = chatReader.collection<CrossAppMessage>('messages');

// Zitare
export const crossFavoriteCollection = zitareReader.collection<CrossAppFavorite>('favorites');

// Picture
export const crossImageCollection = pictureReader.collection<CrossAppImage>('images');

// Clock
export const crossAlarmCollection = clockReader.collection<CrossAppAlarm>('alarms');
export const crossTimerCollection = clockReader.collection<CrossAppTimer>('timers');

// Storage
export const crossFileCollection = storageReader.collection<CrossAppFile>('files');
export const crossFolderCollection = storageReader.collection<CrossAppFolder>('folders');

// Mukke
export const crossSongCollection = mukkeReader.collection<CrossAppSong>('songs');
export const crossPlaylistCollection = mukkeReader.collection<CrossAppPlaylist>('playlists');

// Presi
export const crossPresiDeckCollection = presiReader.collection<CrossAppDeck>('decks');
export const crossSlideCollection = presiReader.collection<CrossAppSlide>('slides');

// Context
export const crossSpaceCollection = contextReader.collection<CrossAppSpace>('spaces');
export const crossDocumentCollection = contextReader.collection<CrossAppDocument>('documents');

// ManaDeck
export const crossManadeckDeckCollection = manadeckReader.collection<CrossAppManadeckDeck>('decks');
export const crossManadeckCardCollection = manadeckReader.collection<CrossAppManadeckCard>('cards');
