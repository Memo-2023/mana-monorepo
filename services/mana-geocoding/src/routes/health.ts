import { Hono } from 'hono';
import type { Config } from '../config';
import type { ProviderChain } from '../providers/chain';

export function createHealthRoutes(config: Config, chain: ProviderChain) {
	const app = new Hono();

	/** Wrapper health — is our Hono server up? */
	app.get('/', (c) => c.json({ status: 'ok', service: 'mana-geocoding' }));

	/**
	 * Upstream photon-self health. Proxies a request to the self-hosted
	 * Photon so monitoring can reach it without `extra_hosts:
	 * host.docker.internal` on the blackbox exporter.
	 *
	 * Reports `degraded` (200) instead of `down` (503) when photon-self is
	 * unreachable but a public fallback (photon / nominatim) is healthy —
	 * the system can still serve queries, just at the cost of leaking the
	 * query content to a third party.
	 */
	app.get('/photon-self', async (c) => {
		const upstream = config.photonSelf.apiUrl;
		if (!upstream) {
			return c.json({ status: 'unconfigured', error: 'PHOTON_SELF_API_URL is unset' }, 503);
		}
		try {
			const res = await fetch(`${upstream}/api?q=Konstanz&limit=1`, {
				signal: AbortSignal.timeout(5000),
			});
			if (!res.ok) {
				return c.json(
					{
						status: 'degraded',
						upstream: res.status,
						fallbackAvailable: chainHasPublicFallback(chain),
					},
					chainHasPublicFallback(chain) ? 200 : 503
				);
			}
			return c.json({ status: 'ok', upstream: 'photon-self' });
		} catch (e) {
			return c.json(
				{
					status: chainHasPublicFallback(chain) ? 'degraded' : 'down',
					error: e instanceof Error ? e.message : 'unknown',
					fallbackAvailable: chainHasPublicFallback(chain),
				},
				chainHasPublicFallback(chain) ? 200 : 503
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
 * Check if any public fallback provider is currently believed healthy.
 * Used to soften /photon-self health to "degraded" instead of "down"
 * when a public fallback can still serve traffic.
 */
function chainHasPublicFallback(chain: ProviderChain): boolean {
	return chain.getHealthSnapshot().some((p) => p.name !== 'photon-self' && p.healthy);
}
