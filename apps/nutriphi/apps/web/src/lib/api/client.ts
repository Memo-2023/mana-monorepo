import { authStore } from '$lib/stores/auth.svelte';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const BASE_URL = PUBLIC_BACKEND_URL || 'http://localhost:3023';

class ApiClient {
	private async getHeaders(): Promise<HeadersInit> {
		const token = await authStore.getAccessToken();
		return {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		};
	}

	async get<T>(path: string): Promise<T> {
		const response = await fetch(`${BASE_URL}/api/v1${path}`, {
			method: 'GET',
			headers: await this.getHeaders(),
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status}`);
		}

		return response.json();
	}

	async post<T>(path: string, data: unknown): Promise<T> {
		const response = await fetch(`${BASE_URL}/api/v1${path}`, {
			method: 'POST',
			headers: await this.getHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status}`);
		}

		return response.json();
	}

	async patch<T>(path: string, data: unknown): Promise<T> {
		const response = await fetch(`${BASE_URL}/api/v1${path}`, {
			method: 'PATCH',
			headers: await this.getHeaders(),
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status}`);
		}

		return response.json();
	}

	async delete(path: string): Promise<void> {
		const response = await fetch(`${BASE_URL}/api/v1${path}`, {
			method: 'DELETE',
			headers: await this.getHeaders(),
		});

		if (!response.ok) {
			throw new Error(`API Error: ${response.status}`);
		}
	}
}

export const apiClient = new ApiClient();
