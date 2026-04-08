/**
 * Base API Client with Retry Logic
 *
 * Provides authenticated fetch with exponential backoff retry.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { guestPrompt } from '$lib/stores/guest-prompt.svelte';

/**
 * Retry configuration
 */
export interface RetryConfig {
	/** Maximum number of retry attempts (default: 3) */
	maxRetries: number;
	/** Initial delay in milliseconds (default: 1000) */
	retryDelay: number;
	/** Multiplier for exponential backoff (default: 2) */
	backoffMultiplier: number;
}

/**
 * API response wrapper
 */
export interface ApiResult<T> {
	data: T | null;
	error: string | null;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
	maxRetries: 3,
	retryDelay: 1000,
	backoffMultiplier: 2,
};

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a network/connection error that shouldn't be retried
 */
function isNetworkError(error: Error): boolean {
	const message = error.message.toLowerCase();
	return (
		message.includes('failed to fetch') ||
		message.includes('network') ||
		message.includes('connection refused') ||
		message.includes('err_connection_refused') ||
		message.includes('econnrefused') ||
		message.includes('load failed')
	);
}

/**
 * Human-readable HTTP status messages
 */
function httpStatusMessage(status: number): string {
	const messages: Record<number, string> = {
		400: 'Ungultige Anfrage — bitte Eingaben prufen',
		404: 'Nicht gefunden',
		409: 'Konflikt — Daten wurden zwischenzeitlich geandert',
		422: 'Eingaben konnten nicht verarbeitet werden',
		429: 'Zu viele Anfragen — bitte kurz warten',
		500: 'Interner Server-Fehler',
		502: 'Service vorubergehend nicht erreichbar',
		503: 'Service wird gewartet',
	};
	return messages[status] || `Fehler (HTTP ${status})`;
}

/**
 * Fetch with authentication and retry logic
 *
 * @param url - Full URL to fetch
 * @param options - Fetch options (optional)
 * @param retryConfig - Retry configuration (optional)
 * @returns Promise with data or error
 */
export async function fetchWithRetry<T>(
	url: string,
	options: RequestInit = {},
	retryConfig: Partial<RetryConfig> = {}
): Promise<ApiResult<T>> {
	const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
	let lastError: string | null = null;

	// Short-circuit for guest mode: skip the entire fetch ladder, surface
	// the unified bottom-bar prompt instead. Without this, every server-
	// only feature (LLM, media upload, search, …) would still hit the
	// network and return a 401 — costing latency, log noise, and a worse
	// error message ("Sitzung abgelaufen") than what we can show locally.
	if (!authStore.isAuthenticated) {
		guestPrompt.requireAccount(
			'api',
			'Diese Funktion braucht ein Konto. Melde dich an, um sie zu nutzen.'
		);
		return { data: null, error: 'Anmeldung erforderlich' };
	}

	for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
		try {
			// Get fresh token for each attempt
			const token = await authStore.getAccessToken();

			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					...(token ? { Authorization: `Bearer ${token}` } : {}),
					...options.headers,
				},
			});

			if (!response.ok) {
				// Don't retry on auth errors
				if (response.status === 401) {
					// Token has expired or been revoked server-side. Surface
					// the unified prompt so the user has a one-click path
					// back into the auth flow instead of a silent failure.
					guestPrompt.requireAccount(
						'api:401',
						'Sitzung abgelaufen — bitte neu anmelden, um fortzufahren.',
						'Neu anmelden'
					);
					return {
						data: null,
						error: 'Sitzung abgelaufen — bitte neu anmelden',
					};
				}
				if (response.status === 403) {
					return {
						data: null,
						error: 'Keine Berechtigung fur diese Aktion',
					};
				}

				// Don't retry on client errors (except rate limiting)
				if (response.status >= 400 && response.status < 500 && response.status !== 429) {
					const errorBody = await response.json().catch(() => ({ message: '' }));
					const msg = errorBody.message || httpStatusMessage(response.status);
					return { data: null, error: msg };
				}

				throw new Error(`Server-Fehler (${response.status})`);
			}

			const data = await response.json();
			return { data, error: null };
		} catch (e) {
			const error = e instanceof Error ? e : new Error('Unknown error');
			lastError = error.message;

			// Don't retry on network errors (service unavailable)
			if (isNetworkError(error)) {
				return {
					data: null,
					error: 'Service nicht erreichbar',
				};
			}

			// Don't retry on last attempt
			if (attempt < config.maxRetries) {
				const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt);
				console.warn(`API request failed, retrying in ${delay}ms...`, {
					url,
					attempt,
					error: lastError,
				});
				await sleep(delay);
			}
		}
	}

	return { data: null, error: lastError };
}

/**
 * Create an API client for a specific backend
 */
export function createApiClient(baseUrl: string) {
	return {
		get<T>(endpoint: string, retryConfig?: Partial<RetryConfig>): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(`${baseUrl}${endpoint}`, { method: 'GET' }, retryConfig);
		},

		post<T>(
			endpoint: string,
			body?: unknown,
			retryConfig?: Partial<RetryConfig>
		): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(
				`${baseUrl}${endpoint}`,
				{
					method: 'POST',
					body: body ? JSON.stringify(body) : undefined,
				},
				retryConfig
			);
		},

		put<T>(
			endpoint: string,
			body?: unknown,
			retryConfig?: Partial<RetryConfig>
		): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(
				`${baseUrl}${endpoint}`,
				{
					method: 'PUT',
					body: body ? JSON.stringify(body) : undefined,
				},
				retryConfig
			);
		},

		delete<T>(endpoint: string, retryConfig?: Partial<RetryConfig>): Promise<ApiResult<T>> {
			return fetchWithRetry<T>(`${baseUrl}${endpoint}`, { method: 'DELETE' }, retryConfig);
		},
	};
}
