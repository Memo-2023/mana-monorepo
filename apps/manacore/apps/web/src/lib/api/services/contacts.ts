/**
 * Contacts API Service
 *
 * Fetches contacts from the Contacts backend for dashboard widgets.
 */

import { createApiClient, type ApiResult } from '../base-client';

// Backend URL - falls back to localhost for development
const CONTACTS_API_URL = import.meta.env.PUBLIC_CONTACTS_API_URL || 'http://localhost:3015/api/v1';

const client = createApiClient(CONTACTS_API_URL);

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
 * Contacts service for dashboard widgets
 */
export const contactsService = {
	/**
	 * Get favorite contacts
	 */
	async getFavoriteContacts(limit: number = 5): Promise<ApiResult<Contact[]>> {
		const result = await client.get<Contact[]>(`/contacts?isFavorite=true&limit=${limit}`);
		return result;
	},

	/**
	 * Get recent contacts (by updatedAt)
	 */
	async getRecentContacts(limit: number = 5): Promise<ApiResult<Contact[]>> {
		const result = await client.get<Contact[]>(`/contacts?limit=${limit}`);

		if (result.error || !result.data) {
			return result;
		}

		// Sort by updatedAt and filter archived
		const sorted = result.data
			.filter((c) => !c.isArchived)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
			.slice(0, limit);

		return { data: sorted, error: null };
	},

	/**
	 * Get contacts with upcoming birthdays
	 */
	async getUpcomingBirthdays(days: number = 30): Promise<ApiResult<Contact[]>> {
		const result = await client.get<Contact[]>('/contacts');

		if (result.error || !result.data) {
			return result;
		}

		const today = new Date();
		const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

		const withBirthdays = result.data.filter((c) => {
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
		const result = await client.get<Contact[]>('/contacts');

		if (result.error || !result.data) {
			return { data: null, error: result.error };
		}

		const active = result.data.filter((c) => !c.isArchived);
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
