/**
 * Contact-related types for cross-app integration
 *
 * These types are used when referencing contacts from the Contacts app
 * in other apps like Todo and Calendar.
 */

/**
 * Reference to a contact with cached display data.
 * Used for offline display when Contacts API is unavailable.
 */
export interface ContactReference {
	/** Contact ID from Contacts app */
	contactId: string;
	/** Cached display name */
	displayName: string;
	/** Cached email */
	email?: string;
	/** Cached photo URL */
	photoUrl?: string;
	/** Cached company name */
	company?: string;
	/** ISO timestamp when data was fetched (for cache invalidation) */
	fetchedAt: string;
}

/**
 * Summary of a contact from the Contacts API.
 * Contains essential fields for display in selectors and lists.
 */
export interface ContactSummary {
	id: string;
	displayName: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	phone?: string;
	company?: string;
	photoUrl?: string;
}

/**
 * Manual contact entry (when contact doesn't exist in Contacts app).
 * Used for calendar attendees who aren't in the user's contacts.
 */
export interface ManualContactEntry {
	/** Email address (required for manual entries) */
	email: string;
	/** Display name (optional) */
	name?: string;
	/** Indicates this is a manual entry, not from Contacts app */
	isManual: true;
}

/**
 * Union type for contact references that can be either
 * a real contact or a manual entry.
 */
export type ContactOrManual = ContactReference | ManualContactEntry;

/**
 * Helper to check if a contact entry is manual
 */
export function isManualContact(contact: ContactOrManual): contact is ManualContactEntry {
	return 'isManual' in contact && contact.isManual === true;
}

/**
 * Helper to create a ContactReference from a ContactSummary
 */
export function createContactReference(contact: ContactSummary): ContactReference {
	return {
		contactId: contact.id,
		displayName: contact.displayName,
		email: contact.email,
		photoUrl: contact.photoUrl,
		company: contact.company,
		fetchedAt: new Date().toISOString(),
	};
}
