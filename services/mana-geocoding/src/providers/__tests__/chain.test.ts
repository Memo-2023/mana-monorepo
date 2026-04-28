/**
 * Tests for the provider chain — failover, health-cache, fall-through
 * semantics. Uses fake providers so we don't hit any real backend.
 */

import { beforeEach, describe, expect, it } from 'bun:test';
import { ProviderChain } from '../chain';
import type {
	GeocodingProvider,
	GeocodingResult,
	ProviderName,
	ProviderResponse,
	ReverseRequest,
	SearchRequest,
} from '../types';

class FakeProvider implements GeocodingProvider {
	calls = { search: 0, reverse: 0, health: 0 };
	healthCalls: number[] = [];
	readonly privacy: 'local' | 'public';

	constructor(
		readonly name: ProviderName,
		private behavior: {
			search?: () => Promise<ProviderResponse>;
			reverse?: () => Promise<ProviderResponse>;
			health?: () => Promise<boolean>;
			privacy?: 'local' | 'public';
		} = {}
	) {
		// Default to 'local' so existing chain tests keep working. The
		// localOnly-mode tests below set this explicitly.
		this.privacy = behavior.privacy ?? 'local';
	}

	async search(_req: SearchRequest): Promise<ProviderResponse> {
		this.calls.search++;
		return this.behavior.search ? this.behavior.search() : okResults(this.name);
	}

	async reverse(_req: ReverseRequest): Promise<ProviderResponse> {
		this.calls.reverse++;
		return this.behavior.reverse ? this.behavior.reverse() : okResults(this.name);
	}

	async health(): Promise<boolean> {
		this.calls.health++;
		this.healthCalls.push(Date.now());
		return this.behavior.health ? this.behavior.health() : true;
	}
}

function okResults(provider: ProviderName, count = 1): ProviderResponse {
	const results: GeocodingResult[] = Array.from({ length: count }, (_, i) => ({
		label: `${provider} result ${i}`,
		name: `name-${i}`,
		latitude: 47.66 + i * 0.01,
		longitude: 9.17 + i * 0.01,
		address: { city: 'Konstanz' },
		category: 'other',
		confidence: 0.9,
		provider,
	}));
	return { ok: true, results };
}

const SEARCH: SearchRequest = { q: 'test', limit: 5, lang: 'de' };

describe('ProviderChain — happy path', () => {
	it('returns the first provider that succeeds', async () => {
		const a = new FakeProvider('photon-self');
		const b = new FakeProvider('photon');
		const chain = new ProviderChain({
			providers: [a, b],
			healthCacheMs: 60_000,
		});
		const res = await chain.search(SEARCH);
		expect(res.ok).toBe(true);
		expect(res.provider).toBe('photon-self');
		expect(res.tried).toEqual(['photon-self']);
		expect(a.calls.search).toBe(1);
		expect(b.calls.search).toBe(0);
	});

	it('honors the providers array order', async () => {
		const photon = new FakeProvider('photon');
		const local = new FakeProvider('photon-self');
		// photon first this time
		const chain = new ProviderChain({
			providers: [photon, local],
			healthCacheMs: 60_000,
		});
		const res = await chain.search(SEARCH);
		expect(res.provider).toBe('photon');
		expect(local.calls.search).toBe(0);
	});
});

describe('ProviderChain — failover', () => {
	it('falls through on unreachable, returns next provider', async () => {
		const a = new FakeProvider('photon-self', {
			search: async () => ({ ok: false, kind: 'unreachable', status: 503 }),
		});
		const b = new FakeProvider('photon');
		const chain = new ProviderChain({ providers: [a, b], healthCacheMs: 60_000 });
		const res = await chain.search(SEARCH);
		expect(res.ok).toBe(true);
		expect(res.provider).toBe('photon');
		expect(res.tried).toEqual(['photon-self', 'photon']);
	});

	it('falls through on rate_limited', async () => {
		const a = new FakeProvider('photon', {
			search: async () => ({ ok: false, kind: 'rate_limited', status: 429 }),
		});
		const b = new FakeProvider('nominatim');
		const chain = new ProviderChain({ providers: [a, b], healthCacheMs: 60_000 });
		const res = await chain.search(SEARCH);
		expect(res.provider).toBe('nominatim');
	});

	it('STOPS on empty results — does not consume fallback budget', async () => {
		// A clean empty answer is definitive: don't burn through public APIs.
		const a = new FakeProvider('photon-self', {
			search: async () => ({ ok: true, results: [] }),
		});
		const b = new FakeProvider('photon');
		const chain = new ProviderChain({ providers: [a, b], healthCacheMs: 60_000 });
		const res = await chain.search(SEARCH);
		expect(res.ok).toBe(true);
		expect(res.provider).toBe('photon-self');
		expect(res.results).toEqual([]);
		expect(b.calls.search).toBe(0);
	});

	it('returns ok:false when all providers fail', async () => {
		const a = new FakeProvider('photon-self', {
			search: async () => ({ ok: false, kind: 'unreachable' }),
		});
		const b = new FakeProvider('photon', {
			search: async () => ({ ok: false, kind: 'unreachable' }),
		});
		const chain = new ProviderChain({ providers: [a, b], healthCacheMs: 60_000 });
		const res = await chain.search(SEARCH);
		expect(res.ok).toBe(false);
		expect(res.results).toEqual([]);
		expect(res.tried).toEqual(['photon-self', 'photon']);
	});
});

describe('ProviderChain — health cache', () => {
	it('skips a provider whose health probe returned false', async () => {
		const dead = new FakeProvider('photon-self', { health: async () => false });
		const alive = new FakeProvider('photon');
		const chain = new ProviderChain({ providers: [dead, alive], healthCacheMs: 60_000 });
		const res = await chain.search(SEARCH);
		expect(res.tried).toEqual(['photon']); // local was skipped, not tried
		expect(dead.calls.search).toBe(0);
		expect(dead.calls.health).toBe(1);
	});

	it('caches health for healthCacheMs — only one probe per window', async () => {
		const a = new FakeProvider('photon-self');
		const chain = new ProviderChain({ providers: [a], healthCacheMs: 60_000 });
		await chain.search(SEARCH);
		await chain.search(SEARCH);
		await chain.search(SEARCH);
		expect(a.calls.health).toBe(1); // health probed once, then cached
		expect(a.calls.search).toBe(3);
	});

	it('marks provider unhealthy when search fails, skipping it next time', async () => {
		let failNext = true;
		const flaky = new FakeProvider('photon-self', {
			search: async () =>
				failNext ? { ok: false, kind: 'unreachable' } : okResults('photon-self'),
		});
		const alive = new FakeProvider('photon');
		const chain = new ProviderChain({ providers: [flaky, alive], healthCacheMs: 60_000 });

		// First call: local fails → cached unhealthy → photon serves
		const r1 = await chain.search(SEARCH);
		expect(r1.provider).toBe('photon');
		expect(r1.tried).toEqual(['photon-self', 'photon']);

		// Second call: local is in unhealthy cache, not tried at all
		failNext = false; // would now succeed but never gets called
		const r2 = await chain.search(SEARCH);
		expect(r2.provider).toBe('photon');
		expect(r2.tried).toEqual(['photon']);
		expect(flaky.calls.search).toBe(1);
	});

	it('refreshes health after cache expires', async () => {
		const dead = new FakeProvider('photon-self', { health: async () => false });
		const alive = new FakeProvider('photon');
		// 1ms cache for fast test
		const chain = new ProviderChain({ providers: [dead, alive], healthCacheMs: 1 });
		await chain.search(SEARCH);
		await new Promise((r) => setTimeout(r, 5));
		await chain.search(SEARCH);
		// Health re-probed after expiry
		expect(dead.calls.health).toBe(2);
	});

	it('clearHealthCache forces re-probe', async () => {
		const a = new FakeProvider('photon-self');
		const chain = new ProviderChain({ providers: [a], healthCacheMs: 60_000 });
		await chain.search(SEARCH);
		expect(a.calls.health).toBe(1);
		chain.clearHealthCache();
		await chain.search(SEARCH);
		expect(a.calls.health).toBe(2);
	});
});

describe('ProviderChain — getHealthSnapshot', () => {
	it('reports per-provider health + age', async () => {
		const ok = new FakeProvider('photon-self');
		const dead = new FakeProvider('photon', { health: async () => false });
		const chain = new ProviderChain({ providers: [ok, dead], healthCacheMs: 60_000 });
		await chain.search(SEARCH);
		const snap = chain.getHealthSnapshot();
		expect(snap).toHaveLength(2);
		expect(snap[0]).toMatchObject({ name: 'photon-self', healthy: true });
		expect(snap[1]).toMatchObject({ name: 'photon', healthy: false });
		expect(snap[0].ageMs).toBeLessThan(1000);
	});

	it('reports Infinity age for never-probed providers', async () => {
		const a = new FakeProvider('photon-self');
		const chain = new ProviderChain({ providers: [a], healthCacheMs: 60_000 });
		const snap = chain.getHealthSnapshot();
		expect(snap[0].ageMs).toBe(Infinity);
		expect(snap[0].healthy).toBe(false); // unknown defaults to unhealthy
	});
});

describe('ProviderChain — reverse', () => {
	it('uses the same provider order for reverse', async () => {
		const a = new FakeProvider('photon-self', {
			reverse: async () => ({ ok: false, kind: 'unreachable' }),
		});
		const b = new FakeProvider('photon', { privacy: 'public' });
		const chain = new ProviderChain({ providers: [a, b], healthCacheMs: 60_000 });
		const res = await chain.reverse({ lat: '47.66', lon: '9.17', lang: 'de' });
		expect(res.provider).toBe('photon');
		expect(b.calls.reverse).toBe(1);
		expect(b.calls.search).toBe(0);
	});
});

describe('ProviderChain — privacy / localOnly mode', () => {
	it('skips public providers when localOnly is true', async () => {
		const localProvider = new FakeProvider('photon-self', { privacy: 'local' });
		const publicPhoton = new FakeProvider('photon', { privacy: 'public' });
		const publicNominatim = new FakeProvider('nominatim', { privacy: 'public' });
		const chain = new ProviderChain({
			providers: [localProvider, publicPhoton, publicNominatim],
			healthCacheMs: 60_000,
		});

		const res = await chain.search(SEARCH, undefined, { localOnly: true });

		expect(res.ok).toBe(true);
		expect(res.provider).toBe('photon-self');
		expect(localProvider.calls.search).toBe(1);
		// Public providers must not even have their search() called
		expect(publicPhoton.calls.search).toBe(0);
		expect(publicNominatim.calls.search).toBe(0);
	});

	it('falls back to the second LOCAL provider when the first local fails', async () => {
		const local1 = new FakeProvider('photon-self', {
			privacy: 'local',
			search: async () => ({ ok: false, kind: 'unreachable' }),
		});
		// Pretend we have a hypothetical second local provider
		const local2 = new FakeProvider('photon', { privacy: 'local' });
		const chain = new ProviderChain({
			providers: [local1, local2],
			healthCacheMs: 60_000,
		});

		const res = await chain.search(SEARCH, undefined, { localOnly: true });
		expect(res.ok).toBe(true);
		expect(res.provider).toBe('photon');
	});

	it('returns ok:true with empty results + sensitive_local_unavailable when no local provider works', async () => {
		// All public, all healthy — but we asked for localOnly. The chain
		// must NOT silently fall through to public providers.
		const public1 = new FakeProvider('photon', { privacy: 'public' });
		const public2 = new FakeProvider('nominatim', { privacy: 'public' });
		const chain = new ProviderChain({
			providers: [public1, public2],
			healthCacheMs: 60_000,
		});

		const res = await chain.search(SEARCH, undefined, { localOnly: true });

		// The privacy contract is the load-bearing assertion: a sensitive
		// query must NEVER reach a public provider, even if every local
		// provider was filtered out.
		expect(public1.calls.search).toBe(0);
		expect(public2.calls.search).toBe(0);
		expect(public1.calls.health).toBe(0); // not even probed
		expect(public2.calls.health).toBe(0);

		expect(res.ok).toBe(true);
		expect(res.results).toEqual([]);
		expect(res.notice).toBe('sensitive_local_unavailable');
		expect(res.tried).toEqual([]);
	});

	it('returns notice: fallback_used when a public provider serves a non-sensitive query', async () => {
		const localDown = new FakeProvider('photon-self', {
			privacy: 'local',
			health: async () => false,
		});
		const publicUp = new FakeProvider('photon', { privacy: 'public' });
		const chain = new ProviderChain({
			providers: [localDown, publicUp],
			healthCacheMs: 60_000,
		});

		const res = await chain.search(SEARCH);
		expect(res.provider).toBe('photon');
		expect(res.notice).toBe('fallback_used');
	});

	it('NO notice when the local provider serves a non-sensitive query', async () => {
		const localUp = new FakeProvider('photon-self', { privacy: 'local' });
		const chain = new ProviderChain({ providers: [localUp], healthCacheMs: 60_000 });
		const res = await chain.search(SEARCH);
		expect(res.provider).toBe('photon-self');
		expect(res.notice).toBeUndefined();
	});
});
