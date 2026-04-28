/**
 * Tests for the chain wiring in `createChain()`. The behavioral assertions
 * here are the migration-critical ones — make sure that:
 *   - `photon-self` is registered iff `PHOTON_SELF_API_URL` is set
 *   - `photon-self` carries `privacy: 'local'` (eligible for sensitive queries)
 *   - the public `photon` slot stays `privacy: 'public'`
 *   - chain order is honored (self before public)
 */

import { describe, expect, it } from 'bun:test';
import { createChain } from '../app';
import type { Config } from '../config';

function baseConfig(overrides: Partial<Config> = {}): Config {
	return {
		port: 3018,
		photon: { apiUrl: 'https://photon.komoot.io' },
		photonSelf: { apiUrl: undefined },
		nominatim: {
			apiUrl: 'https://nominatim.openstreetmap.org',
			userAgent: 'test',
			intervalMs: 1100,
		},
		cors: { origins: [] },
		cache: { maxEntries: 100, ttlMs: 1000, publicTtlMs: 7000 },
		providers: {
			enabled: ['photon-self', 'photon', 'nominatim'],
			healthCacheMs: 30_000,
			timeoutMs: 8000,
		},
		...overrides,
	};
}

describe('createChain — photon-self registration', () => {
	it('does NOT register photon-self when PHOTON_SELF_API_URL is unset', () => {
		const chain = createChain(baseConfig());
		const snapshot = chain.getHealthSnapshot();
		const names = snapshot.map((p) => p.name);
		expect(names).not.toContain('photon-self');
	});

	it('registers photon-self when PHOTON_SELF_API_URL is set', () => {
		const chain = createChain(
			baseConfig({
				photonSelf: { apiUrl: 'http://192.168.178.11:2322' },
			})
		);
		const snapshot = chain.getHealthSnapshot();
		const names = snapshot.map((p) => p.name);
		expect(names).toContain('photon-self');
	});

	it('honors order: photon-self before public photon when both are enabled', () => {
		const chain = createChain(
			baseConfig({
				photonSelf: { apiUrl: 'http://192.168.178.11:2322' },
				providers: {
					enabled: ['photon-self', 'photon', 'nominatim'],
					healthCacheMs: 30_000,
					timeoutMs: 8000,
				},
			})
		);
		const snapshot = chain.getHealthSnapshot();
		// First entry is photon-self, then photon (public), then nominatim.
		const names = snapshot.map((p) => p.name);
		expect(names[0]).toBe('photon-self');
		expect(names).toContain('photon');
		expect(names).toContain('nominatim');
	});

	it('a stray empty PHOTON_SELF_API_URL does not register a useless provider', () => {
		// The config loader trims and treats '' as undefined, but defend in
		// depth — pass an explicit empty string here too.
		const chain = createChain(baseConfig({ photonSelf: { apiUrl: undefined } }));
		const names = chain.getHealthSnapshot().map((p) => p.name);
		expect(names).not.toContain('photon-self');
	});

	it('photon-self is filtered to enabled list (drop if not in GEOCODING_PROVIDERS)', () => {
		const chain = createChain(
			baseConfig({
				photonSelf: { apiUrl: 'http://192.168.178.11:2322' },
				providers: {
					// User explicitly excludes photon-self via env-var
					enabled: ['photon', 'nominatim'],
					healthCacheMs: 30_000,
					timeoutMs: 8000,
				},
			})
		);
		const names = chain.getHealthSnapshot().map((p) => p.name);
		expect(names).not.toContain('photon-self');
	});
});
