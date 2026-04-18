/**
 * Provider unit tests — tests the provider registry and individual
 * provider adapters without hitting real APIs.
 */

import { describe, it, expect } from 'bun:test';
import { getProvider, PROVIDER_TYPES } from '../discovery/providers';

describe('Provider registry', () => {
	it('has all expected provider types', () => {
		expect(PROVIDER_TYPES).toContain('ical');
		expect(PROVIDER_TYPES).toContain('website');
		expect(PROVIDER_TYPES).toContain('eventbrite');
		expect(PROVIDER_TYPES).toContain('meetup');
	});

	it('returns a provider for each type', () => {
		for (const type of PROVIDER_TYPES) {
			const provider = getProvider(type);
			expect(provider).not.toBeNull();
			expect(provider!.type).toBe(type);
		}
	});

	it('returns null for unknown type', () => {
		expect(getProvider('unknown')).toBeNull();
		expect(getProvider('')).toBeNull();
	});
});

describe('Eventbrite provider', () => {
	it('requires a region label', async () => {
		const provider = getProvider('eventbrite')!;
		const result = await provider.fetchEvents('', 'Test');
		expect(result.events).toHaveLength(0);
		expect(result.error).toContain('Region label');
	});

	it('requires external service config', async () => {
		const provider = getProvider('eventbrite')!;
		const result = await provider.fetchEvents('', 'Test', {
			lat: 47.997,
			lon: 7.842,
			radiusKm: 25,
			regionLabel: 'Freiburg',
		});
		expect(result.events).toHaveLength(0);
		expect(result.error).toContain('config');
	});
});

describe('Meetup provider', () => {
	it('returns empty with error when API key is not set', async () => {
		const provider = getProvider('meetup')!;
		const result = await provider.fetchEvents('', 'Test', {
			lat: 47.997,
			lon: 7.842,
			radiusKm: 25,
			regionLabel: 'Freiburg',
		});
		expect(result.events).toHaveLength(0);
		expect(result.error).toContain('MEETUP_API_KEY');
	});

	it('gracefully handles missing coordinates (after API key check)', async () => {
		const provider = getProvider('meetup')!;
		const result = await provider.fetchEvents('', 'Test');
		expect(result.events).toHaveLength(0);
		expect(result.error).toBeTruthy();
	});
});

describe('iCal provider', () => {
	it('returns error for invalid URL', async () => {
		const provider = getProvider('ical')!;
		const result = await provider.fetchEvents('not-a-url', 'Test');
		expect(result.events).toHaveLength(0);
		expect(result.error).toBeTruthy();
	});
});

describe('Website provider', () => {
	it('returns error when config is missing', async () => {
		const provider = getProvider('website')!;
		const result = await provider.fetchEvents('https://example.com', 'Test');
		expect(result.events).toHaveLength(0);
		expect(result.error).toContain('config');
	});
});
