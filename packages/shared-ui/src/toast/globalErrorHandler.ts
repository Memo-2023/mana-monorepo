/**
 * Global Error Handler - Catches unhandled errors and shows toast notifications
 *
 * Usage:
 * ```ts
 * import { setupGlobalErrorHandler } from '@manacore/shared-ui';
 * import { onMount } from 'svelte';
 *
 * onMount(() => {
 *   const cleanup = setupGlobalErrorHandler();
 *   return cleanup; // Optional: cleanup on unmount
 * });
 *
 * // With custom translations:
 * setupGlobalErrorHandler({
 *   networkError: 'Network error: Server unreachable',
 *   sessionExpired: 'Session expired. Please log in again.',
 *   unexpectedError: 'An unexpected error occurred',
 *   genericError: 'An error occurred',
 *   offline: 'No internet connection',
 *   online: 'Connection restored',
 * });
 * ```
 */

import { toastStore } from './toast.svelte';

export interface GlobalErrorHandlerTranslations {
	/** Message for network/fetch errors */
	networkError: string;
	/** Message for 401/unauthorized errors */
	sessionExpired: string;
	/** Fallback message for unhandled promise rejections */
	unexpectedError: string;
	/** Message for general JavaScript errors */
	genericError: string;
	/** Message when going offline */
	offline: string;
	/** Message when connection is restored */
	online: string;
}

const DEFAULT_TRANSLATIONS_DE: GlobalErrorHandlerTranslations = {
	networkError: 'Netzwerkfehler: Server nicht erreichbar',
	sessionExpired: 'Sitzung abgelaufen. Bitte erneut anmelden.',
	unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten',
	genericError: 'Ein Fehler ist aufgetreten',
	offline: 'Keine Internetverbindung',
	online: 'Verbindung wiederhergestellt',
};

const DEFAULT_TRANSLATIONS_EN: GlobalErrorHandlerTranslations = {
	networkError: 'Network error: Server unreachable',
	sessionExpired: 'Session expired. Please log in again.',
	unexpectedError: 'An unexpected error occurred',
	genericError: 'An error occurred',
	offline: 'No internet connection',
	online: 'Connection restored',
};

export const GLOBAL_ERROR_TRANSLATIONS = {
	de: DEFAULT_TRANSLATIONS_DE,
	en: DEFAULT_TRANSLATIONS_EN,
} as const;

export interface GlobalErrorHandlerOptions {
	/** Custom translations (default: German) */
	translations?: Partial<GlobalErrorHandlerTranslations>;
	/** Locale key to use built-in translations (overridden by translations if provided) */
	locale?: 'de' | 'en';
	/** Duration for offline warning toast in ms (default: 10000) */
	offlineDuration?: number;
	/** Enable console logging for debugging (default: false) */
	debug?: boolean;
	/** Custom handler for auth errors (e.g., redirect to login) */
	onAuthError?: () => void;
}

/**
 * Sets up global error handling for unhandled promise rejections,
 * JavaScript errors, and network connectivity changes.
 *
 * @param options - Configuration options
 * @returns Cleanup function to remove event listeners
 */
export function setupGlobalErrorHandler(options: GlobalErrorHandlerOptions = {}): () => void {
	// Don't run on server
	if (typeof window === 'undefined') {
		return () => {};
	}

	const {
		translations: customTranslations,
		locale = 'de',
		offlineDuration = 10000,
		debug = false,
		onAuthError,
	} = options;

	// Merge built-in translations with custom overrides
	const baseTranslations = GLOBAL_ERROR_TRANSLATIONS[locale] || DEFAULT_TRANSLATIONS_DE;
	const translations: GlobalErrorHandlerTranslations = {
		...baseTranslations,
		...customTranslations,
	};

	const log = (msg: string, ...args: unknown[]) => {
		if (debug) {
			console.log(`[GlobalErrorHandler] ${msg}`, ...args);
		}
	};

	// Handle unhandled promise rejections
	const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
		const error = event.reason;
		log('Unhandled rejection:', error);

		let message = translations.unexpectedError;

		if (error instanceof Error) {
			// Network errors
			if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
				message = translations.networkError;
			}
			// Auth errors
			else if (
				error.message.includes('401') ||
				error.message.toLowerCase().includes('unauthorized')
			) {
				message = translations.sessionExpired;
				onAuthError?.();
			}
			// Other errors with messages
			else if (error.message) {
				message = error.message;
			}
		}

		toastStore.error(message);
		event.preventDefault();
	};

	// Handle general JavaScript errors
	const handleError = (event: ErrorEvent) => {
		log('Error event:', event);
		// Only handle non-script errors (network failures for resources, etc.)
		if (event.message && !event.filename) {
			toastStore.error(translations.genericError);
		}
	};

	// Handle offline status
	const handleOffline = () => {
		log('Offline');
		toastStore.warning(translations.offline, offlineDuration);
	};

	// Handle online status
	const handleOnline = () => {
		log('Online');
		toastStore.success(translations.online);
	};

	// Add event listeners
	window.addEventListener('unhandledrejection', handleUnhandledRejection);
	window.addEventListener('error', handleError);
	window.addEventListener('offline', handleOffline);
	window.addEventListener('online', handleOnline);

	log('Initialized');

	// Return cleanup function
	return () => {
		window.removeEventListener('unhandledrejection', handleUnhandledRejection);
		window.removeEventListener('error', handleError);
		window.removeEventListener('offline', handleOffline);
		window.removeEventListener('online', handleOnline);
		log('Cleaned up');
	};
}
