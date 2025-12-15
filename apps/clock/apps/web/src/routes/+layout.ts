/**
 * Layout Configuration
 *
 * Disable SSR - this is a client-only SPA that:
 * - Requires authentication (no SEO benefit)
 * - Fetches all data client-side via authenticated APIs
 * - Loads runtime config from /config.json (browser-only)
 */

export const ssr = false;
