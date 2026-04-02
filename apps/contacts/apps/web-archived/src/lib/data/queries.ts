/**
 * Reactive Queries & Pure Filter Helpers for Contacts
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { contactCollection, type LocalContact } from './local-store';
import type { Contact } from '$lib/api/contacts';

// ─── Type Converter ───────────────────────────────────────

/** Convert a LocalContact (IndexedDB record) to the shared Contact type. */
export function toContact(local: LocalContact): Contact {
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

// ─── Live Query Hooks (call during component init) ─────────

/** All contacts, sorted by firstName. Auto-updates on any change. */
export function useAllContacts() {
	return useLiveQueryWithDefault(async () => {
		const locals = await contactCollection.getAll(undefined, {
			sortBy: 'firstName',
			sortDirection: 'asc',
		});
		return locals.map(toContact);
	}, [] as Contact[]);
}

// ─── Pure Filter Functions (for $derived) ──────────────────

/** Filter contacts by search query across multiple fields. */
export function searchContacts(contacts: Contact[], query: string): Contact[] {
	if (!query.trim()) return contacts;
	const search = query.toLowerCase().trim();
	return contacts.filter(
		(c) =>
			c.firstName?.toLowerCase().includes(search) ||
			c.lastName?.toLowerCase().includes(search) ||
			c.displayName?.toLowerCase().includes(search) ||
			c.email?.toLowerCase().includes(search) ||
			c.company?.toLowerCase().includes(search) ||
			c.phone?.toLowerCase().includes(search)
	);
}

/** Filter contacts to favorites only. */
export function filterFavorites(contacts: Contact[]): Contact[] {
	return contacts.filter((c) => c.isFavorite);
}

/** Filter contacts to archived only. */
export function filterArchived(contacts: Contact[]): Contact[] {
	return contacts.filter((c) => c.isArchived);
}

/** Filter contacts to non-archived only. */
export function filterActive(contacts: Contact[]): Contact[] {
	return contacts.filter((c) => !c.isArchived);
}
