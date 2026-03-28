/**
 * Shared Store Factories for ManaCore Apps
 * Provides reusable Svelte 5 runes-based stores.
 */

export { createToastStore, type Toast, type ToastStore, type ToastType } from './toast.svelte';
export {
	createNavigationStore,
	type NavigationItem,
	type NavigationStore,
} from './navigation.svelte';
export { createThemeStore, type ThemeStore, type ThemeMode } from './theme.svelte';
export {
	createAppSettingsStore,
	type AppSettingsStore,
	type AppSettingsStoreOptions,
} from './settings.svelte';
export {
	createSimpleNavigationStores,
	type SimpleNavigationStores,
	type SimpleNavigationOptions,
} from './navigation-simple';
export { createTagStore, type TagStore, type TagStoreConfig } from './tags.svelte';
export {
	tagLocalStore,
	tagCollection,
	tagGroupCollection,
	tagMutations,
	useAllTags,
	useAllTagGroups,
	getTagById,
	getTagsByIds,
	getTagColor,
	getTagsByGroup,
	toTag,
	toTagGroup,
	type LocalTag,
	type LocalTagGroup,
} from './tags-local.svelte';
