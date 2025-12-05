/**
 * Shared API Client Types
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface FetchOptions {
	method?: HttpMethod;
	body?: unknown;
	token?: string;
	isFormData?: boolean;
	headers?: Record<string, string>;
}

export interface ApiResponse<T> {
	data: T | null;
	error: Error | null;
}
