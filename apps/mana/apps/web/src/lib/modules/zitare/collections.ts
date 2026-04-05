/**
 * Zitare module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type { LocalFavorite, LocalQuoteList } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const favoriteTable = db.table<LocalFavorite>('zitareFavorites');
export const listTable = db.table<LocalQuoteList>('zitareLists');

// ─── Guest Seed ────────────────────────────────────────────

export const ZITARE_GUEST_SEED = {
	zitareFavorites: [
		{ id: 'fav-1', quoteId: 'mot-1' },
		{ id: 'fav-2', quoteId: 'weis-3' },
		{ id: 'fav-3', quoteId: 'mot-7' },
		{ id: 'fav-4', quoteId: 'weis-1' },
		{ id: 'fav-5', quoteId: 'liebe-1' },
	],
	zitareLists: [
		{
			id: 'list-motivation',
			name: 'Motivation & Antrieb',
			description: 'Zitate die dich voranbringen',
			quoteIds: ['mot-1', 'mot-7', 'mot-3'],
		},
		{
			id: 'list-weisheit',
			name: 'Zeitlose Weisheiten',
			description: 'Die großen Denker und Dichter',
			quoteIds: ['weis-1', 'weis-3', 'weis-5'],
		},
	],
};
