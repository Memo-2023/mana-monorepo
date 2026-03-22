/**
 * Browser Error Tracking for ManaCore SvelteKit Apps
 *
 * Uses @sentry/browser with GlitchTip as the self-hosted backend.
 * This is the browser counterpart to the Node.js `index.ts`.
 *
 * @example
 * ```typescript
 * // In hooks.client.ts
 * import { initErrorTracking, handleSvelteError } from '@manacore/shared-error-tracking/browser';
 * import type { HandleClientError } from '@sveltejs/kit';
 *
 * initErrorTracking({
 *   serviceName: 'calendar-web',
 *   dsn: (window as any).__PUBLIC_GLITCHTIP_DSN__,
 *   environment: import.meta.env.MODE,
 * });
 *
 * export const handleError: HandleClientError = ({ error }) => {
 *   handleSvelteError(error);
 * };
 * ```
 */

import * as Sentry from '@sentry/browser';

export interface BrowserErrorTrackingOptions {
	/** Service/app name (e.g. 'calendar-web', 'contacts-web') */
	serviceName: string;
	/** GlitchTip/Sentry DSN. If not set, error tracking is disabled. */
	dsn?: string;
	/** Environment (development, staging, production) */
	environment?: string;
	/** Release/version string */
	release?: string;
	/** Sample rate for error events (0.0 to 1.0, default: 1.0) */
	sampleRate?: number;
	/** Sample rate for performance traces (0.0 to 1.0, default: 0.1) */
	tracesSampleRate?: number;
	/** Enable debug mode (default: false) */
	debug?: boolean;
}

let initialized = false;

/**
 * Initialize browser error tracking.
 * If no DSN is provided, error tracking is silently disabled.
 */
export function initErrorTracking(options: BrowserErrorTrackingOptions): void {
	if (initialized) return;
	if (typeof window === 'undefined') return;

	const dsn = options.dsn;

	if (!dsn) {
		if (options.debug) {
			console.log(`[ErrorTracking] No DSN configured for ${options.serviceName} - disabled`);
		}
		return;
	}

	Sentry.init({
		dsn,
		environment: options.environment || 'production',
		release: options.release,
		sampleRate: options.sampleRate ?? 1.0,
		tracesSampleRate: options.tracesSampleRate ?? 0.1,
		debug: options.debug ?? false,
		initialScope: {
			tags: { service: options.serviceName },
		},
	});

	initialized = true;

	if (options.debug) {
		console.log(
			`[ErrorTracking] Initialized for ${options.serviceName} (${options.environment || 'production'})`
		);
	}
}

/**
 * Handle SvelteKit client errors.
 * Use this in hooks.client.ts handleError export.
 */
export function handleSvelteError(error: unknown): void {
	if (!initialized) return;
	Sentry.captureException(error);
}

/**
 * Capture an exception manually
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
	if (!initialized) return;
	Sentry.captureException(error, { extra: context });
}

/**
 * Capture a message
 */
export function captureMessage(
	message: string,
	level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info'
): void {
	if (!initialized) return;
	Sentry.captureMessage(message, level);
}

/**
 * Set user context for error reports
 */
export function setUser(user: { id: string; email?: string } | null): void {
	if (!initialized) return;
	Sentry.setUser(user);
}

/**
 * Set extra context tags
 */
export function setTag(key: string, value: string): void {
	if (!initialized) return;
	Sentry.setTag(key, value);
}

export { Sentry };
