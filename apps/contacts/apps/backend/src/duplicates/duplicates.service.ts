import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts } from '../db/schema';
import type { Contact } from '../db/schema';
import { PhotoService } from '../photo/photo.service';

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
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private readonly photoService: PhotoService
	) {}

	/** Maximum number of duplicate groups to return per match type */
	private static readonly MAX_GROUPS_PER_TYPE = 50;

	/**
	 * Find all potential duplicate groups for a user.
	 *
	 * Uses database-level grouping for email, phone, and name matches
	 * instead of loading all contacts into memory.
	 */
	async findDuplicates(userId: string): Promise<DuplicateGroup[]> {
		const duplicateGroups: DuplicateGroup[] = [];
		const processedIds = new Set<string>();

		// 1. Find email duplicates via SQL grouping
		const emailDups = await this.findEmailDuplicates(userId);
		for (const group of emailDups) {
			const ids = group.contacts
				.map((c) => c.id)
				.sort()
				.join('-');
			if (!processedIds.has(ids)) {
				processedIds.add(ids);
				duplicateGroups.push(group);
			}
		}

		// 2. Find phone duplicates via SQL grouping
		const phoneDups = await this.findPhoneDuplicates(userId);
		for (const group of phoneDups) {
			const ids = group.contacts
				.map((c) => c.id)
				.sort()
				.join('-');
			if (!processedIds.has(ids)) {
				processedIds.add(ids);
				duplicateGroups.push(group);
			}
		}

		// 3. Find name duplicates via SQL grouping
		const nameDups = await this.findNameDuplicates(userId);
		for (const group of nameDups) {
			const ids = group.contacts
				.map((c) => c.id)
				.sort()
				.join('-');
			if (!processedIds.has(ids)) {
				processedIds.add(ids);
				duplicateGroups.push(group);
			}
		}

		return duplicateGroups;
	}

	/**
	 * Find contacts with duplicate emails using database-level grouping.
	 * Only fetches contacts that actually have duplicates.
	 */
	private async findEmailDuplicates(userId: string): Promise<DuplicateGroup[]> {
		// Find normalized emails that appear more than once
		const dupEmails = await this.db
			.select({
				normalizedEmail: sql<string>`LOWER(TRIM(${contacts.email}))`.as('normalized_email'),
			})
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, false),
					sql`${contacts.email} IS NOT NULL AND TRIM(${contacts.email}) != ''`
				)
			)
			.groupBy(sql`LOWER(TRIM(${contacts.email}))`)
			.having(sql`COUNT(*) > 1`)
			.limit(DuplicatesService.MAX_GROUPS_PER_TYPE);

		if (dupEmails.length === 0) return [];

		// Fetch the actual contacts for those duplicate emails
		const emailValues = dupEmails.map((d) => d.normalizedEmail);
		const dupContacts = await this.db
			.select()
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, false),
					sql`LOWER(TRIM(${contacts.email})) = ANY(${emailValues})`
				)
			);

		// Group by normalized email
		const emailMap = new Map<string, Contact[]>();
		for (const contact of dupContacts) {
			const key = this.normalizeEmail(contact.email!);
			if (!emailMap.has(key)) emailMap.set(key, []);
			emailMap.get(key)!.push(contact);
		}

		return Array.from(emailMap.entries())
			.filter(([, list]) => list.length > 1)
			.map(([email, contactList]) => ({
				id: `email-${contactList
					.map((c) => c.id)
					.sort()
					.join('-')}`,
				contacts: contactList,
				matchType: 'email' as const,
				matchValue: email,
			}));
	}

	/**
	 * Find contacts with duplicate phone numbers using database-level grouping.
	 * Normalizes phone numbers by stripping non-digit characters (preserving leading +).
	 */
	private async findPhoneDuplicates(userId: string): Promise<DuplicateGroup[]> {
		// Normalize phone: strip non-digits but preserve leading +
		// We check both phone and mobile columns by unioning them
		const phoneNormExpr = sql`
			CASE
				WHEN LEFT(phone_val, 1) = '+' THEN '+' || REGEXP_REPLACE(phone_val, '[^0-9]', '', 'g')
				ELSE REGEXP_REPLACE(phone_val, '[^0-9]', '', 'g')
			END
		`;

		// Use a CTE to union phone and mobile into a single column, then group
		const dupPhones: { normalizedPhone: string }[] = await this.db.execute(sql`
			WITH phone_values AS (
				SELECT id, user_id, is_archived, phone AS phone_val FROM ${contacts}
				WHERE user_id = ${userId} AND is_archived = false AND phone IS NOT NULL AND TRIM(phone) != ''
				UNION ALL
				SELECT id, user_id, is_archived, mobile AS phone_val FROM ${contacts}
				WHERE user_id = ${userId} AND is_archived = false AND mobile IS NOT NULL AND TRIM(mobile) != ''
			),
			normalized AS (
				SELECT
					id,
					${phoneNormExpr} AS normalized_phone
				FROM phone_values
				WHERE LENGTH(REGEXP_REPLACE(phone_val, '[^0-9]', '', 'g')) >= 6
			)
			SELECT normalized_phone AS "normalizedPhone"
			FROM normalized
			GROUP BY normalized_phone
			HAVING COUNT(DISTINCT id) > 1
			LIMIT ${DuplicatesService.MAX_GROUPS_PER_TYPE}
		`);

		if (dupPhones.length === 0) return [];

		// Fetch contacts that have any of these duplicate phone numbers
		const phoneValues = dupPhones.map((d) => d.normalizedPhone);
		const dupContacts = await this.db
			.select()
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, false),
					sql`(
						(${contacts.phone} IS NOT NULL AND
						 CASE WHEN LEFT(${contacts.phone}, 1) = '+' THEN '+' || REGEXP_REPLACE(${contacts.phone}, '[^0-9]', '', 'g')
						      ELSE REGEXP_REPLACE(${contacts.phone}, '[^0-9]', '', 'g') END = ANY(${phoneValues}))
						OR
						(${contacts.mobile} IS NOT NULL AND
						 CASE WHEN LEFT(${contacts.mobile}, 1) = '+' THEN '+' || REGEXP_REPLACE(${contacts.mobile}, '[^0-9]', '', 'g')
						      ELSE REGEXP_REPLACE(${contacts.mobile}, '[^0-9]', '', 'g') END = ANY(${phoneValues}))
					)`
				)
			);

		// Group contacts by their matching normalized phone number
		const phoneMap = new Map<string, Contact[]>();
		for (const contact of dupContacts) {
			for (const phone of [contact.phone, contact.mobile].filter(Boolean) as string[]) {
				const normalized = this.normalizePhone(phone);
				if (normalized.length >= 6 && phoneValues.includes(normalized)) {
					if (!phoneMap.has(normalized)) phoneMap.set(normalized, []);
					const existing = phoneMap.get(normalized)!;
					if (!existing.some((c) => c.id === contact.id)) {
						existing.push(contact);
					}
				}
			}
		}

		return Array.from(phoneMap.entries())
			.filter(([, list]) => list.length > 1)
			.map(([phone, contactList]) => ({
				id: `phone-${contactList
					.map((c) => c.id)
					.sort()
					.join('-')}`,
				contacts: contactList,
				matchType: 'phone' as const,
				matchValue: phone,
			}));
	}

	/**
	 * Find contacts with duplicate names using database-level grouping.
	 * Only considers contacts that have both first and last names.
	 */
	private async findNameDuplicates(userId: string): Promise<DuplicateGroup[]> {
		const dupNames = await this.db
			.select({
				normalizedName:
					sql<string>`LOWER(TRIM(${contacts.firstName})) || ' ' || LOWER(TRIM(${contacts.lastName}))`.as(
						'normalized_name'
					),
			})
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, false),
					sql`${contacts.firstName} IS NOT NULL AND TRIM(${contacts.firstName}) != ''`,
					sql`${contacts.lastName} IS NOT NULL AND TRIM(${contacts.lastName}) != ''`
				)
			)
			.groupBy(sql`LOWER(TRIM(${contacts.firstName})) || ' ' || LOWER(TRIM(${contacts.lastName}))`)
			.having(sql`COUNT(*) > 1`)
			.limit(DuplicatesService.MAX_GROUPS_PER_TYPE);

		if (dupNames.length === 0) return [];

		// Fetch the actual contacts for those duplicate names
		const nameValues = dupNames.map((d) => d.normalizedName);
		const dupContacts = await this.db
			.select()
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, false),
					sql`LOWER(TRIM(${contacts.firstName})) || ' ' || LOWER(TRIM(${contacts.lastName})) = ANY(${nameValues})`
				)
			);

		// Group by normalized name
		const nameMap = new Map<string, Contact[]>();
		for (const contact of dupContacts) {
			if (contact.firstName && contact.lastName) {
				const key = this.normalizeName(contact.firstName, contact.lastName);
				if (!nameMap.has(key)) nameMap.set(key, []);
				nameMap.get(key)!.push(contact);
			}
		}

		return Array.from(nameMap.entries())
			.filter(([, list]) => list.length > 1)
			.map(([name, contactList]) => ({
				id: `name-${contactList
					.map((c) => c.id)
					.sort()
					.join('-')}`,
				contacts: contactList,
				matchType: 'name' as const,
				matchValue: name,
			}));
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

		// Clean up photos of merged contacts (skip if photo was adopted by primary)
		for (const mergedContact of contactsToMerge) {
			if (mergedContact.photoUrl && mergedContact.photoUrl !== updatedContact.photoUrl) {
				await this.photoService.deletePhotoByUrl(mergedContact.photoUrl);
			}
		}

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
