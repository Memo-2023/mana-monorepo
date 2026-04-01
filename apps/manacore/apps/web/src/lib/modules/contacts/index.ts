/**
 * Contacts module — barrel exports.
 */

export { contactsStore } from './stores/contacts.svelte';
export { contactsFilterStore } from './stores/filter.svelte';
export { contactModalStore } from './stores/modal.svelte';
export {
	useAllContacts,
	toContact,
	getDisplayName,
	getInitials,
	searchContacts,
	filterFavorites,
	filterArchived,
	filterActive,
	sortContacts,
	applyContactFilter,
	groupByLetter,
} from './queries';
export { contactTable, CONTACTS_GUEST_SEED } from './collections';
export type { LocalContact, Contact, SortField, ContactFilter, ContactView } from './types';
