/**
 * Contacts Store — Mutation-Only
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only exposes mutations that write to IndexedDB.
 */

import { contactTable } from '../collections';
import { toContact } from '../queries';
import type { LocalContact, Contact } from '../types';

export const contactsStore = {
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

		await contactTable.add(newLocal);
		return toContact(newLocal);
	},

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

		await contactTable.update(id, {
			...updateData,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteContact(id: string) {
		await contactTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleFavorite(id: string) {
		const local = await contactTable.get(id);
		if (!local) return;

		await contactTable.update(id, {
			isFavorite: !local.isFavorite,
			updatedAt: new Date().toISOString(),
		});
	},

	async toggleArchive(id: string) {
		const local = await contactTable.get(id);
		if (!local) return;

		await contactTable.update(id, {
			isArchived: !local.isArchived,
			updatedAt: new Date().toISOString(),
		});
	},
};
