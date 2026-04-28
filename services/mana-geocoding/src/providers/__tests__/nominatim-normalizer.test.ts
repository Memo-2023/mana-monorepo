/**
 * Tests for normalizing Nominatim's flat-JSON shape into our GeocodingResult.
 *
 * Nominatim differs from Photon in three subtle ways we lock in:
 *   1. Lat/lon are STRINGS, not numbers — the normalizer must parseFloat.
 *   2. Display name is a comma-noisy hierarchy ("Konzil, Hafenstraße,
 *      Konstanz, Konstanz, Regierungsbezirk Freiburg, Baden-Württemberg,
 *      Germany"). We build our own label from `address.*` instead.
 *   3. Venue name lives under `address.amenity|shop|tourism|...` depending
 *      on the OSM class. We probe each in priority order.
 */

import { describe, expect, it } from 'bun:test';
import { normalizeNominatimResult } from '../nominatim';

describe('normalizeNominatimResult', () => {
	it('parses string lat/lon into numbers', () => {
		const result = normalizeNominatimResult({
			lat: '47.6634',
			lon: '9.1758',
			class: 'amenity',
			type: 'restaurant',
			display_name: 'Konzil, Konstanz, Germany',
			address: { road: 'Hafenstraße', amenity: 'Konzil', country: 'Germany' },
		});
		expect(typeof result.latitude).toBe('number');
		expect(typeof result.longitude).toBe('number');
		expect(result.latitude).toBeCloseTo(47.6634, 4);
		expect(result.longitude).toBeCloseTo(9.1758, 4);
	});

	it('extracts venue name from address.amenity for restaurants', () => {
		const result = normalizeNominatimResult({
			lat: '47.66',
			lon: '9.17',
			class: 'amenity',
			type: 'restaurant',
			address: { amenity: 'Konzil Restaurant', city: 'Konstanz', country: 'Germany' },
		});
		expect(result.name).toBe('Konzil Restaurant');
		expect(result.category).toBe('food');
	});

	it('extracts venue name from address.shop for retail', () => {
		const result = normalizeNominatimResult({
			lat: '47.66',
			lon: '9.17',
			class: 'shop',
			type: 'supermarket',
			address: { shop: 'Edeka', road: 'Marktstätte', city: 'Konstanz' },
		});
		expect(result.name).toBe('Edeka');
		expect(result.category).toBe('shopping');
	});

	it('falls back to top-level name when no address.* venue name', () => {
		const result = normalizeNominatimResult({
			lat: '47.66',
			lon: '9.17',
			class: 'place',
			type: 'city',
			name: 'Konstanz',
			address: { city: 'Konstanz', country: 'Germany' },
		});
		expect(result.name).toBe('Konstanz');
	});

	it('handles a pure street result (no venue name) without crashing', () => {
		const result = normalizeNominatimResult({
			lat: '47.665',
			lon: '9.176',
			class: 'highway',
			type: 'residential',
			display_name:
				'Münsterplatz, Altstadt, Konstanz, Regierungsbezirk Freiburg, Baden-Württemberg, Germany',
			address: { road: 'Münsterplatz', city: 'Konstanz', country: 'Germany', postcode: '78462' },
		});
		expect(result.name).toBe('');
		expect(result.label).toBe('Münsterplatz, 78462 Konstanz, Germany');
		expect(result.category).toBe('other');
	});

	it('uses display_name as ultimate fallback when nothing structured', () => {
		const result = normalizeNominatimResult({
			lat: '47.0',
			lon: '9.0',
			display_name: 'Some, comma, separated, label',
		});
		expect(result.label).toBe('Some, comma, separated, label');
	});

	it('city falls through town → village → hamlet for rural addresses', () => {
		const village = normalizeNominatimResult({
			lat: '47.0',
			lon: '9.0',
			address: { village: 'Kleinkleckersdorf', country: 'Germany' },
		});
		expect(village.address.city).toBe('Kleinkleckersdorf');

		const hamlet = normalizeNominatimResult({
			lat: '47.0',
			lon: '9.0',
			address: { hamlet: 'Mini-Weiler', country: 'Germany' },
		});
		expect(hamlet.address.city).toBe('Mini-Weiler');
	});

	it('uses neutral 0.5 confidence when importance is missing', () => {
		const result = normalizeNominatimResult({
			lat: '47.0',
			lon: '9.0',
			class: 'amenity',
			type: 'restaurant',
		});
		expect(result.confidence).toBe(0.5);
	});

	it('uses importance score when present', () => {
		const result = normalizeNominatimResult({
			lat: '47.0',
			lon: '9.0',
			class: 'amenity',
			type: 'restaurant',
			importance: 0.83,
		});
		expect(result.confidence).toBeCloseTo(0.83, 2);
	});

	it('marks results with provider:nominatim', () => {
		const result = normalizeNominatimResult({
			lat: '47.0',
			lon: '9.0',
			class: 'place',
			type: 'city',
		});
		expect(result.provider).toBe('nominatim');
	});
});
