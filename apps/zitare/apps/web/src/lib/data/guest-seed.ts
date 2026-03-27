/**
 * Guest seed data for Zitare.
 * Pre-favorited quotes and a sample list to showcase the app.
 */

import type { LocalFavorite, LocalQuoteList } from './local-store';

// Some well-known quote IDs from the content package
export const guestFavorites: LocalFavorite[] = [
	{ id: 'fav-1', quoteId: 'mot-1' },
	{ id: 'fav-2', quoteId: 'weis-3' },
	{ id: 'fav-3', quoteId: 'mot-7' },
];

export const guestLists: LocalQuoteList[] = [
	{
		id: 'list-onboarding',
		name: 'Meine Lieblingszitate',
		description: 'Eine Beispiel-Sammlung zum Ausprobieren',
		quoteIds: ['mot-1', 'weis-3'],
	},
];
