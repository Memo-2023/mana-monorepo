/**
 * Unit tests for the Pelias→PlaceCategory mapping.
 *
 * This is the subtle part of the service: a Pelias venue often has
 * multiple categories (e.g. a restaurant is `['food','retail','nightlife']`)
 * and we need to pick the most specific one. The priority list in
 * category-map.ts encodes that choice, and these tests lock it in.
 */

import { describe, it, expect } from 'bun:test';
import { mapPeliasToPlaceCategory } from '../category-map';

describe('mapPeliasToPlaceCategory', () => {
	describe('priority-ordered multi-category resolution', () => {
		it('picks food over retail for a restaurant', () => {
			expect(mapPeliasToPlaceCategory(['food', 'retail', 'nightlife'])).toBe('food');
		});

		it('picks food over retail for a bakery', () => {
			// Bakery is tagged food+retail in the Pelias OSM taxonomy
			expect(mapPeliasToPlaceCategory(['food', 'retail'])).toBe('food');
		});

		it('picks food over nightlife for a cafe', () => {
			expect(mapPeliasToPlaceCategory(['food', 'nightlife'])).toBe('food');
		});

		it('picks transit over professional for a car_rental', () => {
			// car_rental is tagged transport+professional in Pelias
			expect(mapPeliasToPlaceCategory(['transport', 'professional'])).toBe('transit');
		});

		it('picks transit for a bus_station (multiple transport subcategories)', () => {
			expect(mapPeliasToPlaceCategory(['transport', 'transport:public', 'transport:bus'])).toBe(
				'transit'
			);
		});

		it('picks transit for a station (transport:rail)', () => {
			expect(
				mapPeliasToPlaceCategory([
					'transport',
					'transport:public',
					'transport:station',
					'transport:rail',
				])
			).toBe('transit');
		});
	});

	describe('single-category resolution', () => {
		it('maps food to food', () => {
			expect(mapPeliasToPlaceCategory(['food'])).toBe('food');
		});

		it('maps retail to shopping', () => {
			expect(mapPeliasToPlaceCategory(['retail'])).toBe('shopping');
		});

		it('maps transport to transit', () => {
			expect(mapPeliasToPlaceCategory(['transport'])).toBe('transit');
		});

		it('maps education to work', () => {
			expect(mapPeliasToPlaceCategory(['education'])).toBe('work');
		});

		it('maps professional to work', () => {
			expect(mapPeliasToPlaceCategory(['professional'])).toBe('work');
		});

		it('maps government to work', () => {
			expect(mapPeliasToPlaceCategory(['government'])).toBe('work');
		});

		it('maps finance to work', () => {
			expect(mapPeliasToPlaceCategory(['finance'])).toBe('work');
		});

		it('maps entertainment to leisure', () => {
			expect(mapPeliasToPlaceCategory(['entertainment'])).toBe('leisure');
		});

		it('maps nightlife to leisure', () => {
			expect(mapPeliasToPlaceCategory(['nightlife'])).toBe('leisure');
		});

		it('maps recreation to leisure', () => {
			expect(mapPeliasToPlaceCategory(['recreation'])).toBe('leisure');
		});

		it('maps health to other', () => {
			expect(mapPeliasToPlaceCategory(['health'])).toBe('other');
		});

		it('maps religion to other', () => {
			expect(mapPeliasToPlaceCategory(['religion'])).toBe('other');
		});
	});

	describe('real-world Pelias venue categories', () => {
		// These are literal category arrays observed from the Konstanz DACH
		// index during the 2026-04-11 deploy verification. Locking them in
		// as regression tests so future priority changes can't silently
		// break address search in production.

		it('Konzil Restaurant Konstanz → food', () => {
			expect(mapPeliasToPlaceCategory(['food', 'retail', 'nightlife'])).toBe('food');
		});

		it('Stuttgart Hauptbahnhof → transit', () => {
			expect(
				mapPeliasToPlaceCategory([
					'transport',
					'transport:public',
					'transport:station',
					'transport:rail',
				])
			).toBe('transit');
		});

		it('Physiotherapie-Schule → work', () => {
			expect(mapPeliasToPlaceCategory(['education'])).toBe('work');
		});

		it('MX-Park (Rennstrecke) → leisure', () => {
			expect(mapPeliasToPlaceCategory(['recreation'])).toBe('leisure');
		});

		it('KulturKiosk → work', () => {
			// KulturKiosk is tagged professional in Pelias
			expect(mapPeliasToPlaceCategory(['professional'])).toBe('work');
		});

		it('Kölner Domshop → shopping', () => {
			expect(mapPeliasToPlaceCategory(['retail'])).toBe('shopping');
		});
	});

	describe('empty / null / unknown categories', () => {
		it('returns other for empty array', () => {
			expect(mapPeliasToPlaceCategory([])).toBe('other');
		});

		it('returns other for undefined', () => {
			expect(mapPeliasToPlaceCategory(undefined)).toBe('other');
		});

		it('returns other for null', () => {
			expect(mapPeliasToPlaceCategory(null)).toBe('other');
		});

		it('returns other for unknown category strings', () => {
			expect(mapPeliasToPlaceCategory(['random', 'unknown'])).toBe('other');
		});

		it('picks known category even if unknown ones come first', () => {
			expect(mapPeliasToPlaceCategory(['unknown', 'food'])).toBe('food');
		});
	});

	describe('Pelias layer fallback', () => {
		it('uses layer hint for venue with no categories', () => {
			expect(mapPeliasToPlaceCategory(undefined, 'venue')).toBe('other');
		});

		it('uses layer hint for address', () => {
			expect(mapPeliasToPlaceCategory(undefined, 'address')).toBe('other');
		});

		it('uses layer hint for street', () => {
			expect(mapPeliasToPlaceCategory(undefined, 'street')).toBe('other');
		});

		it('uses layer hint for locality', () => {
			expect(mapPeliasToPlaceCategory(undefined, 'locality')).toBe('other');
		});

		it('prefers categories over layer hint', () => {
			// A venue with food category should be food, not other
			expect(mapPeliasToPlaceCategory(['food'], 'venue')).toBe('food');
		});
	});
});
