/**
 * Zitare — Local-First Data Layer
 *
 * Collections: favorites, lists
 * Quotes themselves are static content from @zitare/content, not synced.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestFavorites, guestLists } from './guest-seed';

export interface LocalFavorite extends BaseRecord {
	quoteId: string;
}

export interface LocalQuoteList extends BaseRecord {
	name: string;
	description?: string | null;
	quoteIds: string[];
}

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const zitareStore = createLocalStore({
	appId: 'zitare',
	collections: [
		{
			name: 'favorites',
			indexes: ['quoteId'],
			guestSeed: guestFavorites,
		},
		{
			name: 'lists',
			indexes: [],
			guestSeed: guestLists,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

export const favoriteCollection = zitareStore.collection<LocalFavorite>('favorites');
export const listCollection = zitareStore.collection<LocalQuoteList>('lists');
