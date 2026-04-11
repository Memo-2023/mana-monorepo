/**
 * mana-geocoding — Self-hosted geocoding proxy.
 *
 * Wraps a local Pelias instance with caching and OSM → PlaceCategory
 * mapping. All geocoding queries stay within our infrastructure —
 * no user location data leaves the network.
 */

import { createApp } from './app';
import { loadConfig } from './config';

const config = loadConfig();

console.log(`mana-geocoding starting on port ${config.port}...`);
console.log(`Pelias API: ${config.pelias.apiUrl}`);

export default {
	port: config.port,
	// Bun's default idleTimeout is 10s — too tight for Pelias cold queries
	// that need to hit Elasticsearch and libpostal. 60s is generous enough
	// for the worst-case while still cutting off stuck connections.
	idleTimeout: 60,
	fetch: createApp(config).fetch,
};
