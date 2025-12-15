/**
 * Cross-App API Client for Contacts Backend - Birthday Data
 * Allows Calendar app to fetch contact birthdays for display
 */

import { env } from '$env/dynamic/public';
import { createApiClient } from './base-client';

const CONTACTS_API_BASE = env.PUBLIC_CONTACTS_API_URL || 'http://localhost:3015';

const contactsClient = createApiClient({
	baseUrl: CONTACTS_API_BASE,
	apiPrefix: '/api/v1',
});

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

const fetchContactsApi = contactsClient.fetchApi;

/**
 * Fetch all contacts with birthdays from Contacts service
 */
export async function getBirthdays(): Promise<{
	data: ContactBirthdaySummary[] | null;
	error: Error | null;
}> {
	const result = await fetchContactsApi<BirthdaysResponse>('/contacts/birthdays');
	return {
		data: result.data?.contacts || null,
		error: result.error,
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
