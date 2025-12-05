import { browser } from '$app/environment';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

interface ApiOptions {
	method?: string;
	body?: unknown;
	headers?: Record<string, string>;
}

interface ApiError {
	message: string;
	statusCode: number;
}

class ApiClient {
	private baseUrl: string;
	private accessToken: string | null = null;

	constructor() {
		this.baseUrl = PUBLIC_BACKEND_URL || 'http://localhost:3018';
	}

	setAccessToken(token: string | null) {
		this.accessToken = token;
	}

	getAccessToken(): string | null {
		return this.accessToken;
	}

	async fetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
		const { method = 'GET', body, headers = {} } = options;

		const requestHeaders: Record<string, string> = {
			'Content-Type': 'application/json',
			...headers,
		};

		if (this.accessToken) {
			requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
		}

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			method,
			headers: requestHeaders,
			body: body ? JSON.stringify(body) : undefined,
		});

		if (!response.ok) {
			let errorMessage = 'An error occurred';
			try {
				const errorData = (await response.json()) as ApiError;
				errorMessage = errorData.message || errorMessage;
			} catch {
				errorMessage = response.statusText || errorMessage;
			}
			throw new Error(errorMessage);
		}

		// Handle 204 No Content
		if (response.status === 204) {
			return {} as T;
		}

		return response.json() as Promise<T>;
	}

	// Convenience methods
	get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'GET', headers });
	}

	post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'POST', body, headers });
	}

	put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'PUT', body, headers });
	}

	patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'PATCH', body, headers });
	}

	delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
		return this.fetch<T>(endpoint, { method: 'DELETE', headers });
	}
}

export const apiClient = new ApiClient();
