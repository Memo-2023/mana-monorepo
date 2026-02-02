/**
 * Cross-App API Client for Contacts Backend - Birthday Data
 * Allows Calendar app to fetch contact birthdays for display
 */

import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { createApiClient } from '@manacore/shared-api-client';
import { authStore } from '$lib/stores/auth.svelte';

// Get contacts API base URL from injected window variable (browser) or env (SSR)
function getContactsApiBase(): string {
	if (browser && typeof window !== 'undefined') {
		const injectedUrl = (window as unknown as { __PUBLIC_CONTACTS_API_URL__?: string })
			.__PUBLIC_CONTACTS_API_URL__;
		if (injectedUrl) return injectedUrl;
	}
	return env.PUBLIC_CONTACTS_API_URL || 'http://localhost:3015';
}

let _contactsClient: ReturnType<typeof createApiClient> | null = null;

function getContactsClient() {
	if (!_contactsClient) {
		_contactsClient = createApiClient({
			baseUrl: getContactsApiBase(),
			apiPrefix: '/api/v1',
			getAuthToken: () => authStore.getValidToken(),
			timeout: 30000,
			debug: import.meta.env.DEV,
		});
	}
	return _contactsClient;
}

// For backwards compatibility
const contactsClient = {
	get: <T>(endpoint: string) => getContactsClient().get<T>(endpoint),
	post: <T>(endpoint: string, body?: unknown) => getContactsClient().post<T>(endpoint, body),
	put: <T>(endpoint: string, body?: unknown) => getContactsClient().put<T>(endpoint, body),
	patch: <T>(endpoint: string, body?: unknown) => getContactsClient().patch<T>(endpoint, body),
	delete: <T>(endpoint: string) => getContactsClient().delete<T>(endpoint),
};

// ============================================
// Types for Birthday Integration
// ============================================

/**
 * Lightweight contact data for birthday display
 * Only essential fields from Contacts API
 */
export interface ContactBirthdaySummary {
	id: string;
	displayName: string | null;
	firstName: string | null;
	lastName: string | null;
	birthday: string; // YYYY-MM-DD format
	photoUrl: string | null;
}

/**
 * Birthday event for calendar display
 * Generated from ContactBirthdaySummary with display date
 */
export interface BirthdayEvent {
	id: string; // Format: birthday-{contactId}-{date}
	contactId: string;
	title: string; // "{Name}'s Geburtstag"
	displayName: string;
	photoUrl: string | null;
	birthday: string; // Original birthday date
	age: number; // Age on this birthday (0 if birth year unknown)
	startTime: string; // ISO date of the birthday occurrence
	endTime: string; // Same as startTime (all-day event)
	isAllDay: true;
	isBirthday: true; // Type discriminator
	calendarId: string; // Virtual calendar ID
}

// ============================================
// API Response Types
// ============================================

interface BirthdaysResponse {
	contacts: ContactBirthdaySummary[];
}

// ============================================
// API Functions
// ============================================

/**
 * Fetch all contacts with birthdays from Contacts service
 */
export async function getBirthdays(): Promise<{
	data: ContactBirthdaySummary[] | null;
	error: Error | null;
}> {
	const result = await contactsClient.get<BirthdaysResponse>('/contacts/birthdays');
	if (result.error) {
		return { data: null, error: new Error(result.error.message) };
	}
	return {
		data: result.data?.contacts || null,
		error: null,
	};
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get display name from contact, with fallback
 */
export function getContactDisplayName(contact: ContactBirthdaySummary): string {
	if (contact.displayName) return contact.displayName;
	const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
	return fullName || 'Unbekannt';
}

/**
 * Birthday calendar constants
 */
export const BIRTHDAY_CALENDAR = {
	id: '__birthdays__',
	name: 'Geburtstage',
	color: '#EC4899', // Pink
} as const;
