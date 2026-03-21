/**
 * Contacts Store - Manages contacts state using Svelte 5 runes
 * Authenticated users: contacts from API
 * Demo mode: static sample contacts to showcase the app
 */

import { contactsApi } from '$lib/api/contacts';
import type { Contact, ContactFilters } from '$lib/api/contacts';
import { authStore } from './auth.svelte';
import { generateDemoContacts, isDemoContact } from '$lib/data/demo-contacts';

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 50;

// State
let contacts = $state<Contact[]>([]);
let selfContact = $state<Contact | null>(null);
let selectedContact = $state<Contact | null>(null);
let loading = $state(false);
let loadingMore = $state(false);
let error = $state<string | null>(null);
let total = $state(0);
let filters = $state<ContactFilters>({});
let hasMore = $state(true);
let currentOffset = $state(0);

export const contactsStore = {
	// Getters
	get contacts() {
		return contacts;
	},
	get selfContact() {
		return selfContact;
	},
	get selectedContact() {
		return selectedContact;
	},
	get loading() {
		return loading;
	},
	get loadingMore() {
		return loadingMore;
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
	get hasMore() {
		return hasMore;
	},

	/**
	 * Load contacts with optional filters (resets to first page)
	 * In demo mode, loads static sample contacts
	 */
	async loadContacts(newFilters?: ContactFilters) {
		if (newFilters) {
			filters = { ...filters, ...newFilters };
		}

		loading = true;
		error = null;
		currentOffset = 0;

		// Demo mode: load static demo contacts
		if (!authStore.isAuthenticated) {
			let demoContacts = generateDemoContacts();

			// Apply filters to demo contacts
			if (filters.search) {
				const search = filters.search.toLowerCase();
				demoContacts = demoContacts.filter(
					(c) =>
						c.displayName?.toLowerCase().includes(search) ||
						c.email?.toLowerCase().includes(search) ||
						c.company?.toLowerCase().includes(search)
				);
			}
			if (filters.isFavorite !== undefined) {
				demoContacts = demoContacts.filter((c) => c.isFavorite === filters.isFavorite);
			}
			if (filters.isArchived !== undefined) {
				demoContacts = demoContacts.filter((c) => c.isArchived === filters.isArchived);
			}

			contacts = demoContacts;
			total = demoContacts.length;
			hasMore = false;
			loading = false;
			return;
		}

		// Authenticated: fetch from API
		try {
			const result = await contactsApi.list({
				...filters,
				limit: DEFAULT_PAGE_SIZE,
				offset: 0,
			});
			// Extract self contact from the list
			const self = result.contacts.find((c) => c.isSelf);
			if (self) {
				selfContact = self;
			}
			contacts = result.contacts.filter((c) => !c.isSelf);
			total = result.total;
			hasMore = contacts.length < total;
			currentOffset = contacts.length;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load contacts';
			console.error('Failed to load contacts:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Load more contacts (infinite scroll)
	 */
	async loadMore() {
		if (loadingMore || !hasMore) return;

		loadingMore = true;
		error = null;

		try {
			const result = await contactsApi.list({
				...filters,
				limit: DEFAULT_PAGE_SIZE,
				offset: currentOffset,
			});

			const newContacts = result.contacts.filter((c) => !c.isSelf);
			contacts = [...contacts, ...newContacts];
			total = result.total;
			currentOffset += newContacts.length;
			hasMore = contacts.length < total;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load more contacts';
			console.error('Failed to load more contacts:', e);
		} finally {
			loadingMore = false;
		}
	},

	/**
	 * Load a single contact by ID
	 */
	async loadContact(id: string) {
		loading = true;
		error = null;

		try {
			const contact = await contactsApi.get(id);
			selectedContact = contact;
			return contact;
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
	 * Requires authentication - demo mode shows auth gate
	 */
	async createContact(data: Partial<Contact>) {
		// Demo mode: require authentication
		if (!authStore.isAuthenticated) {
			return { error: 'auth_required' as const };
		}

		loading = true;
		error = null;

		try {
			const contact = await contactsApi.create(data);
			// Add to local state
			contacts = [contact, ...contacts];
			total += 1;
			return contact;
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
	 * Demo contacts require authentication
	 */
	async updateContact(id: string, data: Partial<Contact>) {
		// Demo contact: require authentication
		if (isDemoContact(id)) {
			return { error: 'auth_required' as const };
		}

		loading = true;
		error = null;

		try {
			const contact = await contactsApi.update(id, data);
			// Update in local state
			if (contact.isSelf) {
				selfContact = contact;
			} else {
				contacts = contacts.map((c) => (c.id === id ? contact : c));
			}
			if (selectedContact?.id === id) {
				selectedContact = contact;
			}
			return contact;
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
	 * Demo contacts require authentication
	 */
	async deleteContact(id: string) {
		// Demo contact: require authentication
		if (isDemoContact(id)) {
			return { error: 'auth_required' as const };
		}

		// Prevent deleting self contact
		if (selfContact?.id === id) {
			return;
		}

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
	 * Demo contacts require authentication
	 */
	async toggleFavorite(id: string) {
		// Demo contact: require authentication
		if (isDemoContact(id)) {
			return { error: 'auth_required' as const };
		}

		try {
			const contact = await contactsApi.toggleFavorite(id);
			// Update in local state
			contacts = contacts.map((c) => (c.id === id ? contact : c));
			if (selectedContact?.id === id) {
				selectedContact = contact;
			}
			return contact;
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
			throw e;
		}
	},

	/**
	 * Toggle archive status
	 * Demo contacts require authentication
	 */
	async toggleArchive(id: string) {
		// Demo contact: require authentication
		if (isDemoContact(id)) {
			return { error: 'auth_required' as const };
		}

		try {
			const contact = await contactsApi.toggleArchive(id);
			// Remove from current view if archived/unarchived
			contacts = contacts.filter((c) => c.id !== id);
			total -= 1;
			if (selectedContact?.id === id) {
				selectedContact = null;
			}
			return contact;
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
	 * Set tag filter
	 */
	setTagId(tagId: string | undefined) {
		filters = { ...filters, tagId };
	},

	/**
	 * Clear selected contact
	 */
	clearSelected() {
		selectedContact = null;
	},

	/**
	 * Check if a contact is a demo contact (static sample data)
	 */
	isDemoContact(contactId: string) {
		return isDemoContact(contactId);
	},
};
