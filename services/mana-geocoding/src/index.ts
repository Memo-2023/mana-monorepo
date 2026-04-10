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
	fetch: createApp(config).fetch,
};
