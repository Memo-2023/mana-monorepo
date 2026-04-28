/**
 * Provider chain — tries providers in priority order until one answers.
 *
 * Failure handling:
 *   - `ok: false` (network/5xx/429) → fall through to next provider
 *   - `ok: true` with empty results → STOP (don't burn through public APIs
 *     for a query that legitimately doesn't match)
 *   - `ok: true` with results → cache + return
 *
 * Health-cache:
 *   Calling each provider's `health()` per-request would add an RTT to
 *   every search. Instead we cache health for `healthCacheMs` and skip
 *   providers that were last seen unhealthy. A skipped provider isn't
 *   tried again until the cache entry expires, at which point we probe
 *   it before the next request (lazy refresh).
 */

import type {
	GeocodingProvider,
	GeocodingResult,
	ProviderName,
	ProviderResponse,
	ReverseRequest,
	SearchRequest,
} from './types';

export interface ChainConfig {
	providers: GeocodingProvider[];
	/** TTL for the per-provider health cache. */
	healthCacheMs: number;
	/** Optional logger — defaults to console.warn for failures so a flaky
	 *  fallback shows up in logs without polluting happy-path output. */
	log?: (level: 'info' | 'warn', msg: string, meta?: Record<string, unknown>) => void;
}

interface HealthEntry {
	healthy: boolean;
	checkedAt: number;
}

export interface ChainResponse {
	ok: boolean;
	provider?: ProviderName;
	results: GeocodingResult[];
	/** Names of providers that were tried but failed before we got a hit.
	 *  Useful for telemetry (`x-geocoding-tried` response header). */
	tried: ProviderName[];
}

export class ProviderChain {
	private health = new Map<ProviderName, HealthEntry>();

	constructor(private readonly config: ChainConfig) {}

	async search(req: SearchRequest, signal?: AbortSignal): Promise<ChainResponse> {
		return this.run(req, signal, (p, r, s) => p.search(r as SearchRequest, s));
	}

	async reverse(req: ReverseRequest, signal?: AbortSignal): Promise<ChainResponse> {
		return this.run(req, signal, (p, r, s) => p.reverse(r as ReverseRequest, s));
	}

	private async run(
		req: SearchRequest | ReverseRequest,
		signal: AbortSignal | undefined,
		call: (
			provider: GeocodingProvider,
			req: SearchRequest | ReverseRequest,
			signal?: AbortSignal
		) => Promise<ProviderResponse>
	): Promise<ChainResponse> {
		const tried: ProviderName[] = [];

		for (const provider of this.config.providers) {
			if (!(await this.isHealthy(provider, signal))) {
				continue;
			}

			tried.push(provider.name);
			const result = await call(provider, req, signal);

			if (result.ok) {
				// Success — even if results=[], that's a definitive answer.
				return { ok: true, provider: provider.name, results: result.results, tried };
			}

			// Failure — mark unhealthy and fall through.
			this.health.set(provider.name, { healthy: false, checkedAt: Date.now() });
			this.config.log?.('warn', `${provider.name} failed`, {
				kind: result.kind,
				status: result.status,
				error: result.error,
			});
		}

		return { ok: false, results: [], tried };
	}

	/**
	 * Health-cache lookup with lazy refresh. Returns true if the provider
	 * is believed to be reachable; probes the actual backend if the cache
	 * entry is missing or stale.
	 */
	private async isHealthy(provider: GeocodingProvider, signal?: AbortSignal): Promise<boolean> {
		const cached = this.health.get(provider.name);
		const now = Date.now();
		if (cached && now - cached.checkedAt < this.config.healthCacheMs) {
			return cached.healthy;
		}

		// Stale or missing — refresh. We don't await this aggressively in
		// happy paths (Pelias up + healthy is the cheapest case), but on
		// cold-start every entry is missing so the first request pays for
		// one health probe per provider.
		const healthy = await provider.health(signal);
		this.health.set(provider.name, { healthy, checkedAt: now });
		if (!healthy) {
			this.config.log?.('warn', `${provider.name} health check failed`);
		}
		return healthy;
	}

	/** Snapshot of provider health, for /health endpoint reporting. */
	getHealthSnapshot(): Array<{ name: ProviderName; healthy: boolean; ageMs: number }> {
		const now = Date.now();
		return this.config.providers.map((p) => {
			const entry = this.health.get(p.name);
			return {
				name: p.name,
				healthy: entry?.healthy ?? false,
				ageMs: entry ? now - entry.checkedAt : Infinity,
			};
		});
	}

	/** Force a re-probe on the next request. Useful in tests. */
	clearHealthCache(): void {
		this.health.clear();
	}
}
