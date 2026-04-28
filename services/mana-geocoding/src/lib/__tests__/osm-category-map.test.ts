/**
 * Unit tests for the raw-OSM-tag → PlaceCategory mapper.
 *
 * Covers the cases Photon and Nominatim emit for typical DACH queries.
 * The Pelias mapper has its own tests in category-map.test.ts; this file
 * tests *only* the raw-OSM-tag path used by the public-API fallbacks.
 */

import { describe, expect, it } from 'bun:test';
import { mapOsmTagToPlaceCategory } from '../osm-category-map';

describe('mapOsmTagToPlaceCategory', () => {
	describe('food (highest priority)', () => {
		it('amenity:restaurant → food', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'restaurant')).toBe('food');
		});
		it('amenity:cafe → food', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'cafe')).toBe('food');
		});
		it('amenity:bar → food (not leisure)', () => {
			// Bars sit at the food/leisure boundary. We pick food because the
			// Places UI groups bars next to restaurants visually.
			expect(mapOsmTagToPlaceCategory('amenity', 'bar')).toBe('food');
		});
		it('shop:bakery → food (not shopping)', () => {
			// Bakery is technically `shop` in OSM but functionally food. We
			// special-case the shop subtypes that are food.
			expect(mapOsmTagToPlaceCategory('shop', 'bakery')).toBe('food');
		});
		it('shop:butcher → food', () => {
			expect(mapOsmTagToPlaceCategory('shop', 'butcher')).toBe('food');
		});
	});

	describe('transit', () => {
		it('public_transport:station → transit', () => {
			expect(mapOsmTagToPlaceCategory('public_transport', 'station')).toBe('transit');
		});
		it('public_transport (any value) → transit', () => {
			// Any value of public_transport falls under transit
			expect(mapOsmTagToPlaceCategory('public_transport', 'platform')).toBe('transit');
			expect(mapOsmTagToPlaceCategory('public_transport', 'stop_position')).toBe('transit');
		});
		it('railway:station → transit', () => {
			expect(mapOsmTagToPlaceCategory('railway', 'station')).toBe('transit');
		});
		it('railway:tram_stop → transit', () => {
			expect(mapOsmTagToPlaceCategory('railway', 'tram_stop')).toBe('transit');
		});
		it('highway:bus_stop → transit', () => {
			expect(mapOsmTagToPlaceCategory('highway', 'bus_stop')).toBe('transit');
		});
		it('aeroway:aerodrome → transit', () => {
			expect(mapOsmTagToPlaceCategory('aeroway', 'aerodrome')).toBe('transit');
		});
		it('amenity:car_rental → transit', () => {
			// Matches Pelias mapper's "car_rental → transit" decision
			expect(mapOsmTagToPlaceCategory('amenity', 'car_rental')).toBe('transit');
		});
	});

	describe('shopping (after food, so bakery/butcher fall to food first)', () => {
		it('shop:supermarket → shopping', () => {
			expect(mapOsmTagToPlaceCategory('shop', 'supermarket')).toBe('shopping');
		});
		it('shop:clothes → shopping', () => {
			expect(mapOsmTagToPlaceCategory('shop', 'clothes')).toBe('shopping');
		});
		it('shop:electronics → shopping', () => {
			expect(mapOsmTagToPlaceCategory('shop', 'electronics')).toBe('shopping');
		});
		it('amenity:marketplace → shopping', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'marketplace')).toBe('shopping');
		});
	});

	describe('leisure', () => {
		it('leisure:park → leisure', () => {
			expect(mapOsmTagToPlaceCategory('leisure', 'park')).toBe('leisure');
		});
		it('tourism:attraction → leisure', () => {
			expect(mapOsmTagToPlaceCategory('tourism', 'attraction')).toBe('leisure');
		});
		it('amenity:cinema → leisure', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'cinema')).toBe('leisure');
		});
		it('amenity:theatre → leisure', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'theatre')).toBe('leisure');
		});
		it('amenity:nightclub → leisure', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'nightclub')).toBe('leisure');
		});
		it('sport:tennis → leisure', () => {
			expect(mapOsmTagToPlaceCategory('sport', 'tennis')).toBe('leisure');
		});
	});

	describe('work', () => {
		it('amenity:school → work', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'school')).toBe('work');
		});
		it('amenity:university → work', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'university')).toBe('work');
		});
		it('amenity:bank → work', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'bank')).toBe('work');
		});
		it('amenity:townhall → work', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'townhall')).toBe('work');
		});
		it('office:* → work', () => {
			expect(mapOsmTagToPlaceCategory('office', 'company')).toBe('work');
			expect(mapOsmTagToPlaceCategory('office', 'lawyer')).toBe('work');
		});
	});

	describe('other (health/religion/unknown)', () => {
		it('amenity:hospital → other', () => {
			// Health goes to other (matches Pelias mapper)
			expect(mapOsmTagToPlaceCategory('amenity', 'hospital')).toBe('other');
		});
		it('amenity:pharmacy → other', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'pharmacy')).toBe('other');
		});
		it('healthcare:doctor → other', () => {
			expect(mapOsmTagToPlaceCategory('healthcare', 'doctor')).toBe('other');
		});
		it('amenity:place_of_worship → other', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'place_of_worship')).toBe('other');
		});
		it('unknown class → other', () => {
			expect(mapOsmTagToPlaceCategory('weirdkey', 'weirdvalue')).toBe('other');
		});
		it('undefined inputs → other', () => {
			expect(mapOsmTagToPlaceCategory()).toBe('other');
			expect(mapOsmTagToPlaceCategory(undefined, undefined)).toBe('other');
			expect(mapOsmTagToPlaceCategory('amenity')).toBe('other'); // amenity without value
		});
		it('place:city → other (no street/road match)', () => {
			// Address-layer responses fall through to other
			expect(mapOsmTagToPlaceCategory('place', 'city')).toBe('other');
		});
	});

	describe('priority — value-specific entries beat key-only entries', () => {
		it('shop:bakery is food, but shop:somethingElse is shopping', () => {
			expect(mapOsmTagToPlaceCategory('shop', 'bakery')).toBe('food');
			expect(mapOsmTagToPlaceCategory('shop', 'supermarket')).toBe('shopping');
		});
		it('amenity:cinema is leisure, but amenity:marketplace is shopping', () => {
			expect(mapOsmTagToPlaceCategory('amenity', 'cinema')).toBe('leisure');
			expect(mapOsmTagToPlaceCategory('amenity', 'marketplace')).toBe('shopping');
		});
	});
});
