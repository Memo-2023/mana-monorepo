/**
 * Contacts API Service Types
 *
 * Types for contact management and birthday tracking
 */

/**
 * Contact with basic info
 */
export interface Contact {
	id: string;
	firstName?: string;
	lastName?: string;
	displayName?: string;
	nickname?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	birthday?: string;
	photoUrl?: string;
	company?: string;
	jobTitle?: string;
	isFavorite: boolean;
}

/**
 * Contact birthday summary (lightweight)
 */
export interface ContactBirthday {
	id: string;
	displayName: string | null;
	firstName: string | null;
	lastName: string | null;
	birthday: string;
	photoUrl: string | null;
	age?: number;
}

/**
 * Contacts API module options
 */
export interface ContactsModuleOptions {
	apiUrl?: string;
}

/**
 * Injection token for Contacts module options
 */
export const CONTACTS_MODULE_OPTIONS = 'CONTACTS_MODULE_OPTIONS';

/**
 * Default API URL
 */
export const DEFAULT_CONTACTS_API_URL = 'http://localhost:3015';
