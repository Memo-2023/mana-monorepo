/**
 * Contacts API Service
 *
 * Fetches contacts from the Contacts backend for dashboard widgets.
 */

import { browser } from '$app/environment';
import { createApiClient, type ApiResult } from '../base-client';

// Get Contacts API URL dynamically at runtime
function getContactsApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		// Client-side: use injected window variable (set by hooks.server.ts)
		const injectedUrl = (window as unknown as { __PUBLIC_CONTACTS_API_URL__?: string })
			.__PUBLIC_CONTACTS_API_URL__;
		if (injectedUrl) {
			return `${injectedUrl}/api/v1`;
		}
	}
	// Fallback for local development
	return 'http://localhost:3015/api/v1';
}

// Lazy-initialized client to ensure we get the correct URL at runtime
let _client: ReturnType<typeof createApiClient> | null = null;

function getClient() {
	if (!_client) {
		_client = createApiClient(getContactsApiUrl());
	}
	return _client;
}

/**
 * Contact entity from Contacts backend
 */
export interface Contact {
	id: string;
	userId: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	nickname?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	company?: string;
	jobTitle?: string;
	birthday?: string;
	notes?: string;
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * Activity entity from Contacts backend
 */
export interface ContactActivity {
	id: string;
	contactId: string;
	userId: string;
	activityType: 'created' | 'updated' | 'called' | 'emailed' | 'met' | 'note_added';
	description?: string;
	metadata?: Record<string, unknown>;
	createdAt: string;
}

/**
 * API response format from Contacts backend
 */
interface ContactsApiResponse {
	contacts: Contact[];
	total: number;
}

/**
 * Contacts service for dashboard widgets
 */
export const contactsService = {
	/**
	 * Get favorite contacts
	 */
	async getFavoriteContacts(limit: number = 5): Promise<ApiResult<Contact[]>> {
		const result = await getClient().get<ContactsApiResponse>(
			`/contacts?isFavorite=true&limit=${limit}`
		);

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		return { data: result.data.contacts || [], error: null };
	},

	/**
	 * Get recent contacts (by updatedAt)
	 */
	async getRecentContacts(limit: number = 5): Promise<ApiResult<Contact[]>> {
		const result = await getClient().get<ContactsApiResponse>(`/contacts?limit=${limit}`);

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		// Sort by updatedAt and filter archived
		const sorted = (result.data.contacts || [])
			.filter((c) => !c.isArchived)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
			.slice(0, limit);

		return { data: sorted, error: null };
	},

	/**
	 * Get contacts with upcoming birthdays
	 */
	async getUpcomingBirthdays(days: number = 30): Promise<ApiResult<Contact[]>> {
		const result = await getClient().get<ContactsApiResponse>('/contacts');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		const today = new Date();
		const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

		const withBirthdays = (result.data.contacts || []).filter((c) => {
			if (!c.birthday || c.isArchived) return false;

			const birthday = new Date(c.birthday);
			// Set birthday to this year
			birthday.setFullYear(today.getFullYear());

			// If birthday already passed this year, check next year
			if (birthday < today) {
				birthday.setFullYear(today.getFullYear() + 1);
			}

			return birthday >= today && birthday <= futureDate;
		});

		return { data: withBirthdays, error: null };
	},

	/**
	 * Get contact count
	 */
	async getContactCount(): Promise<ApiResult<{ total: number; favorites: number }>> {
		const result = await getClient().get<ContactsApiResponse>('/contacts');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		const active = (result.data.contacts || []).filter((c) => !c.isArchived);
		const favorites = active.filter((c) => c.isFavorite);

		return { data: { total: active.length, favorites: favorites.length }, error: null };
	},

	/**
	 * Get display name for a contact
	 */
	getDisplayName(contact: Contact): string {
		if (contact.displayName) return contact.displayName;
		if (contact.firstName && contact.lastName) return `${contact.firstName} ${contact.lastName}`;
		if (contact.firstName) return contact.firstName;
		if (contact.lastName) return contact.lastName;
		if (contact.email) return contact.email;
		return 'Unknown';
	},
};
