import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, ne, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts } from '../db/schema';
import type { Contact } from '../db/schema';

export interface DuplicateGroup {
	id: string;
	contacts: Contact[];
	matchType: 'email' | 'phone' | 'name';
	matchValue: string;
}

export interface MergeResult {
	mergedContact: Contact;
	deletedIds: string[];
}

@Injectable()
export class DuplicatesService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	/**
	 * Find all potential duplicate groups for a user
	 */
	async findDuplicates(userId: string): Promise<DuplicateGroup[]> {
		const duplicateGroups: DuplicateGroup[] = [];

		// Get all contacts for this user
		const allContacts = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.userId, userId), eq(contacts.isArchived, false)));

		// Build lookup maps
		const emailMap = new Map<string, Contact[]>();
		const phoneMap = new Map<string, Contact[]>();
		const nameMap = new Map<string, Contact[]>();
		const processedIds = new Set<string>();

		for (const contact of allContacts) {
			// Group by email
			if (contact.email) {
				const normalizedEmail = this.normalizeEmail(contact.email);
				if (!emailMap.has(normalizedEmail)) {
					emailMap.set(normalizedEmail, []);
				}
				emailMap.get(normalizedEmail)!.push(contact);
			}

			// Group by phone (check both phone and mobile)
			for (const phone of [contact.phone, contact.mobile].filter(Boolean) as string[]) {
				const normalizedPhone = this.normalizePhone(phone);
				if (normalizedPhone.length >= 6) {
					if (!phoneMap.has(normalizedPhone)) {
						phoneMap.set(normalizedPhone, []);
					}
					const existing = phoneMap.get(normalizedPhone)!;
					if (!existing.some((c) => c.id === contact.id)) {
						existing.push(contact);
					}
				}
			}

			// Group by name (first + last)
			if (contact.firstName && contact.lastName) {
				const normalizedName = this.normalizeName(contact.firstName, contact.lastName);
				if (!nameMap.has(normalizedName)) {
					nameMap.set(normalizedName, []);
				}
				nameMap.get(normalizedName)!.push(contact);
			}
		}

		// Create duplicate groups from email matches
		for (const [email, contactList] of emailMap) {
			if (contactList.length > 1) {
				const ids = contactList
					.map((c) => c.id)
					.sort()
					.join('-');
				if (!processedIds.has(ids)) {
					processedIds.add(ids);
					duplicateGroups.push({
						id: `email-${ids}`,
						contacts: contactList,
						matchType: 'email',
						matchValue: email,
					});
				}
			}
		}

		// Create duplicate groups from phone matches
		for (const [phone, contactList] of phoneMap) {
			if (contactList.length > 1) {
				const ids = contactList
					.map((c) => c.id)
					.sort()
					.join('-');
				if (!processedIds.has(ids)) {
					processedIds.add(ids);
					duplicateGroups.push({
						id: `phone-${ids}`,
						contacts: contactList,
						matchType: 'phone',
						matchValue: phone,
					});
				}
			}
		}

		// Create duplicate groups from name matches (only if not already matched by email/phone)
		for (const [name, contactList] of nameMap) {
			if (contactList.length > 1) {
				const ids = contactList
					.map((c) => c.id)
					.sort()
					.join('-');
				if (!processedIds.has(ids)) {
					processedIds.add(ids);
					duplicateGroups.push({
						id: `name-${ids}`,
						contacts: contactList,
						matchType: 'name',
						matchValue: name,
					});
				}
			}
		}

		return duplicateGroups;
	}

	/**
	 * Merge multiple contacts into one
	 * @param primaryId - The contact to keep (will be updated with merged data)
	 * @param mergeIds - The contacts to merge into primary (will be deleted)
	 * @param userId - User ID for authorization
	 */
	async mergeContacts(primaryId: string, mergeIds: string[], userId: string): Promise<MergeResult> {
		// Get the primary contact
		const [primaryContact] = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.id, primaryId), eq(contacts.userId, userId)));

		if (!primaryContact) {
			throw new NotFoundException('Primary contact not found');
		}

		// Get contacts to merge
		const contactsToMerge = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.userId, userId), or(...mergeIds.map((id) => eq(contacts.id, id)))));

		if (contactsToMerge.length !== mergeIds.length) {
			throw new NotFoundException('One or more contacts to merge not found');
		}

		// Merge data - fill empty fields from other contacts
		const mergedData = this.mergeContactData(primaryContact, contactsToMerge);

		// Update primary contact with merged data
		const [updatedContact] = await this.db
			.update(contacts)
			.set({ ...mergedData, updatedAt: new Date() })
			.where(eq(contacts.id, primaryId))
			.returning();

		// Delete merged contacts
		await this.db
			.delete(contacts)
			.where(and(eq(contacts.userId, userId), or(...mergeIds.map((id) => eq(contacts.id, id)))));

		return {
			mergedContact: updatedContact,
			deletedIds: mergeIds,
		};
	}

	/**
	 * Dismiss a duplicate group (mark as not duplicates)
	 * This could be extended to store dismissals in a separate table
	 */
	async dismissDuplicate(groupId: string, userId: string): Promise<void> {
		// For now, this is a no-op
		// In a full implementation, you'd store this in a `dismissed_duplicates` table
		// to avoid showing the same group again
	}

	private mergeContactData(primary: Contact, others: Contact[]): Partial<Contact> {
		const updates: Partial<Contact> = {};
		const allContacts = [primary, ...others];

		// Helper to get first non-empty value
		const getFirst = <K extends keyof Contact>(field: K): Contact[K] | undefined => {
			for (const contact of allContacts) {
				if (contact[field]) return contact[field];
			}
			return undefined;
		};

		// Only update fields that are empty in primary
		if (!primary.firstName) updates.firstName = getFirst('firstName');
		if (!primary.lastName) updates.lastName = getFirst('lastName');
		if (!primary.displayName) updates.displayName = getFirst('displayName');
		if (!primary.nickname) updates.nickname = getFirst('nickname');
		if (!primary.email) updates.email = getFirst('email');
		if (!primary.phone) updates.phone = getFirst('phone');
		if (!primary.mobile) updates.mobile = getFirst('mobile');
		if (!primary.street) updates.street = getFirst('street');
		if (!primary.city) updates.city = getFirst('city');
		if (!primary.postalCode) updates.postalCode = getFirst('postalCode');
		if (!primary.country) updates.country = getFirst('country');
		if (!primary.company) updates.company = getFirst('company');
		if (!primary.jobTitle) updates.jobTitle = getFirst('jobTitle');
		if (!primary.department) updates.department = getFirst('department');
		if (!primary.website) updates.website = getFirst('website');
		if (!primary.birthday) updates.birthday = getFirst('birthday');
		if (!primary.photoUrl) updates.photoUrl = getFirst('photoUrl');

		// Merge notes (concatenate if both have notes)
		const allNotes = allContacts
			.map((c) => c.notes)
			.filter(Boolean)
			.join('\n\n---\n\n');
		if (allNotes && allNotes !== primary.notes) {
			updates.notes = allNotes;
		}

		// Keep favorite if any contact is favorite
		if (others.some((c) => c.isFavorite)) {
			updates.isFavorite = true;
		}

		return updates;
	}

	private normalizeEmail(email: string): string {
		return email.toLowerCase().trim();
	}

	private normalizePhone(phone: string): string {
		const hasPlus = phone.startsWith('+');
		const digits = phone.replace(/\D/g, '');
		return hasPlus ? '+' + digits : digits;
	}

	private normalizeName(firstName: string, lastName: string): string {
		return `${firstName.toLowerCase().trim()} ${lastName.toLowerCase().trim()}`;
	}
}
