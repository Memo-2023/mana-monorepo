/**
 * Shared security headers for SvelteKit web apps.
 *
 * Sets standard security headers (CSP, X-Frame-Options, etc.)
 * with Umami analytics and GlitchTip error tracking pre-configured.
 *
 * @example
 * ```typescript
 * import { setSecurityHeaders } from '@manacore/shared-utils/security-headers';
 *
 * const response = await resolve(event, { transformPageChunk: ... });
 * setSecurityHeaders(response, {
 *   connectSrc: [authUrl, backendUrl],
 * });
 * return response;
 * ```
 */

interface SecurityHeadersOptions {
	/** Additional connect-src origins (auth URL, backend URL, etc.) */
	connectSrc?: string[];
	/** Additional script-src origins */
	scriptSrc?: string[];
	/** Additional img-src origins */
	imgSrc?: string[];
	/** Additional font-src origins */
	fontSrc?: string[];
	/** Additional media-src origins (audio/video sources) */
	mediaSrc?: string[];
	/** Override frame-ancestors (default: 'none') */
	frameAncestors?: string;
}

/**
 * Set standard security headers on a Response object.
 * Includes Umami (stats.mana.how) and GlitchTip (glitchtip.mana.how) by default.
 */
export function setSecurityHeaders(response: Response, options: SecurityHeadersOptions = {}): void {
	const {
		connectSrc = [],
		scriptSrc = [],
		imgSrc = [],
		fontSrc = [],
		mediaSrc = [],
		frameAncestors = "'none'",
	} = options;

	// Standard security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

	// Content Security Policy
	const cspDirectives = [
		"default-src 'self'",
		`script-src 'self' 'unsafe-inline' https://stats.mana.how https://glitchtip.mana.how ${scriptSrc.join(' ')}`.trim(),
		"style-src 'self' 'unsafe-inline'",
		`img-src 'self' data: https: ${imgSrc.join(' ')}`.trim(),
		`connect-src 'self' https://stats.mana.how https://glitchtip.mana.how ${connectSrc.join(' ')}`.trim(),
		`font-src 'self' ${fontSrc.join(' ')}`.trim(),
		mediaSrc.length > 0 ? `media-src 'self' ${mediaSrc.join(' ')}`.trim() : '',
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		`frame-ancestors ${frameAncestors}`,
	];

	response.headers.set('Content-Security-Policy', cspDirectives.filter(Boolean).join('; '));
}
