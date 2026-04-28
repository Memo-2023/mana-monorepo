/**
 * Maps raw OSM `class:type` tags (Photon's `osm_key:osm_value`,
 * Nominatim's `class:type`) to our 7 PlaceCategories.
 *
 * Pelias has a curated multi-category taxonomy (`food`, `retail`,
 * `transport`, …) that we map via `category-map.ts`. Photon and Nominatim
 * return raw OSM tags instead — `amenity:restaurant`, `shop:supermarket`,
 * `public_transport:station`, etc. — so they need a different lookup.
 *
 * The list below is intentionally narrow: it only covers tags we actually
 * see in real Photon/Nominatim responses for DACH queries. Anything else
 * falls through to `other`, which matches the Pelias mapper's behavior for
 * unknown categories.
 *
 * If a query returns a tag we don't handle, that's the signal to add it
 * here — not to try to enumerate all 1000+ OSM types.
 */

import type { PlaceCategory } from './category-map';

interface Tag {
	key: string;
	value?: string;
}

/**
 * Priority-ordered: first match wins. More-specific entries (with a
 * `value`) come before generic key-only entries. Matches Pelias's
 * "food beats retail" priority intent.
 */
const OSM_RULES: Array<{ match: Tag; category: PlaceCategory }> = [
	// ── Food (highest priority — restaurants are food, even when also
	//    tagged amenity or shop) ───────────────────────────────────────
	{ match: { key: 'amenity', value: 'restaurant' }, category: 'food' },
	{ match: { key: 'amenity', value: 'cafe' }, category: 'food' },
	{ match: { key: 'amenity', value: 'fast_food' }, category: 'food' },
	{ match: { key: 'amenity', value: 'bar' }, category: 'food' },
	{ match: { key: 'amenity', value: 'pub' }, category: 'food' },
	{ match: { key: 'amenity', value: 'biergarten' }, category: 'food' },
	{ match: { key: 'amenity', value: 'food_court' }, category: 'food' },
	{ match: { key: 'amenity', value: 'ice_cream' }, category: 'food' },
	{ match: { key: 'shop', value: 'bakery' }, category: 'food' },
	{ match: { key: 'shop', value: 'butcher' }, category: 'food' },
	{ match: { key: 'shop', value: 'confectionery' }, category: 'food' },

	// ── Transit ───────────────────────────────────────────────────────
	{ match: { key: 'public_transport' }, category: 'transit' },
	{ match: { key: 'railway', value: 'station' }, category: 'transit' },
	{ match: { key: 'railway', value: 'halt' }, category: 'transit' },
	{ match: { key: 'railway', value: 'tram_stop' }, category: 'transit' },
	{ match: { key: 'highway', value: 'bus_stop' }, category: 'transit' },
	{ match: { key: 'aeroway' }, category: 'transit' },
	{ match: { key: 'amenity', value: 'bus_station' }, category: 'transit' },
	{ match: { key: 'amenity', value: 'taxi' }, category: 'transit' },
	{ match: { key: 'amenity', value: 'ferry_terminal' }, category: 'transit' },
	{ match: { key: 'amenity', value: 'car_rental' }, category: 'transit' },
	{ match: { key: 'amenity', value: 'parking' }, category: 'transit' },

	// ── Shopping (after food so bakery/butcher don't fall here) ──────
	{ match: { key: 'shop' }, category: 'shopping' },
	{ match: { key: 'amenity', value: 'marketplace' }, category: 'shopping' },

	// ── Leisure / entertainment ──────────────────────────────────────
	{ match: { key: 'leisure' }, category: 'leisure' },
	{ match: { key: 'tourism' }, category: 'leisure' },
	{ match: { key: 'amenity', value: 'cinema' }, category: 'leisure' },
	{ match: { key: 'amenity', value: 'theatre' }, category: 'leisure' },
	{ match: { key: 'amenity', value: 'nightclub' }, category: 'leisure' },
	{ match: { key: 'amenity', value: 'arts_centre' }, category: 'leisure' },
	{ match: { key: 'sport' }, category: 'leisure' },

	// ── Work-ish ─────────────────────────────────────────────────────
	{ match: { key: 'amenity', value: 'school' }, category: 'work' },
	{ match: { key: 'amenity', value: 'university' }, category: 'work' },
	{ match: { key: 'amenity', value: 'college' }, category: 'work' },
	{ match: { key: 'amenity', value: 'kindergarten' }, category: 'work' },
	{ match: { key: 'amenity', value: 'library' }, category: 'work' },
	{ match: { key: 'amenity', value: 'bank' }, category: 'work' },
	{ match: { key: 'amenity', value: 'post_office' }, category: 'work' },
	{ match: { key: 'amenity', value: 'courthouse' }, category: 'work' },
	{ match: { key: 'amenity', value: 'townhall' }, category: 'work' },
	{ match: { key: 'amenity', value: 'embassy' }, category: 'work' },
	{ match: { key: 'office' }, category: 'work' },

	// ── Health / religion → other (matches Pelias mapper) ───────────
	{ match: { key: 'amenity', value: 'hospital' }, category: 'other' },
	{ match: { key: 'amenity', value: 'clinic' }, category: 'other' },
	{ match: { key: 'amenity', value: 'doctors' }, category: 'other' },
	{ match: { key: 'amenity', value: 'pharmacy' }, category: 'other' },
	{ match: { key: 'amenity', value: 'dentist' }, category: 'other' },
	{ match: { key: 'amenity', value: 'veterinary' }, category: 'other' },
	{ match: { key: 'healthcare' }, category: 'other' },
	{ match: { key: 'amenity', value: 'place_of_worship' }, category: 'other' },
	{ match: { key: 'amenity', value: 'grave_yard' }, category: 'other' },

	// Address-layer responses (no class/type, just a road match) →
	// caller passes `place`/`highway` here, fall through to other
];

/**
 * Map a single OSM `class:type` pair to a PlaceCategory.
 *
 * @param key   Photon's `osm_key` or Nominatim's `class` (e.g. `amenity`)
 * @param value Photon's `osm_value` or Nominatim's `type` (e.g. `restaurant`)
 */
export function mapOsmTagToPlaceCategory(key?: string, value?: string): PlaceCategory {
	if (!key) return 'other';

	for (const rule of OSM_RULES) {
		if (rule.match.key !== key) continue;
		if (rule.match.value && rule.match.value !== value) continue;
		return rule.category;
	}

	return 'other';
}
