import { authStore } from '$lib/stores/auth.svelte';
import { API_BASE } from './config';

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

export interface Contact {
	id: string;
	userId: string;
	firstName?: string | null;
	lastName?: string | null;
	displayName?: string | null;
	nickname?: string | null;
	email?: string | null;
	phone?: string | null;
	mobile?: string | null;
	street?: string | null;
	city?: string | null;
	postalCode?: string | null;
	country?: string | null;
	company?: string | null;
	jobTitle?: string | null;
	department?: string | null;
	website?: string | null;
	birthday?: string | null;
	notes?: string | null;
	photoUrl?: string | null;
	isFavorite: boolean;
	isArchived: boolean;
	organizationId?: string | null;
	teamId?: string | null;
	visibility: string;
	createdAt: string;
	updatedAt: string;
}

export interface ContactTag {
	id: string;
	userId: string;
	name: string;
	color?: string | null;
	createdAt: string;
}

export interface ContactNote {
	id: string;
	contactId: string;
	userId: string;
	content: string;
	isPinned: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface ContactActivity {
	id: string;
	contactId: string;
	userId: string;
	activityType: string;
	description?: string | null;
	metadata?: Record<string, unknown>;
	createdAt: string;
}

export interface ContactFilters {
	search?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	tagId?: string;
	limit?: number;
	offset?: number;
}

// Contacts API
export const contactsApi = {
	async list(filters: ContactFilters = {}) {
		const params = new URLSearchParams();
		if (filters.search) params.set('search', filters.search);
		if (filters.isFavorite !== undefined) params.set('isFavorite', String(filters.isFavorite));
		if (filters.isArchived !== undefined) params.set('isArchived', String(filters.isArchived));
		if (filters.tagId) params.set('tagId', filters.tagId);
		if (filters.limit) params.set('limit', String(filters.limit));
		if (filters.offset) params.set('offset', String(filters.offset));

		const query = params.toString();
		return fetchWithAuth(`/contacts${query ? `?${query}` : ''}`);
	},

	async get(id: string): Promise<Contact> {
		const response = await fetchWithAuth(`/contacts/${id}`);
		return response.contact;
	},

	async create(data: Partial<Contact>): Promise<Contact> {
		const response = await fetchWithAuth('/contacts', {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return response.contact;
	},

	async update(id: string, data: Partial<Contact>): Promise<Contact> {
		const response = await fetchWithAuth(`/contacts/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
		return response.contact;
	},

	async delete(id: string): Promise<void> {
		await fetchWithAuth(`/contacts/${id}`, {
			method: 'DELETE',
		});
	},

	async toggleFavorite(id: string): Promise<Contact> {
		const response = await fetchWithAuth(`/contacts/${id}/favorite`, {
			method: 'POST',
		});
		return response.contact;
	},

	async toggleArchive(id: string): Promise<Contact> {
		const response = await fetchWithAuth(`/contacts/${id}/archive`, {
			method: 'POST',
		});
		return response.contact;
	},
};

// Tags API
export const tagsApi = {
	async list(): Promise<{ tags: ContactTag[] }> {
		return fetchWithAuth('/tags');
	},

	async create(data: { name: string; color?: string }): Promise<{ tag: ContactTag }> {
		return fetchWithAuth('/tags', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async update(id: string, data: { name?: string; color?: string }): Promise<{ tag: ContactTag }> {
		return fetchWithAuth(`/tags/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	async delete(id: string): Promise<{ success: boolean }> {
		return fetchWithAuth(`/tags/${id}`, {
			method: 'DELETE',
		});
	},

	async addToContact(tagId: string, contactId: string): Promise<{ success: boolean }> {
		return fetchWithAuth(`/tags/${tagId}/contacts/${contactId}`, {
			method: 'POST',
		});
	},

	async removeFromContact(tagId: string, contactId: string): Promise<{ success: boolean }> {
		return fetchWithAuth(`/tags/${tagId}/contacts/${contactId}`, {
			method: 'DELETE',
		});
	},

	async getForContact(contactId: string): Promise<{ tagIds: string[] }> {
		return fetchWithAuth(`/tags/contact/${contactId}`);
	},
};

// Notes API
export const notesApi = {
	async list(contactId: string) {
		return fetchWithAuth(`/contacts/${contactId}/notes`);
	},

	async create(contactId: string, data: { content: string; isPinned?: boolean }) {
		return fetchWithAuth(`/contacts/${contactId}/notes`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async update(noteId: string, data: { content?: string; isPinned?: boolean }) {
		return fetchWithAuth(`/notes/${noteId}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	async delete(noteId: string) {
		return fetchWithAuth(`/notes/${noteId}`, {
			method: 'DELETE',
		});
	},

	async togglePin(noteId: string) {
		return fetchWithAuth(`/notes/${noteId}/pin`, {
			method: 'POST',
		});
	},
};

// Activities API
export const activitiesApi = {
	async list(contactId: string, limit?: number) {
		const params = limit ? `?limit=${limit}` : '';
		return fetchWithAuth(`/contacts/${contactId}/activities${params}`);
	},

	async create(
		contactId: string,
		data: {
			activityType: 'created' | 'updated' | 'called' | 'emailed' | 'met' | 'note_added';
			description?: string;
			metadata?: Record<string, unknown>;
		}
	) {
		return fetchWithAuth(`/contacts/${contactId}/activities`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},
};

// Photo API
export const photoApi = {
	async upload(contactId: string, file: File): Promise<{ photoUrl: string }> {
		const token = await authStore.getAccessToken();

		const formData = new FormData();
		formData.append('photo', file);

		const response = await fetch(`${API_BASE}/contacts/${contactId}/photo`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: formData,
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ message: 'Upload failed' }));
			throw new Error(error.message || 'Upload failed');
		}

		return response.json();
	},

	async delete(contactId: string): Promise<void> {
		await fetchWithAuth(`/contacts/${contactId}/photo`, {
			method: 'DELETE',
		});
	},
};
