import { Hono } from 'hono';
import type { Config } from '../config';
import type { ProviderChain } from '../providers/chain';

export function createHealthRoutes(config: Config, chain: ProviderChain) {
	const app = new Hono();

	/** Wrapper health — is our Hono server up? */
	app.get('/', (c) => c.json({ status: 'ok', service: 'mana-geocoding' }));

	/**
	 * Upstream Pelias health. Proxies a request to the Pelias API so
	 * monitoring can reach it without `extra_hosts: host.docker.internal`
	 * on the blackbox exporter.
	 *
	 * Backwards-compatible: existing prometheus probes against this
	 * endpoint keep working. Now reports `degraded` (200) instead of `down`
	 * (503) when Pelias is unreachable but a fallback provider is healthy
	 * — the system can still serve queries, just slower / less precise.
	 */
	app.get('/pelias', async (c) => {
		try {
			const res = await fetch(`${config.pelias.apiUrl}/status`, {
				signal: AbortSignal.timeout(5000),
			});
			if (!res.ok && res.status !== 404) {
				return c.json(
					{ status: 'degraded', upstream: res.status, fallbackAvailable: chainHasFallback(chain) },
					chainHasFallback(chain) ? 200 : 503
				);
			}
			return c.json({ status: 'ok', upstream: 'pelias-api' });
		} catch (e) {
			return c.json(
				{
					status: chainHasFallback(chain) ? 'degraded' : 'down',
					error: e instanceof Error ? e.message : 'unknown',
					fallbackAvailable: chainHasFallback(chain),
				},
				chainHasFallback(chain) ? 200 : 503
			);
		}
	});

	/**
	 * Provider-chain status — per-provider health snapshot.
	 * GET /providers
	 */
	app.get('/providers', (c) => {
		return c.json({
			providers: chain.getHealthSnapshot(),
		});
	});

	return app;
}

/**
 * Check if any non-Pelias provider is currently believed healthy. Used
 * to soften /pelias health to "degraded" instead of "down" when a
 * fallback can still serve traffic.
 */
function chainHasFallback(chain: ProviderChain): boolean {
	return chain.getHealthSnapshot().some((p) => p.name !== 'pelias' && p.healthy);
}
