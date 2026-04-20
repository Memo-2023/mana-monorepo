/**
 * Reactive queries & pure helpers for Contacts — uses Dexie liveQuery on the unified DB.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { scopedForModule, applyVisibility } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import { filterBySceneScopeBatch } from '$lib/stores/scene-scope.svelte';
import { contactTagOps } from './stores/tags.svelte';
import type { LocalContact, Contact, SortField, ContactFilter } from './types';

// ─── Type Converter ───────────────────────────────────────

export function toContact(local: LocalContact): Contact {
	const firstName = local.firstName || null;
	const lastName = local.lastName || null;
	const displayName = [firstName, lastName].filter(Boolean).join(' ') || null;

	return {
		id: local.id,
		firstName,
		lastName,
		displayName,
		email: local.email || null,
		phone: local.phone || null,
		mobile: local.mobile || null,
		company: local.company || null,
		jobTitle: local.jobTitle || null,
		street: local.street || null,
		city: local.city || null,
		postalCode: local.postalCode || null,
		country: local.country || null,
		latitude: local.latitude ?? null,
		longitude: local.longitude ?? null,
		notes: local.notes || null,
		photoUrl: local.photoUrl || null,
		birthday: local.birthday || null,
		website: local.website || null,
		linkedin: local.linkedin || null,
		twitter: local.twitter || null,
		instagram: local.instagram || null,
		github: local.github || null,
		tags: (local.tags || []).map((name, i) => ({ id: `tag-${i}`, name, color: null })),
		tagIds: local.tagIds ?? [],
		isFavorite: local.isFavorite ?? false,
		isArchived: local.isArchived ?? false,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllContacts() {
	return useLiveQueryWithDefault(async () => {
		const raw = await scopedForModule<LocalContact, string>('contacts', 'contacts').toArray();
		const visible = applyVisibility(raw).filter((c) => !c.deletedAt);
		const decrypted = await decryptRecords('contacts', visible);
		const tagMap = await contactTagOps.getTagIdsForMany(decrypted.map((c) => c.id));
		const scoped = filterBySceneScopeBatch(decrypted, (c) => c.id, tagMap);
		return scoped.map(toContact);
	}, []);
}

// ─── Display Helpers ──────────────────────────────────────

export function getDisplayName(contact: Contact): string {
	if (contact.displayName) return contact.displayName;
	const parts = [contact.firstName, contact.lastName].filter(Boolean);
	return parts.length > 0 ? parts.join(' ') : 'Unbenannt';
}

export function getInitials(contact: Contact): string {
	const first = contact.firstName?.[0] ?? '';
	const last = contact.lastName?.[0] ?? '';
	const result = (first + last).toUpperCase();
	return result || '?';
}

// ─── Pure Filter Functions ────────────────────────────────

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

export function filterFavorites(contacts: Contact[]): Contact[] {
	return contacts.filter((c) => c.isFavorite);
}

export function filterArchived(contacts: Contact[]): Contact[] {
	return contacts.filter((c) => c.isArchived);
}

export function filterActive(contacts: Contact[]): Contact[] {
	return contacts.filter((c) => !c.isArchived);
}

export function sortContacts(contacts: Contact[], field: SortField): Contact[] {
	return [...contacts].sort((a, b) => {
		const aVal = (a[field] ?? '').toLowerCase();
		const bVal = (b[field] ?? '').toLowerCase();
		return aVal.localeCompare(bVal, 'de');
	});
}

export function applyContactFilter(contacts: Contact[], filter: ContactFilter): Contact[] {
	switch (filter) {
		case 'favorites':
			return contacts.filter((c) => c.isFavorite);
		case 'hasPhone':
			return contacts.filter((c) => !!c.phone);
		case 'hasEmail':
			return contacts.filter((c) => !!c.email);
		case 'incomplete':
			return contacts.filter((c) => !c.email && !c.phone);
		default:
			return contacts;
	}
}

/** Group contacts by first letter of the given sort field. */
export function groupByLetter(contacts: Contact[], field: SortField): Record<string, Contact[]> {
	const groups: Record<string, Contact[]> = {};
	for (const contact of contacts) {
		const value = contact[field] ?? '';
		const letter = (value[0] ?? '#').toUpperCase();
		if (!groups[letter]) groups[letter] = [];
		groups[letter].push(contact);
	}
	return groups;
}
