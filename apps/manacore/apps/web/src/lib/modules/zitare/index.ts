/**
 * Zitare module — barrel exports.
 */

export { favoritesStore } from './stores/favorites.svelte';
export { listsStore } from './stores/lists.svelte';
export { quotesStore } from './stores/quotes.svelte';
export { zitareSettings } from './stores/settings.svelte';
export { spiralStore } from './stores/spiral.svelte';
export {
	useAllFavorites,
	useAllLists,
	toFavorite,
	toQuoteList,
	isFavorite,
	findFavoriteByQuoteId,
	findListById,
} from './queries';
export type { Favorite, QuoteList } from './queries';
export { favoriteTable, listTable, ZITARE_GUEST_SEED } from './collections';
export type { LocalFavorite, LocalQuoteList } from './types';
