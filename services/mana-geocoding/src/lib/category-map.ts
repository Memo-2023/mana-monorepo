/**
 * The 7 Places categories used across the geocoding wrapper and clients.
 *
 *   home · work · food · shopping · transit · leisure · other
 *
 * Provider-specific mappers (see `osm-category-map.ts` for Photon /
 * Nominatim) collapse the upstream taxonomy into this shape. `home` is
 * never auto-detected — it's set manually by the user.
 */
export type PlaceCategory = 'home' | 'work' | 'food' | 'shopping' | 'transit' | 'leisure' | 'other';
