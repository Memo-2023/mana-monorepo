/**
 * Session Contacts Store - Temporary local contacts for guest users
 * Contacts are stored in sessionStorage and lost when the browser tab is closed
 */

import type { Contact } from '$lib/api/contacts';
import { browser } from '$app/environment';

const STORAGE_KEY = 'contacts-session-contacts';

// Generate a unique ID for session contacts
function generateSessionId(): string {
	return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Load contacts from sessionStorage
function loadFromStorage(): Contact[] {
	if (!browser) return [];
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

// Save contacts to sessionStorage
function saveToStorage(contacts: Contact[]) {
	if (!browser) return;
	try {
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
	} catch (e) {
		console.warn('Failed to save session contacts:', e);
	}
}

// State
let contacts = $state<Contact[]>(loadFromStorage());

export const sessionContactsStore = {
	get contacts() {
		return contacts;
	},

	get hasContacts() {
		return contacts.length > 0;
	},

	/**
	 * Initialize from sessionStorage (call on mount)
	 */
	initialize() {
		contacts = loadFromStorage();
	},

	/**
	 * Create a new session contact
	 */
	createContact(data: Partial<Contact>): Contact {
		const now = new Date().toISOString();
		const newContact: Contact = {
			id: generateSessionId(),
			userId: 'guest',
			firstName: data.firstName || null,
			lastName: data.lastName || null,
			displayName: data.displayName || null,
			nickname: data.nickname || null,
			email: data.email || null,
			phone: data.phone || null,
			mobile: data.mobile || null,
			street: data.street || null,
			city: data.city || null,
			postalCode: data.postalCode || null,
			country: data.country || null,
			company: data.company || null,
			jobTitle: data.jobTitle || null,
			department: data.department || null,
			website: data.website || null,
			birthday: data.birthday || null,
			notes: data.notes || null,
			photoUrl: data.photoUrl || null,
			customDates: data.customDates || null,
			linkedin: data.linkedin || null,
			twitter: data.twitter || null,
			facebook: data.facebook || null,
			instagram: data.instagram || null,
			xing: data.xing || null,
			github: data.github || null,
			youtube: data.youtube || null,
			tiktok: data.tiktok || null,
			telegram: data.telegram || null,
			whatsapp: data.whatsapp || null,
			signal: data.signal || null,
			discord: data.discord || null,
			bluesky: data.bluesky || null,
			tags: [],
			isFavorite: data.isFavorite || false,
			isArchived: data.isArchived || false,
			organizationId: null,
			teamId: null,
			visibility: 'private',
			createdAt: now,
			updatedAt: now,
		};

		contacts = [...contacts, newContact];
		saveToStorage(contacts);
		return newContact;
	},

	/**
	 * Update a session contact
	 */
	updateContact(id: string, data: Partial<Contact>): Contact | null {
		const index = contacts.findIndex((c) => c.id === id);
		if (index === -1) return null;

		const updatedContact = {
			...contacts[index],
			...data,
			updatedAt: new Date().toISOString(),
		};

		contacts = contacts.map((c) => (c.id === id ? updatedContact : c));
		saveToStorage(contacts);
		return updatedContact;
	},

	/**
	 * Toggle favorite status
	 */
	toggleFavorite(id: string): Contact | null {
		const contact = contacts.find((c) => c.id === id);
		if (!contact) return null;
		return this.updateContact(id, { isFavorite: !contact.isFavorite });
	},

	/**
	 * Toggle archive status
	 */
	toggleArchive(id: string): Contact | null {
		const contact = contacts.find((c) => c.id === id);
		if (!contact) return null;
		return this.updateContact(id, { isArchived: !contact.isArchived });
	},

	/**
	 * Delete a session contact
	 */
	deleteContact(id: string): boolean {
		const hadContact = contacts.some((c) => c.id === id);
		contacts = contacts.filter((c) => c.id !== id);
		saveToStorage(contacts);
		return hadContact;
	},

	/**
	 * Get contact by ID
	 */
	getById(id: string): Contact | undefined {
		return contacts.find((c) => c.id === id);
	},

	/**
	 * Check if a contact ID is a session contact
	 */
	isSessionContact(id: string): boolean {
		return id.startsWith('session_');
	},

	/**
	 * Get all contacts (for migration to cloud on login)
	 */
	getAllContacts(): Contact[] {
		return [...contacts];
	},

	/**
	 * Clear all session contacts (after migration or on explicit clear)
	 */
	clear() {
		contacts = [];
		if (browser) {
			sessionStorage.removeItem(STORAGE_KEY);
		}
	},

	/**
	 * Get count of session contacts
	 */
	get count() {
		return contacts.length;
	},

	/**
	 * Get favorite contacts
	 */
	get favoriteContacts() {
		return contacts.filter((c) => c.isFavorite && !c.isArchived);
	},

	/**
	 * Get archived contacts
	 */
	get archivedContacts() {
		return contacts.filter((c) => c.isArchived);
	},

	/**
	 * Get active (non-archived) contacts
	 */
	get activeContacts() {
		return contacts.filter((c) => !c.isArchived);
	},

	/**
	 * Search session contacts
	 */
	search(query: string): Contact[] {
		if (!query.trim()) return this.activeContacts;
		const lower = query.toLowerCase();
		return this.activeContacts.filter((c) => {
			const searchFields = [
				c.firstName,
				c.lastName,
				c.displayName,
				c.email,
				c.phone,
				c.mobile,
				c.company,
			];
			return searchFields.some((field) => field?.toLowerCase().includes(lower));
		});
	},
};
