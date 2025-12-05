import { PUBLIC_BACKEND_URL } from '$env/static/public';

class ApiClient {
	private baseUrl: string;
	private token: string | null = null;

	constructor() {
		this.baseUrl = PUBLIC_BACKEND_URL || 'http://localhost:3019';
	}

	setToken(token: string | null) {
		this.token = token;
	}

	private async request<T>(
		method: string,
		path: string,
		body?: unknown,
		options?: RequestInit
	): Promise<T> {
		const url = `${this.baseUrl}/api/v1${path}`;

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...(this.token && { Authorization: `Bearer ${this.token}` }),
			...options?.headers,
		};

		const response = await fetch(url, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
			...options,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Request failed' }));
			throw new Error(error.message || `HTTP ${response.status}`);
		}

		return response.json();
	}

	get<T>(path: string, options?: RequestInit): Promise<T> {
		return this.request<T>('GET', path, undefined, options);
	}

	post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
		return this.request<T>('POST', path, body, options);
	}

	put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
		return this.request<T>('PUT', path, body, options);
	}

	delete<T>(path: string, options?: RequestInit): Promise<T> {
		return this.request<T>('DELETE', path, undefined, options);
	}
}

export const apiClient = new ApiClient();
