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

export interface ContactGroup {
	id: string;
	userId: string;
	name: string;
	description?: string | null;
	color?: string | null;
	createdAt: string;
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
	groupId?: string;
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
		if (filters.groupId) params.set('groupId', filters.groupId);
		if (filters.tagId) params.set('tagId', filters.tagId);
		if (filters.limit) params.set('limit', String(filters.limit));
		if (filters.offset) params.set('offset', String(filters.offset));

		const query = params.toString();
		return fetchWithAuth(`/contacts${query ? `?${query}` : ''}`);
	},

	async get(id: string) {
		return fetchWithAuth(`/contacts/${id}`);
	},

	async create(data: Partial<Contact>) {
		return fetchWithAuth('/contacts', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async update(id: string, data: Partial<Contact>) {
		return fetchWithAuth(`/contacts/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	async delete(id: string) {
		return fetchWithAuth(`/contacts/${id}`, {
			method: 'DELETE',
		});
	},

	async toggleFavorite(id: string) {
		return fetchWithAuth(`/contacts/${id}/favorite`, {
			method: 'POST',
		});
	},

	async toggleArchive(id: string) {
		return fetchWithAuth(`/contacts/${id}/archive`, {
			method: 'POST',
		});
	},
};

// Groups API
export const groupsApi = {
	async list() {
		return fetchWithAuth('/groups');
	},

	async get(id: string) {
		return fetchWithAuth(`/groups/${id}`);
	},

	async create(data: { name: string; description?: string; color?: string }) {
		return fetchWithAuth('/groups', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async update(id: string, data: { name?: string; description?: string; color?: string }) {
		return fetchWithAuth(`/groups/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	async delete(id: string) {
		return fetchWithAuth(`/groups/${id}`, {
			method: 'DELETE',
		});
	},

	async addContacts(groupId: string, contactIds: string[]) {
		return fetchWithAuth(`/groups/${groupId}/contacts`, {
			method: 'POST',
			body: JSON.stringify({ contactIds }),
		});
	},

	async removeContact(groupId: string, contactId: string) {
		return fetchWithAuth(`/groups/${groupId}/contacts/${contactId}`, {
			method: 'DELETE',
		});
	},
};

// Tags API
export const tagsApi = {
	async list() {
		return fetchWithAuth('/tags');
	},

	async create(data: { name: string; color?: string }) {
		return fetchWithAuth('/tags', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async update(id: string, data: { name?: string; color?: string }) {
		return fetchWithAuth(`/tags/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	async delete(id: string) {
		return fetchWithAuth(`/tags/${id}`, {
			method: 'DELETE',
		});
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
