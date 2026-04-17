/**
 * Wishes module — barrel exports.
 */

// Stores
export { wishesStore } from './stores/wishes.svelte';
export { listsStore } from './stores/lists.svelte';
export { priceChecksStore } from './stores/price-checks.svelte';

// Queries
export {
	useAllWishes,
	useAllLists,
	usePriceChecks,
	toWish,
	toWishList,
	toPriceCheck,
	filterByStatus,
	filterByPriority,
	filterByList,
	searchWishes,
	getTotalEstimatedCost,
} from './queries';

// Collections
export { wishTable, listTable, priceCheckTable, WISHES_GUEST_SEED } from './collections';

// Types
export type {
	LocalWish,
	LocalWishList,
	LocalPriceCheck,
	Wish,
	WishList,
	PriceCheck,
	WishStatus,
	WishPriority,
} from './types';
