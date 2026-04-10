/**
 * Places module — barrel exports.
 */

export { placesStore } from './stores/places.svelte';
export { trackingStore } from './stores/tracking.svelte';
export {
	useAllPlaces,
	useLocationLogs,
	toPlace,
	toLocationLog,
	searchPlaces,
	filterFavorites,
	filterActive,
	getDistanceKm,
	findNearestPlace,
} from './queries';
export { placeTable, locationLogTable, PLACES_GUEST_SEED } from './collections';
export { searchAddress, reverseGeocode, formatAddress } from './geocoding';
export type { GeocodingResult } from './geocoding';
export type { LocalPlace, LocalLocationLog, Place, LocationLog, PlaceCategory } from './types';
