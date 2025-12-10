import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contactTags, contactToTags } from '../db/schema';
import type { ContactTag, NewContactTag } from '../db/schema';

const DEFAULT_TAGS = [
	{ name: 'Familie', color: '#ec4899' }, // pink
	{ name: 'Freunde', color: '#22c55e' }, // green
	{ name: 'Arbeit', color: '#3b82f6' }, // blue
	{ name: 'Wichtig', color: '#ef4444' }, // red
] as const;

@Injectable()
export class TagService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<ContactTag[]> {
		const tags = await this.db.select().from(contactTags).where(eq(contactTags.userId, userId));

		// Create default tags on first access (when user has no tags yet)
		if (tags.length === 0) {
			return this.createDefaultTags(userId);
		}

		return tags;
	}

	private async createDefaultTags(userId: string): Promise<ContactTag[]> {
		const tagsToCreate = DEFAULT_TAGS.map((tag) => ({
			userId,
			name: tag.name,
			color: tag.color,
		}));

		return this.db.insert(contactTags).values(tagsToCreate).returning();
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
