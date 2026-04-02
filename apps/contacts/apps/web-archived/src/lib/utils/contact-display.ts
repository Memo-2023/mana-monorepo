import type { Contact } from '$lib/api/contacts';

export const UNKNOWN_CONTACT_NAME = 'Unbekannt';

export function getDisplayName(contact: {
	displayName?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
}): string {
	if (contact.displayName) return contact.displayName;
	if (contact.firstName || contact.lastName) {
		return [contact.firstName, contact.lastName].filter(Boolean).join(' ');
	}
	return contact.email || UNKNOWN_CONTACT_NAME;
}

export function getInitials(contact: {
	firstName?: string | null;
	lastName?: string | null;
	email?: string | null;
}): string {
	const first = contact.firstName?.[0] || '';
	const last = contact.lastName?.[0] || '';
	return (first + last).toUpperCase() || contact.email?.[0]?.toUpperCase() || '?';
}
