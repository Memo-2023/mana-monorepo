import { authStore } from '$lib/stores/auth.svelte';
import { API_BASE } from './config';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
	let token: string | null = null;
	try {
		token = await authStore.getAccessToken();
		console.log('[Network API] Got token:', token ? 'present' : 'missing');
	} catch (e) {
		console.error('[Network API] Error getting token:', e);
	}

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...(options.headers || {}),
	};

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const fullUrl = `${API_BASE}${url}`;
	console.log('[Network API] Fetching:', fullUrl);

	const response = await fetch(fullUrl, {
		...options,
		headers,
	});

	console.log('[Network API] Response status:', response.status);

	if (!response.ok) {
		const errorText = await response.text();
		console.error('[Network API] Error response:', errorText);
		let error: { message?: string } = { message: 'Request failed' };
		try {
			error = JSON.parse(errorText);
		} catch {
			error = { message: errorText || 'Request failed' };
		}
		throw new Error(error.message || 'Request failed');
	}

	return response.json();
}

export interface NetworkNode {
	id: string;
	name: string;
	photoUrl: string | null;
	company: string | null;
	isFavorite: boolean;
	tags: { id: string; name: string; color: string | null }[];
	connectionCount: number;
}

export interface NetworkLink {
	source: string;
	target: string;
	type: 'tag';
	strength: number;
	sharedTags: string[];
}

export interface NetworkGraphResponse {
	nodes: NetworkNode[];
	links: NetworkLink[];
}

export const networkApi = {
	async getGraph(): Promise<NetworkGraphResponse> {
		return fetchWithAuth('/network/graph');
	},
};
