import { authStore } from '$lib/stores/auth.svelte';

const API_BASE = 'http://localhost:3015/api/v1';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
	const token = await authStore.getAccessToken();

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(`${API_BASE}${url}`, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || 'Request failed');
	}

	return response.json();
}

export interface BatchResult {
	success: number;
	failed: number;
	errors: string[];
}

export const batchApi = {
	async deleteMany(contactIds: string[]): Promise<BatchResult> {
		return fetchWithAuth('/batch/delete', {
			method: 'POST',
			body: JSON.stringify({ contactIds }),
		});
	},

	async archiveMany(contactIds: string[], archive = true): Promise<BatchResult> {
		return fetchWithAuth('/batch/archive', {
			method: 'POST',
			body: JSON.stringify({ contactIds, archive }),
		});
	},

	async favoriteMany(contactIds: string[], favorite = true): Promise<BatchResult> {
		return fetchWithAuth('/batch/favorite', {
			method: 'POST',
			body: JSON.stringify({ contactIds, favorite }),
		});
	},

	async addToGroup(contactIds: string[], groupId: string): Promise<BatchResult> {
		return fetchWithAuth('/batch/add-to-group', {
			method: 'POST',
			body: JSON.stringify({ contactIds, groupId }),
		});
	},

	async removeFromGroup(contactIds: string[], groupId: string): Promise<BatchResult> {
		return fetchWithAuth('/batch/remove-from-group', {
			method: 'POST',
			body: JSON.stringify({ contactIds, groupId }),
		});
	},

	async addTags(contactIds: string[], tagIds: string[]): Promise<BatchResult> {
		return fetchWithAuth('/batch/add-tags', {
			method: 'POST',
			body: JSON.stringify({ contactIds, tagIds }),
		});
	},
};
