/**
 * Contacts Store - Manages contacts state using Svelte 5 runes
 */

import { contactsApi } from '$lib/api/contacts';
import type { Contact, ContactFilters } from '$lib/api/contacts';

// State
let contacts = $state<Contact[]>([]);
let selectedContact = $state<Contact | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);
let total = $state(0);
let filters = $state<ContactFilters>({});

export const contactsStore = {
	// Getters
	get contacts() {
		return contacts;
	},
	get selectedContact() {
		return selectedContact;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get total() {
		return total;
	},
	get filters() {
		return filters;
	},

	/**
	 * Load contacts with optional filters
	 */
	async loadContacts(newFilters?: ContactFilters) {
		if (newFilters) {
			filters = { ...filters, ...newFilters };
		}

		loading = true;
		error = null;

		try {
			const result = await contactsApi.list(filters);
			contacts = result.contacts;
			total = result.total;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load contacts';
			console.error('Failed to load contacts:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Load a single contact by ID
	 */
	async loadContact(id: string) {
		loading = true;
		error = null;

		try {
			const result = await contactsApi.get(id);
			selectedContact = result.contact;
			return result.contact;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load contact';
			console.error('Failed to load contact:', e);
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Create a new contact
	 */
	async createContact(data: Partial<Contact>) {
		loading = true;
		error = null;

		try {
			const result = await contactsApi.create(data);
			// Add to local state
			contacts = [result.contact, ...contacts];
			total += 1;
			return result.contact;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create contact';
			console.error('Failed to create contact:', e);
			throw e;
		} finally {
			loading = false;
		}
	},

	/**
	 * Update a contact
	 */
	async updateContact(id: string, data: Partial<Contact>) {
		loading = true;
		error = null;

		try {
			const result = await contactsApi.update(id, data);
			// Update in local state
			contacts = contacts.map((c) => (c.id === id ? result.contact : c));
			if (selectedContact?.id === id) {
				selectedContact = result.contact;
			}
			return result.contact;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update contact';
			console.error('Failed to update contact:', e);
			throw e;
		} finally {
			loading = false;
		}
	},

	/**
	 * Delete a contact
	 */
	async deleteContact(id: string) {
		loading = true;
		error = null;

		try {
			await contactsApi.delete(id);
			// Remove from local state
			contacts = contacts.filter((c) => c.id !== id);
			total -= 1;
			if (selectedContact?.id === id) {
				selectedContact = null;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete contact';
			console.error('Failed to delete contact:', e);
			throw e;
		} finally {
			loading = false;
		}
	},

	/**
	 * Toggle favorite status
	 */
	async toggleFavorite(id: string) {
		try {
			const result = await contactsApi.toggleFavorite(id);
			// Update in local state
			contacts = contacts.map((c) => (c.id === id ? result.contact : c));
			if (selectedContact?.id === id) {
				selectedContact = result.contact;
			}
			return result.contact;
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
			throw e;
		}
	},

	/**
	 * Toggle archive status
	 */
	async toggleArchive(id: string) {
		try {
			const result = await contactsApi.toggleArchive(id);
			// Remove from current view if archived/unarchived
			contacts = contacts.filter((c) => c.id !== id);
			total -= 1;
			if (selectedContact?.id === id) {
				selectedContact = null;
			}
			return result.contact;
		} catch (e) {
			console.error('Failed to toggle archive:', e);
			throw e;
		}
	},

	/**
	 * Clear filters and reload
	 */
	async clearFilters() {
		filters = {};
		await this.loadContacts();
	},

	/**
	 * Set search query
	 */
	setSearch(search: string) {
		filters = { ...filters, search };
	},

	/**
	 * Clear selected contact
	 */
	clearSelected() {
		selectedContact = null;
	},
};
