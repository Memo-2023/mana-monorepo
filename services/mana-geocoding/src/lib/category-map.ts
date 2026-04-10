/**
 * Maps Pelias/OSM categories to our 7 Places categories.
 *
 * Pelias returns results with `addendum.osm.category` and `addendum.osm.type`
 * fields that correspond to OSM key/value pairs. We map these to our simple
 * category enum: home, work, food, shopping, transit, leisure, other.
 */

export type PlaceCategory = 'home' | 'work' | 'food' | 'shopping' | 'transit' | 'leisure' | 'other';

/**
 * OSM key → PlaceCategory mapping.
 * The key is the OSM tag key (e.g. "amenity", "shop"), the value maps
 * specific OSM values to our categories. A `_default` entry covers
 * any value not explicitly listed.
 */
const OSM_CATEGORY_MAP: Record<
	string,
	Record<string, PlaceCategory> & { _default?: PlaceCategory }
> = {
	amenity: {
		_default: 'other',
		restaurant: 'food',
		cafe: 'food',
		fast_food: 'food',
		bar: 'food',
		pub: 'food',
		biergarten: 'food',
		food_court: 'food',
		ice_cream: 'food',
		bakery: 'food',
		school: 'work',
		university: 'work',
		college: 'work',
		library: 'work',
		coworking_space: 'work',
		office: 'work',
		bus_station: 'transit',
		ferry_terminal: 'transit',
		taxi: 'transit',
		parking: 'transit',
		fuel: 'transit',
		bicycle_parking: 'transit',
		charging_station: 'transit',
		cinema: 'leisure',
		theatre: 'leisure',
		nightclub: 'leisure',
		community_centre: 'leisure',
		swimming_pool: 'leisure',
		marketplace: 'shopping',
	},
	shop: {
		_default: 'shopping',
		supermarket: 'shopping',
		bakery: 'food',
		butcher: 'food',
		deli: 'food',
		greengrocer: 'food',
		seafood: 'food',
		pastry: 'food',
		cheese: 'food',
		coffee: 'food',
	},
	tourism: {
		_default: 'leisure',
		hotel: 'other',
		hostel: 'other',
		guest_house: 'other',
		motel: 'other',
		apartment: 'home',
	},
	leisure: {
		_default: 'leisure',
		park: 'leisure',
		playground: 'leisure',
		sports_centre: 'leisure',
		fitness_centre: 'leisure',
		stadium: 'leisure',
		swimming_pool: 'leisure',
		garden: 'leisure',
		nature_reserve: 'leisure',
		beach_resort: 'leisure',
		marina: 'leisure',
	},
	railway: {
		_default: 'transit',
		station: 'transit',
		halt: 'transit',
		tram_stop: 'transit',
	},
	aeroway: {
		_default: 'transit',
		aerodrome: 'transit',
		terminal: 'transit',
	},
	highway: {
		_default: 'transit',
		bus_stop: 'transit',
	},
	building: {
		_default: 'other',
		residential: 'home',
		house: 'home',
		apartments: 'home',
		detached: 'home',
		commercial: 'work',
		office: 'work',
		industrial: 'work',
		retail: 'shopping',
		supermarket: 'shopping',
		church: 'leisure',
		cathedral: 'leisure',
		stadium: 'leisure',
		school: 'work',
		university: 'work',
		hospital: 'other',
	},
	office: {
		_default: 'work',
	},
	sport: {
		_default: 'leisure',
	},
};

/**
 * Derive a PlaceCategory from a Pelias result's OSM metadata.
 *
 * Pelias provides category info in several fields depending on the data source.
 * We check them in order of specificity.
 */
export function mapOsmToPlaceCategory(
	osmCategory?: string,
	osmType?: string,
	peliasLayer?: string
): PlaceCategory {
	// Try direct OSM key/value mapping first
	if (osmCategory && osmType) {
		const categoryMap = OSM_CATEGORY_MAP[osmCategory];
		if (categoryMap) {
			return categoryMap[osmType] ?? categoryMap._default ?? 'other';
		}
	}

	// Try just the OSM key as a category
	if (osmCategory) {
		const categoryMap = OSM_CATEGORY_MAP[osmCategory];
		if (categoryMap?._default) {
			return categoryMap._default;
		}
	}

	// Fallback: use Pelias layer as a hint
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
