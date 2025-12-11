/**
 * Contacts Store for Calendar App
 *
 * Provides access to contacts from the Contacts app for event attendee management.
 */

import { browser } from '$app/environment';
import { createContactsClient, type ContactsClient } from '@manacore/shared-auth';
import type { ContactSummary } from '@manacore/shared-types';
import { authStore } from './auth.svelte';

// State
let client: ContactsClient | null = null;
let isAvailable = $state<boolean | null>(null);
let isChecking = $state(false);
let lastCheck = $state<number>(0);

// Cache for recent search results
let searchCache = $state<Map<string, { results: ContactSummary[]; timestamp: number }>>(new Map());
const CACHE_TTL = 60000; // 1 minute

// Get contacts API URL dynamically
function getContactsApiUrl(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_CONTACTS_API_URL__?: string })
			.__PUBLIC_CONTACTS_API_URL__;
		return injectedUrl || 'http://localhost:3015/api/v1';
	}
	return 'http://localhost:3015/api/v1';
}

// Initialize client lazily
function getClient(): ContactsClient {
	if (!client) {
		client = createContactsClient({
			apiUrl: getContactsApiUrl(),
			getAuthToken: async () => authStore.getAccessToken(),
			timeout: 5000,
		});
	}
	return client;
}

export const contactsStore = {
	// Getters
	get isAvailable() {
		return isAvailable;
	},
	get isChecking() {
		return isChecking;
	},

	/**
	 * Check if the Contacts API is available
	 * Caches result for 30 seconds
	 */
	async checkAvailability(): Promise<boolean> {
		const now = Date.now();
		// Skip if checked recently
		if (lastCheck && now - lastCheck < 30000 && isAvailable !== null) {
			return isAvailable;
		}

		isChecking = true;
		try {
			const available = await getClient().isAvailable();
			isAvailable = available;
			lastCheck = now;
			return available;
		} catch {
			isAvailable = false;
			lastCheck = now;
			return false;
		} finally {
			isChecking = false;
		}
	},

	/**
	 * Search contacts by query string
	 */
	async searchContacts(query: string): Promise<ContactSummary[]> {
		// Check cache first
		const cacheKey = query.toLowerCase().trim();
		const cached = searchCache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
			return cached.results;
		}

		// Check availability
		if (isAvailable === null) {
			await this.checkAvailability();
		}

		if (!isAvailable) {
			return [];
		}

		try {
			const results = await getClient().searchContacts({
				query,
				limit: 20,
				excludeArchived: true,
			});

			// Cache results
			searchCache.set(cacheKey, {
				results,
				timestamp: Date.now(),
			});

			return results;
		} catch (error) {
			console.error('[contactsStore] Search failed:', error);
			return [];
		}
	},

	/**
	 * Get a single contact by ID
	 */
	async getContact(id: string): Promise<ContactSummary | null> {
		if (isAvailable === null) {
			await this.checkAvailability();
		}

		if (!isAvailable) {
			return null;
		}

		try {
			return await getClient().getContact(id);
		} catch (error) {
			console.error(`[contactsStore] Failed to get contact ${id}:`, error);
			return null;
		}
	},

	/**
	 * Get multiple contacts by IDs
	 */
	async getContacts(ids: string[]): Promise<ContactSummary[]> {
		if (ids.length === 0) return [];

		if (isAvailable === null) {
			await this.checkAvailability();
		}

		if (!isAvailable) {
			return [];
		}

		try {
			return await getClient().getContacts(ids);
		} catch (error) {
			console.error('[contactsStore] Failed to get contacts:', error);
			return [];
		}
	},

	/**
	 * Clear the search cache
	 */
	clearCache() {
		searchCache.clear();
	},

	/**
	 * Reset availability check (force recheck on next call)
	 */
	resetAvailability() {
		isAvailable = null;
		lastCheck = 0;
	},
};
