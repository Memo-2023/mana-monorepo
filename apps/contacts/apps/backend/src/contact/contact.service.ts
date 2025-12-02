import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { contacts, type Contact, type NewContact } from '../db/schema';

export interface ContactFilters {
	search?: string;
	isFavorite?: boolean;
	isArchived?: boolean;
	groupId?: string;
	tagId?: string;
	limit?: number;
	offset?: number;
}

@Injectable()
export class ContactService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string, filters: ContactFilters = {}): Promise<Contact[]> {
		const { search, isFavorite, isArchived = false, limit = 50, offset = 0 } = filters;

		let query = this.db
			.select()
			.from(contacts)
			.where(
				and(
					eq(contacts.userId, userId),
					eq(contacts.isArchived, isArchived),
					isFavorite !== undefined ? eq(contacts.isFavorite, isFavorite) : undefined,
					search
						? or(
								ilike(contacts.firstName, `%${search}%`),
								ilike(contacts.lastName, `%${search}%`),
								ilike(contacts.displayName, `%${search}%`),
								ilike(contacts.email, `%${search}%`),
								ilike(contacts.company, `%${search}%`)
							)
						: undefined
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
		const result = await this.db
			.delete(contacts)
			.where(and(eq(contacts.id, id), eq(contacts.userId, userId)));

		// Drizzle doesn't return affected rows easily, so we check manually
		const existing = await this.findById(id, userId);
		if (existing) {
			throw new NotFoundException('Contact not found');
		}
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
}
