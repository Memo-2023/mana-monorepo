import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, or, ilike, desc, sql, isNotNull, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts, contactToTags } from '../db/schema';
import type { Contact, NewContact } from '../db/schema';
import { PhotoService } from '../photo/photo.service';

export interface ContactBirthdaySummary {
	id: string;
	displayName: string | null;
	firstName: string | null;
	lastName: string | null;
	birthday: string;
	photoUrl: string | null;
}

export interface ContactFilters {
	search?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	tagId?: string;
	limit?: number;
	offset?: number;
}

@Injectable()
export class ContactService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private readonly photoService: PhotoService
	) {}

	async findByUserId(userId: string, filters: ContactFilters = {}): Promise<Contact[]> {
		const { search, isFavorite, isArchived = false, tagId, limit = 50, offset = 0 } = filters;

		// If tagId is provided, get the set of contact IDs that have this tag
		let tagContactIds: string[] | undefined;
		if (tagId) {
			const taggedContacts = await this.db
				.select({ contactId: contactToTags.contactId })
				.from(contactToTags)
				.where(eq(contactToTags.tagId, tagId));
			tagContactIds = taggedContacts.map((tc) => tc.contactId);
			if (tagContactIds.length === 0) {
				return [];
			}
		}

		// When searching, use relevance-based sorting (name matches first, then company/email)
		if (search) {
			const searchLower = search.toLowerCase();
			const query = this.db
				.select({
					contact: contacts,
					// Relevance score: name matches get higher priority than company/email
					relevance: sql<number>`
						CASE
							WHEN LOWER(${contacts.firstName}) LIKE ${`${searchLower}%`} THEN 100
							WHEN LOWER(${contacts.lastName}) LIKE ${`${searchLower}%`} THEN 100
							WHEN LOWER(${contacts.displayName}) LIKE ${`${searchLower}%`} THEN 90
							WHEN LOWER(${contacts.firstName}) LIKE ${`%${searchLower}%`} THEN 80
							WHEN LOWER(${contacts.lastName}) LIKE ${`%${searchLower}%`} THEN 80
							WHEN LOWER(${contacts.displayName}) LIKE ${`%${searchLower}%`} THEN 70
							WHEN LOWER(${contacts.email}) LIKE ${`%${searchLower}%`} THEN 50
							WHEN LOWER(${contacts.company}) LIKE ${`%${searchLower}%`} THEN 40
							ELSE 0
						END
					`.as('relevance'),
				})
				.from(contacts)
				.where(
					and(
						eq(contacts.userId, userId),
						eq(contacts.isArchived, isArchived),
						isFavorite !== undefined ? eq(contacts.isFavorite, isFavorite) : undefined,
						tagContactIds ? inArray(contacts.id, tagContactIds) : undefined,
						or(
							ilike(contacts.firstName, `%${search}%`),
							ilike(contacts.lastName, `%${search}%`),
							ilike(contacts.displayName, `%${search}%`),
							ilike(contacts.email, `%${search}%`),
							ilike(contacts.company, `%${search}%`)
						)
					)
				)
				.orderBy(sql`relevance DESC`, desc(contacts.updatedAt))
				.limit(limit)
				.offset(offset);

			const results = await query;
			return results.map((r) => r.contact);
		}

		// Without search, just order by updatedAt
		const query = this.db
			.select()
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, isArchived),
					isFavorite !== undefined ? eq(contacts.isFavorite, isFavorite) : undefined,
					tagContactIds ? inArray(contacts.id, tagContactIds) : undefined
				)
			)
			.orderBy(desc(contacts.updatedAt))
			.limit(limit)
			.offset(offset);

		return query;
	}

	async findById(id: string, userId: string): Promise<Contact | null> {
		const [contact] = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
		return contact || null;
	}

	async create(data: NewContact): Promise<Contact> {
		const [contact] = await this.db.insert(contacts).values(data).returning();
		return contact;
	}

	async update(id: string, userId: string, data: Partial<NewContact>): Promise<Contact> {
		const [contact] = await this.db
			.update(contacts)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(contacts.id, id), eq(contacts.userId, userId)))
			.returning();

		if (!contact) {
			throw new NotFoundException('Contact not found');
		}

		return contact;
	}

	async delete(id: string, userId: string): Promise<void> {
		const existing = await this.findById(id, userId);
		if (!existing) {
			throw new NotFoundException('Contact not found');
		}

		if (existing.isSelf) {
			throw new BadRequestException('Cannot delete your own contact card');
		}

		// Clean up photo from S3 before deleting the DB record
		await this.photoService.deletePhotoByUrl(existing.photoUrl);

		await this.db.delete(contacts).where(and(eq(contacts.id, id), eq(contacts.userId, userId)));
	}

	async findSelfContact(userId: string): Promise<Contact | null> {
		const [contact] = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.userId, userId), eq(contacts.isSelf, true)));
		return contact || null;
	}

	async ensureSelfContact(userId: string, email: string): Promise<Contact> {
		const existing = await this.findSelfContact(userId);
		if (existing) {
			return existing;
		}

		// Create self contact with email prefix as display name
		const emailPrefix = email.split('@')[0] || '';
		const displayName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

		const [contact] = await this.db
			.insert(contacts)
			.values({
				userId,
				email,
				displayName,
				firstName: displayName,
				isSelf: true,
				createdBy: userId,
			})
			.returning();

		return contact;
	}

	async toggleFavorite(id: string, userId: string): Promise<Contact> {
		const contact = await this.findById(id, userId);
		if (!contact) {
			throw new NotFoundException('Contact not found');
		}

		return this.update(id, userId, { isFavorite: !contact.isFavorite });
	}

	async toggleArchive(id: string, userId: string): Promise<Contact> {
		const contact = await this.findById(id, userId);
		if (!contact) {
			throw new NotFoundException('Contact not found');
		}

		return this.update(id, userId, { isArchived: !contact.isArchived });
	}

	async count(userId: string, isArchived = false): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(contacts)
			.where(and(eq(contacts.userId, userId), eq(contacts.isArchived, isArchived)));

		return Number(result[0]?.count || 0);
	}

	/**
	 * Find all contacts with birthdays (for calendar integration)
	 * Returns only essential fields for lightweight transfer
	 */
	async findWithBirthdays(userId: string): Promise<ContactBirthdaySummary[]> {
		const result = await this.db
			.select({
				id: contacts.id,
				displayName: contacts.displayName,
				firstName: contacts.firstName,
				lastName: contacts.lastName,
				birthday: contacts.birthday,
				photoUrl: contacts.photoUrl,
			})
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, false),
					isNotNull(contacts.birthday)
				)
			)
			.orderBy(contacts.lastName, contacts.firstName);

		return result.map((c) => ({
			...c,
			birthday: c.birthday || '',
		}));
	}
}
