/**
 * API Client Utilities
 */

import type { ApiError, ApiErrorCode } from './types';

/**
 * Build a query string from parameters object
 * Handles undefined values and proper encoding
 */
export function buildQueryString(
	params: Record<string, string | number | boolean | undefined>
): string {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null && value !== '') {
			searchParams.append(key, String(value));
		}
	}

	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : '';
}

/**
 * Determine error code from HTTP status
 */
export function getErrorCodeFromStatus(status: number): ApiErrorCode {
	if (status === 401) return 'UNAUTHORIZED';
	if (status === 403) return 'FORBIDDEN';
	if (status === 404) return 'NOT_FOUND';
	if (status === 422 || status === 400) return 'VALIDATION_ERROR';
	if (status >= 500) return 'SERVER_ERROR';
	return 'UNKNOWN';
}

/**
 * Create a standardized API error
 */
export function createApiError(
	message: string,
	code: ApiErrorCode,
	status?: number,
	details?: unknown
): ApiError {
	return { message, code, status, details };
}

/**
 * Parse error response body
 */
export async function parseErrorResponse(response: Response): Promise<string> {
	try {
		const data = await response.json();
		return data.message || data.error || JSON.stringify(data);
	} catch {
		return response.statusText || 'Unknown error';
	}
}

/**
 * Check if error is retryable (network issues, 5xx errors)
 */
export function isRetryableError(error: ApiError): boolean {
	if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
		return true;
	}
	if (error.status && error.status >= 500) {
		return true;
	}
	return false;
}

/**
 * Get base URL with runtime injection support for Docker
 * Checks window.__PUBLIC_BACKEND_URL__ first, then falls back to provided URL
 */
export function getBaseUrl(configuredUrl: string): string {
	if (typeof window !== 'undefined') {
		const runtimeUrl = (window as unknown as Record<string, unknown>).__PUBLIC_BACKEND_URL__;
		if (typeof runtimeUrl === 'string' && runtimeUrl) {
			return runtimeUrl;
		}
	}
	return configuredUrl;
}
