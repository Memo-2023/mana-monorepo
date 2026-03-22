/**
 * Server-side Umami Analytics Utilities
 *
 * Used in SvelteKit hooks.server.ts to inject the Umami analytics script.
 * Reads the website ID from the PUBLIC_UMAMI_WEBSITE_ID environment variable.
 *
 * @example
 * ```typescript
 * import { injectUmamiAnalytics } from '@manacore/shared-utils/analytics-server';
 *
 * export const handle: Handle = async ({ event, resolve }) => {
 *   return resolve(event, {
 *     transformPageChunk: ({ html }) => injectUmamiAnalytics(html),
 *   });
 * };
 * ```
 */

const UMAMI_SCRIPT_URL = 'https://stats.mana.how/script.js';

/**
 * Get the Umami analytics script tag.
 * Returns empty string if no website ID is configured.
 */
export function getUmamiScriptTag(websiteId?: string): string {
	const id = websiteId || process.env.PUBLIC_UMAMI_WEBSITE_ID || '';
	if (!id) return '';
	return `<script defer src="${UMAMI_SCRIPT_URL}" data-website-id="${id}"></script>`;
}

/**
 * Inject the Umami analytics script into HTML.
 * Designed to be used in SvelteKit's transformPageChunk.
 *
 * @param html - The HTML string to inject the script into
 * @param websiteId - Optional website ID override (defaults to PUBLIC_UMAMI_WEBSITE_ID env var)
 * @returns The HTML with the Umami script injected before </head>
 */
export function injectUmamiAnalytics(html: string, websiteId?: string): string {
	const scriptTag = getUmamiScriptTag(websiteId);
	if (!scriptTag) return html;
	return html.replace('</head>', `${scriptTag}\n</head>`);
}
