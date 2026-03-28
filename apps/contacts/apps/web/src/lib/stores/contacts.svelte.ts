/**
 * Contacts Store — Mutation-Only
 *
 * All reads are handled by useLiveQuery (see $lib/data/queries.ts).
 * This store only exposes mutations that write to IndexedDB.
 * The live queries will automatically pick up the changes.
 */

import { contactCollection, type LocalContact } from '$lib/data/local-store';
import type { Contact } from '$lib/api/contacts';
import { toContact } from '$lib/data/queries';
import { ContactsEvents } from '@manacore/shared-utils/analytics';

export const contactsStore = {
	/**
	 * Create a new contact — writes to IndexedDB instantly.
	 */
	async createContact(data: Partial<Contact>) {
		const newLocal: LocalContact = {
			id: crypto.randomUUID(),
			firstName: data.firstName ?? undefined,
			lastName: data.lastName ?? undefined,
			email: data.email ?? undefined,
			phone: data.phone ?? undefined,
			company: data.company ?? undefined,
			jobTitle: data.jobTitle ?? undefined,
			notes: data.notes ?? undefined,
			photoUrl: data.photoUrl ?? undefined,
			birthday: data.birthday ?? undefined,
			tags: data.tags?.map((t) => t.name) ?? [],
			isFavorite: false,
			isArchived: false,
		};

		const inserted = await contactCollection.insert(newLocal);
		ContactsEvents.contactCreated();
		return toContact(inserted);
	},

	/**
	 * Update a contact — writes to IndexedDB instantly.
	 */
	async updateContact(id: string, data: Partial<Contact>) {
		const updateData: Partial<LocalContact> = {};
		if (data.firstName !== undefined) updateData.firstName = data.firstName ?? undefined;
		if (data.lastName !== undefined) updateData.lastName = data.lastName ?? undefined;
		if (data.email !== undefined) updateData.email = data.email ?? undefined;
		if (data.phone !== undefined) updateData.phone = data.phone ?? undefined;
		if (data.company !== undefined) updateData.company = data.company ?? undefined;
		if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle ?? undefined;
		if (data.notes !== undefined) updateData.notes = data.notes ?? undefined;
		if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl ?? undefined;
		if (data.birthday !== undefined) updateData.birthday = data.birthday ?? undefined;
		if (data.tags !== undefined) updateData.tags = data.tags?.map((t) => t.name) ?? [];
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

		const updated = await contactCollection.update(id, updateData);
		if (updated) {
			ContactsEvents.contactUpdated();
			return toContact(updated);
		}
	},

	/**
	 * Delete a contact — removes from IndexedDB instantly.
	 */
	async deleteContact(id: string) {
		await contactCollection.delete(id);
		ContactsEvents.contactDeleted();
	},

	/**
	 * Toggle favorite status — writes to IndexedDB instantly.
	 */
	async toggleFavorite(id: string) {
		const local = await contactCollection.get(id);
		if (!local) return;

		const updated = await contactCollection.update(id, {
			isFavorite: !local.isFavorite,
		} as Partial<LocalContact>);
		if (updated) {
			ContactsEvents.contactFavorited();
			return toContact(updated);
		}
	},

	/**
	 * Toggle archive status — writes to IndexedDB instantly.
	 */
	async toggleArchive(id: string) {
		const local = await contactCollection.get(id);
		if (!local) return;

		const updated = await contactCollection.update(id, {
			isArchived: !local.isArchived,
		} as Partial<LocalContact>);
		if (updated) {
			ContactsEvents.contactArchived();
			return toContact(updated);
		}
	},

	/**
	 * No longer relevant — all contacts are local and editable.
	 */
	isDemoContact(_contactId: string) {
		return false;
	},
};
