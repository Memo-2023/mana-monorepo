/**
 * Zitare module — barrel exports.
 */

export { favoritesStore } from './stores/favorites.svelte';
export { listsStore } from './stores/lists.svelte';
export { quotesStore } from './stores/quotes.svelte';
export { customQuotesStore } from './stores/custom-quotes.svelte';
export { zitareSettings } from './stores/settings.svelte';
export { spiralStore } from './stores/spiral.svelte';
export {
	useAllFavorites,
	useAllLists,
	useAllCustomQuotes,
	toFavorite,
	toQuoteList,
	toCustomQuote,
	isFavorite,
	findFavoriteByQuoteId,
	findListById,
} from './queries';
export type { Favorite, QuoteList, CustomQuote } from './queries';
export { favoriteTable, listTable, customQuoteTable, ZITARE_GUEST_SEED } from './collections';
export type { LocalFavorite, LocalQuoteList, LocalCustomQuote } from './types';
