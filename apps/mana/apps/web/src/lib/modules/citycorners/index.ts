/**
 * CityCorners module — barrel exports.
 */

export { favoritesStore } from './stores/favorites.svelte';
export {
	useAllCities,
	useAllLocations,
	useAllFavorites,
	getFavoriteIds,
	isFavorite,
	filterByCity,
	filterByCategory,
	searchLocations,
	searchCities,
	findCityBySlug,
	getLocationCountByCity,
	getCityStats,
	getPlatformStats,
} from './queries';
export type { CityStats, PlatformStats } from './queries';
export { cityTable, ccLocationTable, ccFavoriteTable, CITYCORNERS_GUEST_SEED } from './collections';
export type { LocalCity, LocalLocation, LocalFavorite } from './types';
export { CATEGORY_KEYS, CATEGORY_COLORS } from './types';
export { isOpenNow, haversine, formatDistance } from './utils/opening-hours';
