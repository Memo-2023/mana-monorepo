import type { ErrorTracker } from './error-tracker';

/**
 * Create a SvelteKit error handler for hooks.client.ts
 *
 * Usage:
 * ```typescript
 * // src/hooks.client.ts
 * import { createSvelteErrorHandler } from '@manacore/shared-error-tracking/frontend';
 * import { errorTracker } from '$lib/error-tracking';
 *
 * export const handleError = createSvelteErrorHandler(errorTracker);
 * ```
 */
export function createSvelteErrorHandler(errorTracker: ErrorTracker) {
	return async ({
		error,
		event,
		status,
		message,
	}: {
		error: unknown;
		event: { url: URL; params: Record<string, string>; route: { id: string | null } };
		status: number;
		message: string;
	}) => {
		// Capture the error
		await errorTracker.captureError(error, {
			status,
			message,
			url: event.url.toString(),
			routeId: event.route.id,
			params: event.params,
		});

		// Return standard SvelteKit error response
		return {
			message: message || 'An unexpected error occurred',
		};
	};
}

/**
 * Setup global error handler for unhandled errors and promise rejections
 * Call this in hooks.client.ts
 *
 * Usage:
 * ```typescript
 * // src/hooks.client.ts
 * import { setupGlobalErrorHandler } from '@manacore/shared-error-tracking/frontend';
 * import { errorTracker } from '$lib/error-tracking';
 *
 * if (typeof window !== 'undefined') {
 *   setupGlobalErrorHandler(errorTracker);
 * }
 * ```
 */
export function setupGlobalErrorHandler(errorTracker: ErrorTracker): void {
	if (typeof window === 'undefined') {
		return;
	}

	// Handle unhandled errors
	window.addEventListener('error', (event) => {
		void errorTracker.captureError(event.error || new Error(event.message), {
			type: 'unhandled_error',
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
		});
	});

	// Handle unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		void errorTracker.captureError(event.reason || new Error('Unhandled promise rejection'), {
			type: 'unhandled_rejection',
		});
	});
}
