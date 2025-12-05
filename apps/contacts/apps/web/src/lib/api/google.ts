import { authStore } from '$lib/stores/auth.svelte';

const API_BASE = 'http://localhost:3015/api/v1';

export interface GoogleContact {
	resourceName: string;
	names?: Array<{
		displayName?: string;
		familyName?: string;
		givenName?: string;
	}>;
	emailAddresses?: Array<{
		value?: string;
		type?: string;
	}>;
	phoneNumbers?: Array<{
		value?: string;
		type?: string;
	}>;
	organizations?: Array<{
		name?: string;
		title?: string;
	}>;
	photos?: Array<{
		url?: string;
	}>;
}

export interface GoogleContactsResponse {
	contacts: GoogleContact[];
	nextPageToken?: string;
	totalPeople?: number;
}

export interface ConnectedAccount {
	id: string;
	providerEmail: string | null;
	createdAt: string;
}

export interface GoogleStatus {
	connected: boolean;
	account: ConnectedAccount | null;
}

export interface GoogleImportResult {
	imported: number;
	skipped: number;
	errors: Array<{
		resourceName: string;
		error: string;
	}>;
}

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

export const googleApi = {
	/**
	 * Get OAuth authorization URL
	 */
	async getAuthUrl(): Promise<string> {
		const response = await fetchWithAuth('/google/auth-url');
		return response.url;
	},

	/**
	 * Exchange authorization code for tokens
	 */
	async handleCallback(code: string): Promise<{ success: boolean; account: ConnectedAccount }> {
		return fetchWithAuth('/google/callback', {
			method: 'POST',
			body: JSON.stringify({ code }),
		});
	},

	/**
	 * Get connection status
	 */
	async getStatus(): Promise<GoogleStatus> {
		return fetchWithAuth('/google/status');
	},

	/**
	 * Disconnect Google account
	 */
	async disconnect(): Promise<void> {
		await fetchWithAuth('/google/disconnect', {
			method: 'DELETE',
		});
	},

	/**
	 * Fetch contacts from Google
	 */
	async fetchContacts(pageToken?: string): Promise<GoogleContactsResponse> {
		const params = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : '';
		return fetchWithAuth(`/google/contacts${params}`);
	},

	/**
	 * Import selected contacts
	 */
	async importContacts(resourceNames?: string[], all = false): Promise<GoogleImportResult> {
		return fetchWithAuth('/google/import', {
			method: 'POST',
			body: JSON.stringify({ resourceNames, all }),
		});
	},
};
