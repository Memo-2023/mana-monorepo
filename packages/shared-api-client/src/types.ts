/**
 * API Client Types
 * Go-style Result pattern for consistent error handling
 */

/**
 * Result wrapper for API responses
 * Provides explicit success/error handling without try/catch
 */
export interface ApiResult<T> {
	data: T | null;
	error: ApiError | null;
}

/**
 * Structured API error with type information
 */
export interface ApiError {
	message: string;
	code: ApiErrorCode;
	status?: number;
	details?: unknown;
}

/**
 * Error codes for different failure scenarios
 */
export type ApiErrorCode =
	| 'NETWORK_ERROR'
	| 'TIMEOUT'
	| 'UNAUTHORIZED'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'VALIDATION_ERROR'
	| 'SERVER_ERROR'
	| 'UNKNOWN';

/**
 * Configuration for creating an API client
 */
export interface ApiClientConfig {
	/** Base URL for API requests (e.g., 'http://localhost:3014') */
	baseUrl: string;

	/** API prefix to prepend to all endpoints (e.g., '/api/v1') */
	apiPrefix?: string;

	/** Async function to get the current auth token (supports auto-refresh) */
	getAuthToken?: () => Promise<string | null>;

	/** Request timeout in milliseconds (default: 30000) */
	timeout?: number;

	/** Number of retry attempts for failed requests (default: 0) */
	retries?: number;

	/** Delay between retries in milliseconds (default: 1000) */
	retryDelay?: number;

	/** Custom error handler for logging/reporting */
	onError?: (error: ApiError, endpoint: string) => void;

	/** Enable debug logging (default: false) */
	debug?: boolean;
}

/**
 * Options for individual requests
 */
export interface RequestOptions {
	/** Custom headers to merge with defaults */
	headers?: Record<string, string>;

	/** Override timeout for this request */
	timeout?: number;

	/** Skip authentication for this request */
	skipAuth?: boolean;

	/** Query parameters to append to URL */
	params?: Record<string, string | number | boolean | undefined>;

	/** Override retry count for this request */
	retries?: number;
}

/**
 * API client interface with HTTP methods
 */
export interface ApiClient {
	/** GET request */
	get<T>(endpoint: string, options?: RequestOptions): Promise<ApiResult<T>>;

	/** POST request */
	post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>>;

	/** PUT request */
	put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>>;

	/** PATCH request */
	patch<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>>;

	/** DELETE request */
	delete<T>(endpoint: string, options?: RequestOptions): Promise<ApiResult<T>>;

	/** Upload file(s) with FormData */
	upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<ApiResult<T>>;
}
