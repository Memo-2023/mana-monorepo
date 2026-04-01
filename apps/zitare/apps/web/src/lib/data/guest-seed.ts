/**
 * Guest seed data for Zitare.
 * Pre-favorited quotes and a sample list to showcase the app.
 */

import type { LocalFavorite, LocalQuoteList } from './local-store';

// Well-known quote IDs from @zitare/content
export const guestFavorites: LocalFavorite[] = [
	{ id: 'fav-1', quoteId: 'mot-1' },
	{ id: 'fav-2', quoteId: 'weis-3' },
	{ id: 'fav-3', quoteId: 'mot-7' },
	{ id: 'fav-4', quoteId: 'weis-1' },
	{ id: 'fav-5', quoteId: 'liebe-1' },
];

export const guestLists: LocalQuoteList[] = [
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
];
