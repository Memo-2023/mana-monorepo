/**
 * ManaLink — Deep-Link Resolution
 *
 * Maps app + collection + recordId to a full URL that opens
 * the record's detail view in the target app.
 */

import { APP_URLS } from '@mana/shared-branding';
import type { AppIconId } from '@mana/shared-branding';

/** Route pattern per app and collection. Use {id} as placeholder. */
const DEEP_LINK_PATTERNS: Record<string, Record<string, string>> = {
	todo: {
		// Todo uses inline editing, no detail route — link to app root
		tasks: '/',
		projects: '/',
	},
	calendar: {
		events: '/event/{id}',
		calendars: '/',
	},
	contacts: {
		contacts: '/contacts/{id}',
	},
	chat: {
		conversations: '/chat/{id}',
		messages: '/chat/{id}', // Navigate to conversation, not individual message
	},
	picture: {
		images: '/app/board/{id}',
		boards: '/app/board/{id}',
	},
	storage: {
		files: '/',
		folders: '/files/{id}',
	},
	presi: {
		decks: '/deck/{id}',
		slides: '/deck/{id}', // Navigate to the deck containing the slide
	},
	context: {
		documents: '/documents/{id}',
		spaces: '/spaces/{id}',
	},
	cards: {
		decks: '/decks/{id}',
		cards: '/decks/{id}', // Navigate to deck containing the card
	},
	music: {
		songs: '/',
		playlists: '/playlists/{id}',
	},
	clock: {
		alarms: '/',
		timers: '/',
	},
	zitare: {
		favorites: '/',
	},
};

/**
 * Resolve a deep link URL for a cross-app record.
 *
 * @param app - App ID (e.g. 'todo', 'calendar')
 * @param collection - Collection name (e.g. 'tasks', 'events')
 * @param recordId - Record UUID
 * @returns Full URL to the record's detail view, or app root as fallback
 */
export function resolveDeepLink(app: string, collection: string, recordId: string): string {
	const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
	const urls = APP_URLS[app as AppIconId];
	if (!urls) return '#';

	const baseUrl = isDev ? urls.dev : urls.prod;
	const pattern = DEEP_LINK_PATTERNS[app]?.[collection] ?? '/';
	const path = pattern.replace('{id}', recordId);

	return `${baseUrl}${path}`;
}
