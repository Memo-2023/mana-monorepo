/**
 * Contacts API Client for cross-app integration
 *
 * This client allows other apps (Todo, Calendar) to search and fetch contacts
 * from the Contacts app backend.
 */

import type { ContactSummary } from '@manacore/shared-types';

export interface ContactsClientConfig {
	/** Base URL of the Contacts API (e.g., http://localhost:3015/api/v1) */
	apiUrl: string;
	/** Function to get the current auth token */
	getAuthToken: () => Promise<string | null>;
	/** Request timeout in ms (default: 5000) */
	timeout?: number;
}

export interface ContactSearchOptions {
	/** Search query string */
	query?: string;
	/** Maximum number of results */
	limit?: number;
	/** Skip archived contacts */
	excludeArchived?: boolean;
}

/**
 * Client for accessing the Contacts API from other apps
 */
export class ContactsClient {
	private config: ContactsClientConfig;
	private available: boolean | null = null;

	constructor(config: ContactsClientConfig) {
		this.config = {
			timeout: 5000,
			...config,
		};
	}

	/**
	 * Check if the Contacts API is available
	 */
	async isAvailable(): Promise<boolean> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

			const response = await fetch(`${this.config.apiUrl}/health`, {
				method: 'GET',
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			this.available = response.ok;
			return this.available;
		} catch {
			this.available = false;
			return false;
		}
	}

	/**
	 * Get cached availability status (call isAvailable() to refresh)
	 */
	getCachedAvailability(): boolean | null {
		return this.available;
	}

	/**
	 * Search contacts by query string
	 */
	async searchContacts(options: ContactSearchOptions = {}): Promise<ContactSummary[]> {
		const { query = '', limit = 20, excludeArchived = true } = options;

		const params = new URLSearchParams();
		if (query) params.set('search', query);
		if (limit) params.set('limit', String(limit));
		if (excludeArchived) params.set('isArchived', 'false');

		try {
			const response = (await this.fetchWithAuth(`/contacts?${params.toString()}`)) as {
				contacts?: Record<string, unknown>[];
			};
			return this.mapToContactSummaries(response.contacts || []);
		} catch (error) {
			console.error('[ContactsClient] Failed to search contacts:', error);
			return [];
		}
	}

	/**
	 * Get a single contact by ID
	 */
	async getContact(id: string): Promise<ContactSummary | null> {
		try {
			const response = (await this.fetchWithAuth(`/contacts/${id}`)) as {
				contact?: Record<string, unknown>;
			};
			if (response.contact) {
				return this.mapToContactSummary(response.contact);
			}
			return null;
		} catch (error) {
			console.error(`[ContactsClient] Failed to get contact ${id}:`, error);
			return null;
		}
	}

	/**
	 * Get multiple contacts by IDs (batch fetch)
	 */
	async getContacts(ids: string[]): Promise<ContactSummary[]> {
		if (ids.length === 0) return [];

		// Contacts API doesn't have a batch endpoint, so we fetch individually
		// but with Promise.allSettled to handle partial failures gracefully
		const results = await Promise.allSettled(ids.map((id) => this.getContact(id)));

		return results
			.filter(
				(result): result is PromiseFulfilledResult<ContactSummary | null> =>
					result.status === 'fulfilled' && result.value !== null
			)
			.map((result) => result.value as ContactSummary);
	}

	/**
	 * Internal fetch with auth token
	 */
	private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<unknown> {
		const token = await this.config.getAuthToken();

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

		const headers: HeadersInit = {
			'Content-Type': 'application/json',
			...(options.headers || {}),
		};

		if (token) {
			(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
		}

		try {
			const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
				...options,
				headers,
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const error = await response.json().catch(() => ({ message: 'Request failed' }));
				throw new Error(error.message || `HTTP ${response.status}`);
			}

			return response.json();
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Request timeout');
			}
			throw error;
		}
	}

	/**
	 * Map API contact response to ContactSummary
	 */
	private mapToContactSummary(contact: Record<string, unknown>): ContactSummary {
		return {
			id: contact.id as string,
			displayName:
				(contact.displayName as string) ||
				[contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
				(contact.email as string) ||
				'Unbekannt',
			firstName: contact.firstName as string | undefined,
			lastName: contact.lastName as string | undefined,
			email: contact.email as string | undefined,
			phone: (contact.phone as string) || (contact.mobile as string) || undefined,
			company: contact.company as string | undefined,
			photoUrl: contact.photoUrl as string | undefined,
		};
	}

	/**
	 * Map array of contacts to ContactSummary[]
	 */
	private mapToContactSummaries(contacts: Record<string, unknown>[]): ContactSummary[] {
		return contacts.map((c) => this.mapToContactSummary(c));
	}
}

/**
 * Create a ContactsClient instance
 */
export function createContactsClient(config: ContactsClientConfig): ContactsClient {
	return new ContactsClient(config);
}
