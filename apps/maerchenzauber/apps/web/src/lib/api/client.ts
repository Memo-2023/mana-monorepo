/**
 * API Client for Märchenzauber Web App
 *
 * Uses the shared-auth tokenManager for automatic token management.
 */

import { PUBLIC_API_URL } from '$env/static/public';
import { tokenManager } from '$lib/auth';
import type { ApiError } from '$lib/types/api';

const API_BASE_URL = PUBLIC_API_URL || 'http://localhost:3002';

/**
 * Check if error indicates insufficient credits
 */
function isInsufficientCreditsError(errorData: Record<string, unknown>): boolean {
	return (
		errorData.insufficientCredits === true ||
		errorData.error === 'INSUFFICIENT_CREDITS' ||
		(typeof errorData.message === 'string' &&
			errorData.message.toLowerCase().includes('insufficient credits'))
	);
}

/**
 * Check if error is retryable (rate limit, server errors)
 */
function isRetryableError(status: number): boolean {
	return status === 429 || status === 502 || status === 503 || status === 504;
}

/**
 * Sleep helper for retry backoff
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with authentication and automatic token refresh
 */
export async function fetchWithAuth(
	endpoint: string,
	options: RequestInit = {},
	retryCount = 0,
	maxRetries = 2
): Promise<Response> {
	// Get valid token (handles refresh automatically)
	const appToken = await tokenManager.getValidToken();

	if (!appToken) {
		console.error('[API] No valid token available');
		throw new Error('Not authenticated');
	}

	// Build authenticated request
	const headers: HeadersInit = {
		...options.headers,
		Authorization: `Bearer ${appToken}`,
	};

	// Set Content-Type for non-FormData requests
	if (!(options.body instanceof FormData)) {
		(headers as Record<string, string>)['Content-Type'] = 'application/json';
	}

	const authenticatedOptions: RequestInit = {
		...options,
		headers,
	};

	// Build URL (avoid double slashes)
	const baseUrl = API_BASE_URL.replace(/\/+$/, '');
	const cleanEndpoint = endpoint.replace(/^\/+/, '');
	const url = `${baseUrl}/${cleanEndpoint}`;

	let response = await fetch(url, authenticatedOptions);

	// Handle 401 - token expired, try to refresh
	if (response.status === 401) {
		try {
			response = await tokenManager.handle401Response(url, authenticatedOptions);
		} catch {
			console.error('[API] Token refresh failed');
			throw new Error('Authentication failed. Please login again.');
		}
	}

	// Handle errors
	if (!response.ok) {
		let errorData: Record<string, unknown> = {};

		try {
			errorData = await response.clone().json();
		} catch {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		// Handle insufficient credits
		if (isInsufficientCreditsError(errorData)) {
			const error = new Error(String(errorData.message || 'Insufficient credits')) as ApiError;
			error.insufficientCredits = true;
			error.requiredCredits = errorData.requiredCredits as number;
			error.availableCredits = errorData.availableCredits as number;
			throw error;
		}

		// Retry on retryable errors
		if (isRetryableError(response.status) && retryCount < maxRetries) {
			await sleep(1000 * (retryCount + 1)); // Exponential backoff
			return fetchWithAuth(endpoint, options, retryCount + 1, maxRetries);
		}

		// Build structured error
		const apiError = new Error(
			String(errorData.message || `API error: ${response.status}`)
		) as ApiError;
		apiError.error = errorData.error as string;
		apiError.messageDE = errorData.messageDE as string;
		apiError.messageEN = errorData.messageEN as string;
		apiError.retryable = errorData.retryable as boolean;
		apiError.technicalMessage = String(errorData.technicalMessage || errorData.message);

		throw apiError;
	}

	return response;
}

/**
 * Type-safe API helpers
 */
export const api = {
	async get<T>(endpoint: string): Promise<T> {
		const response = await fetchWithAuth(endpoint, { method: 'GET' });
		return response.json();
	},

	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		const response = await fetchWithAuth(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined,
		});
		return response.json();
	},

	async put<T>(endpoint: string, data: unknown): Promise<T> {
		const response = await fetchWithAuth(endpoint, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
		return response.json();
	},

	async delete<T>(endpoint: string): Promise<T> {
		const response = await fetchWithAuth(endpoint, { method: 'DELETE' });
		return response.json();
	},

	async upload<T>(endpoint: string, formData: FormData): Promise<T> {
		const response = await fetchWithAuth(endpoint, {
			method: 'POST',
			body: formData,
		});
		return response.json();
	},
};

/**
 * Check if an error is a credit error
 */
export function isCreditError(error: unknown): error is ApiError & { insufficientCredits: true } {
	return error instanceof Error && (error as ApiError).insufficientCredits === true;
}
