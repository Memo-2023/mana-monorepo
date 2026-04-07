/**
 * Contacts Store — Mutation-Only
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 * This store only exposes mutations that write to IndexedDB.
 */

import { contactTable, SELF_CONTACT_ID } from '../collections';
import { toContact } from '../queries';
import { createArchiveOps } from '@mana/shared-stores';
import { ContactsEvents } from '@mana/shared-utils/analytics';
import { encryptRecord, decryptRecord } from '$lib/data/crypto';
import type { LocalContact, Contact } from '../types';
import type { UserProfile } from '$lib/api/profile';

/** Archive/soft-delete ops for contacts. */
export const contactArchive = createArchiveOps({ table: () => contactTable });

export const contactsStore = {
	async createContact(data: Partial<Contact> & Record<string, unknown>) {
		const newLocal: LocalContact = {
			id: crypto.randomUUID(),
			firstName: data.firstName ?? undefined,
			lastName: data.lastName ?? undefined,
			email: data.email ?? undefined,
			phone: data.phone ?? undefined,
			mobile: (data.mobile as string) ?? undefined,
			company: data.company ?? undefined,
			jobTitle: data.jobTitle ?? undefined,
			street: (data.street as string) ?? undefined,
			city: (data.city as string) ?? undefined,
			postalCode: (data.postalCode as string) ?? undefined,
			country: (data.country as string) ?? undefined,
			notes: data.notes ?? undefined,
			photoUrl: data.photoUrl ?? undefined,
			birthday: data.birthday ?? undefined,
			linkedin: (data.linkedin as string) ?? undefined,
			twitter: (data.twitter as string) ?? undefined,
			instagram: (data.instagram as string) ?? undefined,
			github: (data.github as string) ?? undefined,
			website: (data.website as string) ?? undefined,
			tags: data.tags?.map((t) => t.name) ?? [],
			isFavorite: false,
			isArchived: false,
		};

		const plaintextSnapshot = toContact(newLocal);
		await encryptRecord('contacts', newLocal);
		await contactTable.add(newLocal);
		ContactsEvents.contactCreated();
		return plaintextSnapshot;
	},

	async updateContact(id: string, data: Partial<Contact> & Record<string, unknown>) {
		const updateData: Partial<LocalContact> = {};
		if (data.firstName !== undefined) updateData.firstName = data.firstName ?? undefined;
		if (data.lastName !== undefined) updateData.lastName = data.lastName ?? undefined;
		if (data.email !== undefined) updateData.email = data.email ?? undefined;
		if (data.phone !== undefined) updateData.phone = data.phone ?? undefined;
		if (data.mobile !== undefined) updateData.mobile = data.mobile as string | undefined;
		if (data.company !== undefined) updateData.company = data.company ?? undefined;
		if (data.jobTitle !== undefined) updateData.jobTitle = data.jobTitle ?? undefined;
		if (data.street !== undefined) updateData.street = data.street as string | undefined;
		if (data.city !== undefined) updateData.city = data.city as string | undefined;
		if (data.postalCode !== undefined)
			updateData.postalCode = data.postalCode as string | undefined;
		if (data.country !== undefined) updateData.country = data.country as string | undefined;
		if (data.notes !== undefined) updateData.notes = data.notes ?? undefined;
		if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl ?? undefined;
		if (data.birthday !== undefined) updateData.birthday = data.birthday ?? undefined;
		if (data.website !== undefined) updateData.website = data.website as string | undefined;
		if (data.linkedin !== undefined) updateData.linkedin = data.linkedin as string | undefined;
		if (data.twitter !== undefined) updateData.twitter = data.twitter as string | undefined;
		if (data.instagram !== undefined) updateData.instagram = data.instagram as string | undefined;
		if (data.github !== undefined) updateData.github = data.github as string | undefined;
		if (data.tags !== undefined) updateData.tags = data.tags?.map((t) => t.name) ?? [];
		if (data.isFavorite !== undefined) updateData.isFavorite = data.isFavorite;
		if (data.isArchived !== undefined) updateData.isArchived = data.isArchived;

		const diff: Partial<LocalContact> = {
			...updateData,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('contacts', diff);
		await contactTable.update(id, diff);
		ContactsEvents.contactUpdated();
	},

	async deleteContact(id: string) {
		await contactTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
		ContactsEvents.contactDeleted();
	},

	async toggleFavorite(id: string) {
		const local = await contactTable.get(id);
		if (!local) return;

		await contactTable.update(id, {
			isFavorite: !local.isFavorite,
			updatedAt: new Date().toISOString(),
		});
		ContactsEvents.contactFavorited();
	},

	async updateTagIds(id: string, tagIds: string[]) {
		await contactTable.update(id, {
			tagIds,
			updatedAt: new Date().toISOString(),
		});
	},

	toggleArchive: async (id: string) => {
		await contactArchive.toggleArchive(id);
		ContactsEvents.contactArchived();
	},

	/**
	 * Ensure the self-contact exists and is synced with the user's profile.
	 * Creates the contact if missing, updates it if profile data changed.
	 * Works without profile data (guest mode) — creates a minimal self-contact.
	 */
	async ensureSelfContact(profile?: UserProfile | null): Promise<void> {
		const nameParts = (profile?.name || '').split(' ');
		const firstName = nameParts[0] || undefined;
		const lastName = nameParts.slice(1).join(' ') || undefined;

		const existing = await contactTable.get(SELF_CONTACT_ID);

		if (!existing) {
			const self: LocalContact = {
				id: SELF_CONTACT_ID,
				firstName: firstName || 'Ich',
				lastName,
				email: profile?.email || undefined,
				photoUrl: profile?.image || undefined,
				isFavorite: true,
				isArchived: false,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('contacts', self);
			await contactTable.add(self);
			return;
		}

		// Only sync if we have profile data
		if (!profile) return;

		// Compare against the decrypted view of the existing record so the
		// "did anything change?" check sees plaintext on both sides.
		const decryptedExisting = await decryptRecord('contacts', { ...existing });
		const needsUpdate =
			decryptedExisting.firstName !== firstName ||
			decryptedExisting.lastName !== lastName ||
			decryptedExisting.email !== (profile.email || undefined) ||
			decryptedExisting.photoUrl !== (profile.image || undefined);

		if (needsUpdate) {
			const diff: Partial<LocalContact> = {
				firstName,
				lastName,
				email: profile.email || undefined,
				photoUrl: profile.image || undefined,
				updatedAt: new Date().toISOString(),
			};
			await encryptRecord('contacts', diff);
			await contactTable.update(SELF_CONTACT_ID, diff);
		}
	},
};
