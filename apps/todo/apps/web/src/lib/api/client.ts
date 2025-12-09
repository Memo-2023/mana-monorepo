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

/**
 * Get the backend URL, preferring runtime-injected value in browser
 * This allows Docker to inject PUBLIC_BACKEND_URL_CLIENT at runtime
 * instead of using the build-time PUBLIC_BACKEND_URL
 */
function getBackendUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const runtimeUrl = (window as Window & { __PUBLIC_BACKEND_URL__?: string })
			.__PUBLIC_BACKEND_URL__;
		if (runtimeUrl) {
			return runtimeUrl;
		}
	}
	return PUBLIC_BACKEND_URL || 'http://localhost:3018';
}

class ApiClient {
	private accessToken: string | null = null;

	// Use getter to evaluate URL at request time (browser may hydrate after construction)
	private get baseUrl(): string {
		return getBackendUrl();
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
