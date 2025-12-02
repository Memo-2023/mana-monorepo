import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { contactTags, contactToTags, type ContactTag, type NewContactTag } from '../db/schema';

@Injectable()
export class TagService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<ContactTag[]> {
		return this.db.select().from(contactTags).where(eq(contactTags.userId, userId));
	}

	async findById(id: string, userId: string): Promise<ContactTag | null> {
		const [tag] = await this.db
			.select()
			.from(contactTags)
			.where(and(eq(contactTags.id, id), eq(contactTags.userId, userId)));
		return tag || null;
	}

	async create(data: NewContactTag): Promise<ContactTag> {
		const [tag] = await this.db.insert(contactTags).values(data).returning();
		return tag;
	}

	async update(id: string, userId: string, data: Partial<NewContactTag>): Promise<ContactTag> {
		const [tag] = await this.db
			.update(contactTags)
			.set(data)
			.where(and(eq(contactTags.id, id), eq(contactTags.userId, userId)))
			.returning();

		if (!tag) {
			throw new NotFoundException('Tag not found');
		}

		return tag;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.db
			.delete(contactTags)
			.where(and(eq(contactTags.id, id), eq(contactTags.userId, userId)));
	}

	async addTagToContact(contactId: string, tagId: string): Promise<void> {
		await this.db.insert(contactToTags).values({ contactId, tagId }).onConflictDoNothing();
	}

	async removeTagFromContact(contactId: string, tagId: string): Promise<void> {
		await this.db
			.delete(contactToTags)
			.where(and(eq(contactToTags.contactId, contactId), eq(contactToTags.tagId, tagId)));
	}

	async getTagsForContact(contactId: string): Promise<string[]> {
		const results = await this.db
			.select({ tagId: contactToTags.tagId })
			.from(contactToTags)
			.where(eq(contactToTags.contactId, contactId));

		return results.map((r) => r.tagId);
	}
}
