/**
 * Shared API Client Factory
 * Creates a configured API client for making authenticated requests.
 */

import type { ApiResponse, FetchOptions, HttpMethod } from './types';

export interface ApiClientConfig {
	/** Base URL for the API (e.g., 'http://localhost:3002') */
	baseUrl: string;
	/** Optional API prefix (default: '/api') */
	apiPrefix?: string;
	/** Function to get the current auth token */
	getToken?: () => Promise<string | null> | string | null;
	/** Whether running in browser environment */
	isBrowser?: boolean;
	/** Local storage key for token fallback */
	tokenStorageKey?: string;
}

export interface ApiClient {
	/** Make a GET request */
	get: <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) => Promise<ApiResponse<T>>;
	/** Make a POST request */
	post: <T>(
		endpoint: string,
		body?: unknown,
		options?: Omit<FetchOptions, 'method' | 'body'>
	) => Promise<ApiResponse<T>>;
	/** Make a PUT request */
	put: <T>(
		endpoint: string,
		body?: unknown,
		options?: Omit<FetchOptions, 'method' | 'body'>
	) => Promise<ApiResponse<T>>;
	/** Make a PATCH request */
	patch: <T>(
		endpoint: string,
		body?: unknown,
		options?: Omit<FetchOptions, 'method' | 'body'>
	) => Promise<ApiResponse<T>>;
	/** Make a DELETE request */
	delete: <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) => Promise<ApiResponse<T>>;
	/** Make a request with any method */
	request: <T>(endpoint: string, options?: FetchOptions) => Promise<ApiResponse<T>>;
	/** Upload a single file */
	uploadFile: <T>(endpoint: string, file: File, token?: string) => Promise<ApiResponse<T>>;
	/** Upload multiple files */
	uploadFiles: <T>(endpoint: string, files: File[], token?: string) => Promise<ApiResponse<T>>;
}

/**
 * Create an API client with the given configuration.
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
	const { baseUrl, apiPrefix = '/api', getToken, isBrowser = true, tokenStorageKey } = config;

	async function getAuthToken(providedToken?: string): Promise<string | undefined> {
		if (providedToken) return providedToken;

		if (getToken) {
			const token = await getToken();
			if (token) return token;
		}

		// Fallback to localStorage if in browser and key provided
		if (isBrowser && tokenStorageKey && typeof localStorage !== 'undefined') {
			return localStorage.getItem(tokenStorageKey) || undefined;
		}

		return undefined;
	}

	async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
		const { method = 'GET', body, token, isFormData = false, headers: customHeaders } = options;

		const authToken = await getAuthToken(token);

		try {
			const headers: Record<string, string> = { ...customHeaders };

			// Don't set Content-Type for FormData - browser sets it automatically with boundary
			if (!isFormData) {
				headers['Content-Type'] = 'application/json';
			}

			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}

			const url = `${baseUrl}${apiPrefix}${endpoint}`;
			const response = await fetch(url, {
				method,
				headers,
				body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					data: null,
					error: new Error(errorData.message || `API error: ${response.status}`),
				};
			}

			// Handle empty responses (204 No Content)
			if (response.status === 204) {
				return { data: null, error: null };
			}

			const data = await response.json();
			return { data, error: null };
		} catch (error) {
			return {
				data: null,
				error: error instanceof Error ? error : new Error('Unknown error'),
			};
		}
	}

	async function uploadFile<T>(
		endpoint: string,
		file: File,
		token?: string
	): Promise<ApiResponse<T>> {
		const authToken = await getAuthToken(token);

		try {
			const formData = new FormData();
			formData.append('file', file);

			const headers: Record<string, string> = {};
			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}

			const response = await fetch(`${baseUrl}${apiPrefix}${endpoint}`, {
				method: 'POST',
				headers,
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					data: null,
					error: new Error(errorData.message || `Upload error: ${response.status}`),
				};
			}

			const data = await response.json();
			return { data, error: null };
		} catch (error) {
			return {
				data: null,
				error: error instanceof Error ? error : new Error('Upload failed'),
			};
		}
	}

	async function uploadFiles<T>(
		endpoint: string,
		files: File[],
		token?: string
	): Promise<ApiResponse<T>> {
		const authToken = await getAuthToken(token);

		try {
			const formData = new FormData();
			files.forEach((file) => {
				formData.append('files', file);
			});

			const headers: Record<string, string> = {};
			if (authToken) {
				headers['Authorization'] = `Bearer ${authToken}`;
			}

			const response = await fetch(`${baseUrl}${apiPrefix}${endpoint}`, {
				method: 'POST',
				headers,
				body: formData,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					data: null,
					error: new Error(errorData.message || `Upload error: ${response.status}`),
				};
			}

			const data = await response.json();
			return { data, error: null };
		} catch (error) {
			return {
				data: null,
				error: error instanceof Error ? error : new Error('Upload failed'),
			};
		}
	}

	return {
		get: <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) =>
			request<T>(endpoint, { ...options, method: 'GET' }),
		post: <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
			request<T>(endpoint, { ...options, method: 'POST', body }),
		put: <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
			request<T>(endpoint, { ...options, method: 'PUT', body }),
		patch: <T>(endpoint: string, body?: unknown, options?: Omit<FetchOptions, 'method' | 'body'>) =>
			request<T>(endpoint, { ...options, method: 'PATCH', body }),
		delete: <T>(endpoint: string, options?: Omit<FetchOptions, 'method'>) =>
			request<T>(endpoint, { ...options, method: 'DELETE' }),
		request,
		uploadFile,
		uploadFiles,
	};
}
