/**
 * Maps Pelias categories (OSM taxonomy) to our 7 Places categories.
 *
 * Pelias' openstreetmap importer tags venues with categories from its
 * built-in taxonomy (food, retail, transport, health, education, …).
 * We collapse those into the simpler Places enum:
 *
 *   home · work · food · shopping · transit · leisure · other
 *
 * A venue can have multiple Pelias categories (e.g. a restaurant is
 * tagged `['food', 'retail', 'nightlife']`). We pick the most specific
 * one in priority order rather than the first — a restaurant should be
 * "food" even though "retail" also matches.
 */

export type PlaceCategory = 'home' | 'work' | 'food' | 'shopping' | 'transit' | 'leisure' | 'other';

/**
 * Priority-ordered: first matching category wins. Earlier entries are
 * more specific, so "food" beats "retail", "transport" beats "professional".
 */
const PELIAS_PRIORITY: Array<[string, PlaceCategory]> = [
	// Food is strongest signal — a restaurant is food, not retail
	['food', 'food'],

	// Transit/transport
	['transport:public', 'transit'],
	['transport:air', 'transit'],
	['transport:sea', 'transit'],
	['transport:bus', 'transit'],
	['transport:taxi', 'transit'],
	['transport', 'transit'],

	// Shopping — explicit retail markers
	['retail', 'shopping'],

	// Leisure / entertainment / recreation
	['entertainment', 'leisure'],
	['nightlife', 'leisure'],
	['recreation', 'leisure'],

	// Work-ish
	['education', 'work'],
	['professional', 'work'],
	['government', 'work'],
	['finance', 'work'],

	// Health/religion fall through to other
	['health', 'other'],
	['religion', 'other'],
];

/**
 * Derive a PlaceCategory from a Pelias feature's category array.
 *
 * @param categories The `category` array from a Pelias feature's properties
 * @param peliasLayer The Pelias layer (venue, address, street, …) — used as fallback hint
 */
export function mapPeliasToPlaceCategory(
	categories?: string[] | null,
	peliasLayer?: string
): PlaceCategory {
	if (Array.isArray(categories) && categories.length > 0) {
		// Walk our priority list and pick the first match
		for (const [peliasCat, placeCat] of PELIAS_PRIORITY) {
			if (categories.includes(peliasCat)) return placeCat;
		}
	}

	// Fallback: use Pelias layer as a hint. Addresses/streets/regions
	// all land in "other" since they aren't really "places" in the
	// categorical sense.
	if (peliasLayer) {
		switch (peliasLayer) {
			case 'venue':
				return 'other';
			case 'address':
			case 'street':
				return 'other';
			case 'neighbourhood':
			case 'locality':
			case 'region':
			case 'country':
				return 'other';
		}
	}

	return 'other';
}
