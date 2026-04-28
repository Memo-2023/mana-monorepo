/**
 * mana-geocoding — geocoding proxy with provider chain (photon-self →
 * public photon → public nominatim) and aggressive caching. Sensitive
 * queries are blocked from public providers; all forwarded queries are
 * coordinate-quantized.
 */

import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();

console.log(`mana-geocoding starting on port ${config.port}...`);
console.log(`Providers: ${config.providers.enabled.join(', ')}`);
if (config.photonSelf.apiUrl) {
	console.log(`photon-self: ${config.photonSelf.apiUrl}`);
}

export default {
	port: config.port,
	// Bun's default idleTimeout is 10s — too tight for cold cross-LAN
	// queries to photon-self that hit OpenSearch on a fresh shard. 60s is
	// generous enough for the worst case while still cutting off stuck
	// connections.
	idleTimeout: 60,
	fetch: createApp(config).fetch,
};
