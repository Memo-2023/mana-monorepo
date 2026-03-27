/**
 * Contacts Store — Local-First with IndexedDB
 *
 * All reads and writes go to IndexedDB first.
 * When authenticated, changes sync to the server in the background.
 * Same public API as before so components don't need changes.
 */

import { contactCollection, type LocalContact } from '$lib/data/local-store';
import type { Contact, ContactFilters } from '$lib/api/contacts';
import { ContactsEvents } from '@manacore/shared-utils/analytics';

// State — populated from IndexedDB
let contacts = $state<Contact[]>([]);
let selfContact = $state<Contact | null>(null);
let selectedContact = $state<Contact | null>(null);
let loading = $state(false);
let loadingMore = $state(false);
let error = $state<string | null>(null);
let total = $state(0);
let filters = $state<ContactFilters>({});
let hasMore = $state(false);

/** Convert a LocalContact (IndexedDB record) to the shared Contact type. */
function toContact(local: LocalContact): Contact {
	const firstName = local.firstName || null;
	const lastName = local.lastName || null;
	const displayName = [firstName, lastName].filter(Boolean).join(' ') || null;

	return {
		id: local.id,
		userId: 'local',
		firstName,
		lastName,
		displayName,
		email: local.email || null,
		phone: local.phone || null,
		company: local.company || null,
		jobTitle: local.jobTitle || null,
		notes: local.notes || null,
		photoUrl: local.photoUrl || null,
		birthday: local.birthday || null,
		tags: (local.tags || []).map((name, i) => ({ id: `tag-${i}`, name, color: null })),
		isFavorite: local.isFavorite ?? false,
		isArchived: local.isArchived ?? false,
		isSelf: false,
		visibility: 'private',
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

/** Load contacts from IndexedDB into reactive state. */
async function refreshContacts(appliedFilters?: ContactFilters) {
	const filter: Partial<LocalContact> = {};
	if (appliedFilters?.isFavorite !== undefined) filter.isFavorite = appliedFilters.isFavorite;
	if (appliedFilters?.isArchived !== undefined) filter.isArchived = appliedFilters.isArchived;

	let localContacts = await contactCollection.getAll(
		Object.keys(filter).length > 0 ? filter : undefined,
		{ sortBy: 'firstName', sortDirection: 'asc' }
	);

	// Client-side search filter
	if (appliedFilters?.search) {
		const search = appliedFilters.search.toLowerCase();
		localContacts = localContacts.filter(
			(c) =>
				c.firstName?.toLowerCase().includes(search) ||
				c.lastName?.toLowerCase().includes(search) ||
				c.email?.toLowerCase().includes(search) ||
				c.company?.toLowerCase().includes(search)
		);
	}

	contacts = localContacts.map(toContact);
	total = contacts.length;
	hasMore = false;
}

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
	 * Load contacts with optional filters — reads from IndexedDB.
	 */
	async loadContacts(newFilters?: ContactFilters) {
		if (newFilters) {
			filters = { ...filters, ...newFilters };
		}

		loading = true;
		error = null;

		try {
			await refreshContacts(filters);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load contacts';
			console.error('Failed to load contacts:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Load more contacts (infinite scroll) — no-op in local-first mode since all data is local.
	 */
	async loadMore() {
		// All contacts are already loaded from IndexedDB
	},

	/**
	 * Load a single contact by ID — reads from IndexedDB.
	 */
	async loadContact(id: string) {
		loading = true;
		error = null;

		try {
			const local = await contactCollection.get(id);
			if (local) {
				selectedContact = toContact(local);
				return selectedContact;
			}
			return null;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load contact';
			console.error('Failed to load contact:', e);
			return null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Create a new contact — writes to IndexedDB instantly.
	 */
	async createContact(data: Partial<Contact>) {
		error = null;

		try {
			const newLocal: LocalContact = {
				id: crypto.randomUUID(),
				firstName: data.firstName ?? undefined,
				lastName: data.lastName ?? undefined,
				email: data.email ?? undefined,
				phone: data.phone ?? undefined,
				company: data.company ?? undefined,
				jobTitle: data.jobTitle ?? undefined,
				notes: data.notes ?? undefined,
				photoUrl: data.photoUrl ?? undefined,
				birthday: data.birthday ?? undefined,
				tags: data.tags?.map((t) => t.name) ?? [],
				isFavorite: false,
				isArchived: false,
			};

			const inserted = await contactCollection.insert(newLocal);
			const newContact = toContact(inserted);
			contacts = [newContact, ...contacts];
			total += 1;
			ContactsEvents.contactCreated();
			return newContact;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create contact';
			console.error('Failed to create contact:', e);
			throw e;
		}
	},

	/**
	 * Update a contact — writes to IndexedDB instantly.
	 */
	async updateContact(id: string, data: Partial<Contact>) {
		error = null;

		try {
			const updateData: Partial<LocalContact> = {};
			if (data.firstName !== undefined) updateData.firstName = data.firstName ?? undefined;
			if (data.lastName !== undefined) updateData.lastName = data.lastName ?? undefined;
			if (data.email !== undefined) updateData.email = data.email ?? undefined;
			if (data.phone !== undefined) updateData.phone = data.phone ?? undefined;
			if (data.company !== undefined) updateData.company = data.company ?? undefined;
			if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle ?? undefined;
			if (data.notes !== undefined) updateData.notes = data.notes ?? undefined;
			if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl ?? undefined;
			if (data.birthday !== undefined) updateData.birthday = data.birthday ?? undefined;
			if (data.tags !== undefined) updateData.tags = data.tags?.map((t) => t.name) ?? [];
			if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
			if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

			const updated = await contactCollection.update(id, updateData);
			if (updated) {
				const updatedContact = toContact(updated);
				contacts = contacts.map((c) => (c.id === id ? updatedContact : c));
				if (selectedContact?.id === id) {
					selectedContact = updatedContact;
				}
				ContactsEvents.contactUpdated();
				return updatedContact;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update contact';
			console.error('Failed to update contact:', e);
			throw e;
		}
	},

	/**
	 * Delete a contact — removes from IndexedDB instantly.
	 */
	async deleteContact(id: string) {
		error = null;

		try {
			await contactCollection.delete(id);
			contacts = contacts.filter((c) => c.id !== id);
			total -= 1;
			if (selectedContact?.id === id) {
				selectedContact = null;
			}
			ContactsEvents.contactDeleted();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete contact';
			console.error('Failed to delete contact:', e);
			throw e;
		}
	},

	/**
	 * Toggle favorite status — writes to IndexedDB instantly.
	 */
	async toggleFavorite(id: string) {
		try {
			const local = await contactCollection.get(id);
			if (!local) return;

			const updated = await contactCollection.update(id, {
				isFavorite: !local.isFavorite,
			} as Partial<LocalContact>);
			if (updated) {
				const updatedContact = toContact(updated);
				contacts = contacts.map((c) => (c.id === id ? updatedContact : c));
				if (selectedContact?.id === id) {
					selectedContact = updatedContact;
				}
				ContactsEvents.contactFavorited();
				return updatedContact;
			}
		} catch (e) {
			console.error('Failed to toggle favorite:', e);
			throw e;
		}
	},

	/**
	 * Toggle archive status — writes to IndexedDB instantly.
	 */
	async toggleArchive(id: string) {
		try {
			const local = await contactCollection.get(id);
			if (!local) return;

			const updated = await contactCollection.update(id, {
				isArchived: !local.isArchived,
			} as Partial<LocalContact>);
			if (updated) {
				// Remove from current view (archived/unarchived toggle)
				contacts = contacts.filter((c) => c.id !== id);
				total -= 1;
				if (selectedContact?.id === id) {
					selectedContact = null;
				}
				ContactsEvents.contactArchived();
				return toContact(updated);
			}
		} catch (e) {
			console.error('Failed to toggle archive:', e);
			throw e;
		}
	},

	/**
	 * Clear filters and reload.
	 */
	async clearFilters() {
		filters = {};
		await this.loadContacts();
	},

	/**
	 * Set search query.
	 */
	setSearch(search: string) {
		filters = { ...filters, search };
	},

	/**
	 * Set tag filter.
	 */
	setTagId(tagId: string | undefined) {
		filters = { ...filters, tagId };
	},

	/**
	 * Clear selected contact.
	 */
	clearSelected() {
		selectedContact = null;
	},

	/**
	 * No longer relevant — all contacts are local and editable.
	 */
	isDemoContact(_contactId: string) {
		return false;
	},
};
