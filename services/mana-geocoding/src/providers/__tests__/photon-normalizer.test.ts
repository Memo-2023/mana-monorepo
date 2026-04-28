/**
 * Tests for normalizing Photon's GeoJSON shape into our GeocodingResult.
 *
 * Real-world fixtures captured from photon.komoot.io for DACH queries.
 * The mapping logic is the brittle part — a Photon response shape change
 * (different `osm_key` casing, missing `housenumber`, …) would break our
 * Places UI, so we lock the shape with these tests.
 */

import { describe, expect, it } from 'bun:test';
import { normalizePhotonFeature } from '../photon';

describe('normalizePhotonFeature', () => {
	it('maps a restaurant with full address fields → food', () => {
		const result = normalizePhotonFeature({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [9.1758, 47.6634] },
			properties: {
				osm_id: 12345,
				osm_type: 'N',
				osm_key: 'amenity',
				osm_value: 'restaurant',
				name: 'Konzil',
				country: 'Germany',
				city: 'Konstanz',
				postcode: '78462',
				street: 'Hafenstraße',
				housenumber: '2',
				importance: 0.78,
			},
		});

		expect(result.name).toBe('Konzil');
		expect(result.latitude).toBeCloseTo(47.6634, 4);
		expect(result.longitude).toBeCloseTo(9.1758, 4);
		expect(result.category).toBe('food');
		expect(result.address).toEqual({
			street: 'Hafenstraße',
			houseNumber: '2',
			postalCode: '78462',
			city: 'Konstanz',
			state: undefined,
			country: 'Germany',
		});
		expect(result.confidence).toBeCloseTo(0.78, 2);
		expect(result.provider).toBe('photon');
	});

	it('builds label from structured fields', () => {
		const result = normalizePhotonFeature({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [11.575, 48.137] },
			properties: {
				osm_key: 'railway',
				osm_value: 'station',
				name: 'München Hauptbahnhof',
				country: 'Germany',
				city: 'München',
				postcode: '80335',
			},
		});
		expect(result.label).toBe('München Hauptbahnhof, 80335 München, Germany');
		expect(result.category).toBe('transit');
	});

	it('falls back to district when city is missing (rural addresses)', () => {
		const result = normalizePhotonFeature({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [10.0, 48.5] },
			properties: {
				osm_key: 'place',
				osm_value: 'hamlet',
				name: 'Tiny-Hamlet',
				country: 'Germany',
				district: 'Some-District',
				postcode: '12345',
			},
		});
		expect(result.address.city).toBe('Some-District');
	});

	it('uses neutral 0.5 confidence when importance is missing', () => {
		const result = normalizePhotonFeature({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [9.0, 47.0] },
			properties: { osm_key: 'place', osm_value: 'city', name: 'X' },
		});
		expect(result.confidence).toBe(0.5);
	});

	it('handles a pure address (no name) gracefully', () => {
		const result = normalizePhotonFeature({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [9.176, 47.665] },
			properties: {
				osm_key: 'place',
				osm_value: 'house',
				street: 'Münsterplatz',
				housenumber: '5',
				postcode: '78462',
				city: 'Konstanz',
				country: 'Germany',
			},
		});
		expect(result.name).toBe('');
		// Label still composes from the available parts
		expect(result.label).toBe('Münsterplatz 5, 78462 Konstanz, Germany');
		expect(result.category).toBe('other'); // place:house → other
	});

	it('coordinates: Photon emits [lon, lat] — normalizer must NOT swap', () => {
		// Catches the all-too-easy lon/lat flip in Photon's GeoJSON.
		const result = normalizePhotonFeature({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [9.1758, 47.6634] },
			properties: { osm_key: 'place', osm_value: 'city', name: 'Konstanz' },
		});
		// 9.x is longitude (close to 9°E), 47.x is latitude (close to 47°N).
		// A swap would put us into the Indian Ocean.
		expect(result.longitude).toBeGreaterThan(8);
		expect(result.longitude).toBeLessThan(10);
		expect(result.latitude).toBeGreaterThan(47);
		expect(result.latitude).toBeLessThan(48);
	});

	it('stamps provider:"photon" by default (back-compat)', () => {
		const result = normalizePhotonFeature({
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [9.17, 47.66] },
			properties: { osm_key: 'place', osm_value: 'city', name: 'X' },
		});
		expect(result.provider).toBe('photon');
	});

	it('stamps provider:"photon-self" when called with that name (self-hosted path)', () => {
		// The dual-Photon migration relies on this: a result from the
		// self-hosted instance must NOT look like it came from public
		// komoot. UI uses the provider field to decide whether to show
		// the "approximate match" badge — fallback_used notice fires only
		// for `privacy: 'public'` providers.
		const result = normalizePhotonFeature(
			{
				type: 'Feature',
				geometry: { type: 'Point', coordinates: [9.17, 47.66] },
				properties: { osm_key: 'place', osm_value: 'city', name: 'X' },
			},
			'photon-self'
		);
		expect(result.provider).toBe('photon-self');
	});
});
