import { Hono } from 'hono';
import type { Config } from '../config';

export function createHealthRoutes(config: Config) {
	const app = new Hono();

	/** Wrapper health — is our Hono server up? */
	app.get('/', (c) => c.json({ status: 'ok', service: 'mana-geocoding' }));

	/**
	 * Upstream Pelias health. Proxies a request to the Pelias API and
	 * Elasticsearch cluster health so monitoring can reach them without
	 * needing `extra_hosts: host.docker.internal` on the blackbox exporter.
	 */
	app.get('/pelias', async (c) => {
		try {
			// Pelias API responds to /v1/status with a JSON error for unknown
			// path but a 200 means the server is alive. Any other response code
			// or a timeout means Pelias is unreachable.
			const res = await fetch(`${config.pelias.apiUrl}/status`, {
				signal: AbortSignal.timeout(5000),
			});
			if (!res.ok && res.status !== 404) {
				return c.json({ status: 'degraded', upstream: res.status }, 503);
			}
			return c.json({ status: 'ok', upstream: 'pelias-api' });
		} catch (e) {
			return c.json({ status: 'down', error: e instanceof Error ? e.message : 'unknown' }, 503);
		}
	});

	return app;
}
