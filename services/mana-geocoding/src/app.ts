/**
 * App factory — separated from index.ts so tests can import without
 * triggering the production bootstrap.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Config } from './config';
import { RateLimiter } from './lib/rate-limiter';
import { ProviderChain } from './providers/chain';
import { NominatimProvider } from './providers/nominatim';
import { PhotonProvider } from './providers/photon';
import type { GeocodingProvider, ProviderName } from './providers/types';
import { createGeocodeRoutes } from './routes/geocode';
import { createHealthRoutes } from './routes/health';

export function createApp(config: Config): Hono {
	const chain = createChain(config);

	const app = new Hono();

	app.onError((err, c) => {
		console.error('Unhandled error:', err);
		return c.json({ error: 'internal_error' }, 500);
	});

	app.use(
		'*',
		cors({
			origin: config.cors.origins,
			credentials: true,
		})
	);

	app.route('/health', createHealthRoutes(config, chain));
	app.route('/api/v1/geocode', createGeocodeRoutes(config, chain));

	return app;
}

/**
 * Build the provider chain from config. The order of `config.providers.enabled`
 * is honored — providers earlier in the list are tried first. A disabled
 * provider is simply not registered, not skipped at runtime.
 */
export function createChain(config: Config): ProviderChain {
	const built = new Map<ProviderName, GeocodingProvider>();

	// Self-hosted Photon (mana-gpu). Only registered when the env-var is set
	// — without it the chain runs on public providers only. Once the GPU
	// server is running Photon, flip PHOTON_SELF_API_URL on and this
	// becomes the primary provider.
	if (config.photonSelf.apiUrl) {
		built.set(
			'photon-self',
			new PhotonProvider({
				apiUrl: config.photonSelf.apiUrl,
				timeoutMs: config.providers.timeoutMs,
				name: 'photon-self',
				privacy: 'local',
			})
		);
	}

	built.set(
		'photon',
		new PhotonProvider({
			apiUrl: config.photon.apiUrl,
			timeoutMs: config.providers.timeoutMs,
			// name + privacy default to 'photon' / 'public' — public komoot
			// is the always-on safety net behind self-hosted.
		})
	);

	const nominatimLimiter = new RateLimiter(config.nominatim.intervalMs);
	built.set(
		'nominatim',
		new NominatimProvider(
			{
				apiUrl: config.nominatim.apiUrl,
				userAgent: config.nominatim.userAgent,
				timeoutMs: config.providers.timeoutMs,
			},
			nominatimLimiter
		)
	);

	const ordered = config.providers.enabled
		.map((name) => built.get(name))
		.filter((p): p is GeocodingProvider => p !== undefined);

	return new ProviderChain({
		providers: ordered,
		healthCacheMs: config.providers.healthCacheMs,
		log: (level, msg, meta) => {
			if (level === 'warn') {
				console.warn('[geocoding-chain]', msg, meta ?? '');
			} else {
				console.log('[geocoding-chain]', msg, meta ?? '');
			}
		},
	});
}
