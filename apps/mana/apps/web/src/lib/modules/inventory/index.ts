/**
 * Inventar module — barrel exports.
 */

export { collectionsStore } from './stores/collections.svelte';
export { itemsStore } from './stores/items.svelte';
export { locationsStore } from './stores/locations.svelte';
export { categoriesStore } from './stores/categories.svelte';
export { viewStore } from './stores/view.svelte';
export {
	useAllCollections,
	useAllItems,
	useAllLocations,
	useAllCategories,
	toCollection,
	toItem,
	toLocation,
	toCategory,
	getCollectionById,
	getSortedCollections,
	getItemById,
	getItemsByCollection,
	getItemCountByCollection,
	getTotalItemCount,
	getFilteredItems,
	getSortedItems,
	getLocationById,
	getRootLocations,
	getLocationChildren,
	getLocationTree,
	getLocationFullPath,
	getCategoryById,
	getRootCategories,
	getCategoryChildren,
	getCategoryTree,
} from './queries';
export type {
	Collection,
	Item,
	ItemStatus,
	Location,
	Category,
	ViewMode,
	SortOption,
	FilterCriteria,
} from './queries';
export {
	invCollectionTable,
	invItemTable,
	invLocationTable,
	invCategoryTable,
	INVENTORY_GUEST_SEED,
} from './collections';
export type { LocalCollection, LocalItem, LocalLocation, LocalCategory } from './types';
