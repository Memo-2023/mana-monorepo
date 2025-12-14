import { browser } from '$app/environment';
import { authStore } from '$lib/stores/auth.svelte';
import { MANA_AUTH_URL } from './config';
import { fetchWithAuth, fetchWithAuthFormData } from './client';
import { createTagsClient, type Tag } from '@manacore/shared-tags';

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
	// Social Media
	linkedin?: string | null;
	twitter?: string | null;
	facebook?: string | null;
	instagram?: string | null;
	xing?: string | null;
	github?: string | null;
	youtube?: string | null;
	tiktok?: string | null;
	telegram?: string | null;
	whatsapp?: string | null;
	signal?: string | null;
	discord?: string | null;
	bluesky?: string | null;
	// Tags (populated by API)
	tags?: Array<{ id: string; name: string; color: string | null }>;
	isFavorite: boolean;
	isArchived: boolean;
	organizationId?: string | null;
	teamId?: string | null;
	visibility: string;
	createdAt: string;
	updatedAt: string;
}

// Re-export Tag as ContactTag for backward compatibility
export type ContactTag = Tag;

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

// API Response types
interface ContactResponse {
	contact: Contact;
}

interface ContactListResponse {
	contacts: Contact[];
	total: number;
}

// Contacts API
export const contactsApi = {
	async list(filters: ContactFilters = {}): Promise<ContactListResponse> {
		const params = new URLSearchParams();
		if (filters.search) params.set('search', filters.search);
		if (filters.isFavorite !== undefined) params.set('isFavorite', String(filters.isFavorite));
		if (filters.isArchived !== undefined) params.set('isArchived', String(filters.isArchived));
		if (filters.tagId) params.set('tagId', filters.tagId);
		if (filters.limit) params.set('limit', String(filters.limit));
		if (filters.offset) params.set('offset', String(filters.offset));

		const query = params.toString();
		return fetchWithAuth<ContactListResponse>(`/contacts${query ? `?${query}` : ''}`);
	},

	async get(id: string): Promise<Contact> {
		const response = await fetchWithAuth<ContactResponse>(`/contacts/${id}`);
		return response.contact;
	},

	async create(data: Partial<Contact>): Promise<Contact> {
		const response = await fetchWithAuth<ContactResponse>('/contacts', {
			method: 'POST',
			body: JSON.stringify(data),
		});
		return response.contact;
	},

	async update(id: string, data: Partial<Contact>): Promise<Contact> {
		const response = await fetchWithAuth<ContactResponse>(`/contacts/${id}`, {
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
		const response = await fetchWithAuth<ContactResponse>(`/contacts/${id}/favorite`, {
			method: 'POST',
		});
		return response.contact;
	},

	async toggleArchive(id: string): Promise<Contact> {
		const response = await fetchWithAuth<ContactResponse>(`/contacts/${id}/archive`, {
			method: 'POST',
		});
		return response.contact;
	},
};

// Tags API - Uses central Tags API from mana-core-auth
// Contact-tag associations still use the Contacts backend

// Lazy-initialized tags client
let _tagsClient: ReturnType<typeof createTagsClient> | null = null;

function getTagsClient() {
	if (!browser) return null;
	if (!_tagsClient) {
		_tagsClient = createTagsClient({
			authUrl: MANA_AUTH_URL,
			getToken: async () => {
				const token = await authStore.getAccessToken();
				return token || '';
			},
		});
	}
	return _tagsClient;
}

export const tagsApi = {
	// Get all tags from central Tags API
	async list(): Promise<{ tags: ContactTag[] }> {
		const client = getTagsClient();
		if (!client) return { tags: [] };
		const tags = await client.getAll();
		return { tags };
	},

	// Create tag via central Tags API
	async create(data: { name: string; color?: string }): Promise<{ tag: ContactTag }> {
		const client = getTagsClient();
		if (!client) throw new Error('Tags client not available');
		const tag = await client.create(data);
		return { tag };
	},

	// Update tag via central Tags API
	async update(id: string, data: { name?: string; color?: string }): Promise<{ tag: ContactTag }> {
		const client = getTagsClient();
		if (!client) throw new Error('Tags client not available');
		const tag = await client.update(id, data);
		return { tag };
	},

	// Delete tag via central Tags API
	async delete(id: string): Promise<{ success: boolean }> {
		const client = getTagsClient();
		if (!client) throw new Error('Tags client not available');
		await client.delete(id);
		return { success: true };
	},

	// Contact-tag associations still use Contacts backend
	async addToContact(tagId: string, contactId: string): Promise<{ success: boolean }> {
		return fetchWithAuth<{ success: boolean }>(`/tags/${tagId}/contacts/${contactId}`, {
			method: 'POST',
		});
	},

	async removeFromContact(tagId: string, contactId: string): Promise<{ success: boolean }> {
		return fetchWithAuth<{ success: boolean }>(`/tags/${tagId}/contacts/${contactId}`, {
			method: 'DELETE',
		});
	},

	async getForContact(contactId: string): Promise<{ tagIds: string[] }> {
		return fetchWithAuth<{ tagIds: string[] }>(`/tags/contact/${contactId}`);
	},

	// Create default tags via central Tags API
	async createDefaults(): Promise<{ tags: ContactTag[] }> {
		const client = getTagsClient();
		if (!client) return { tags: [] };
		const tags = await client.createDefaults();
		return { tags };
	},
};

// Notes API Response types
interface NotesListResponse {
	notes: ContactNote[];
}

interface NoteResponse {
	note: ContactNote;
}

// Notes API
export const notesApi = {
	async list(contactId: string): Promise<NotesListResponse> {
		return fetchWithAuth<NotesListResponse>(`/contacts/${contactId}/notes`);
	},

	async create(
		contactId: string,
		data: { content: string; isPinned?: boolean }
	): Promise<NoteResponse> {
		return fetchWithAuth<NoteResponse>(`/contacts/${contactId}/notes`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async update(
		noteId: string,
		data: { content?: string; isPinned?: boolean }
	): Promise<NoteResponse> {
		return fetchWithAuth<NoteResponse>(`/notes/${noteId}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
		});
	},

	async delete(noteId: string): Promise<void> {
		await fetchWithAuth(`/notes/${noteId}`, {
			method: 'DELETE',
		});
	},

	async togglePin(noteId: string): Promise<NoteResponse> {
		return fetchWithAuth<NoteResponse>(`/notes/${noteId}/pin`, {
			method: 'POST',
		});
	},
};

// Activities API Response types
interface ActivitiesListResponse {
	activities: ContactActivity[];
}

interface ActivityResponse {
	activity: ContactActivity;
}

// Activities API
export const activitiesApi = {
	async list(contactId: string, limit?: number): Promise<ActivitiesListResponse> {
		const params = limit ? `?limit=${limit}` : '';
		return fetchWithAuth<ActivitiesListResponse>(`/contacts/${contactId}/activities${params}`);
	},

	async create(
		contactId: string,
		data: {
			activityType: 'created' | 'updated' | 'called' | 'emailed' | 'met' | 'note_added';
			description?: string;
			metadata?: Record<string, unknown>;
		}
	): Promise<ActivityResponse> {
		return fetchWithAuth<ActivityResponse>(`/contacts/${contactId}/activities`, {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},
};

// Photo API
export const photoApi = {
	async upload(contactId: string, file: File): Promise<{ photoUrl: string }> {
		const formData = new FormData();
		formData.append('photo', file);

		return fetchWithAuthFormData<{ photoUrl: string }>(`/contacts/${contactId}/photo`, {
			method: 'POST',
			body: formData,
		});
	},

	async delete(contactId: string): Promise<void> {
		await fetchWithAuth(`/contacts/${contactId}/photo`, {
			method: 'DELETE',
		});
	},
};
