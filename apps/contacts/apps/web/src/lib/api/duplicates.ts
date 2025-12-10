import { authStore } from '$lib/stores/auth.svelte';
import { API_BASE } from './config';
import type { Contact } from './contacts';

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

export interface DuplicateGroup {
	id: string;
	contacts: Contact[];
	matchType: 'email' | 'phone' | 'name';
	matchValue: string;
}

export interface MergeResult {
	mergedContact: Contact;
	deletedIds: string[];
}

export const duplicatesApi = {
	async findDuplicates(): Promise<{ duplicates: DuplicateGroup[]; total: number }> {
		return fetchWithAuth('/duplicates');
	},

	async mergeContacts(primaryId: string, mergeIds: string[]): Promise<MergeResult> {
		return fetchWithAuth('/duplicates/merge', {
			method: 'POST',
			body: JSON.stringify({ primaryId, mergeIds }),
		});
	},

	async dismissDuplicate(groupId: string): Promise<void> {
		await fetchWithAuth(`/duplicates/${groupId}/dismiss`, {
			method: 'DELETE',
		});
	},
};
