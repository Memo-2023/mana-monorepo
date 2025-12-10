import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { eventTags, eventToTags } from '../db/schema';
import type { EventTag, NewEventTag } from '../db/schema';

const DEFAULT_TAGS = [
	{ name: 'Arbeit', color: '#3b82f6' }, // blue
	{ name: 'Persönlich', color: '#22c55e' }, // green
	{ name: 'Familie', color: '#ec4899' }, // pink
	{ name: 'Wichtig', color: '#ef4444' }, // red
] as const;

@Injectable()
export class EventTagService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<EventTag[]> {
		const tags = await this.db.select().from(eventTags).where(eq(eventTags.userId, userId));

		// Create default tags on first access (when user has no tags yet)
		if (tags.length === 0) {
			return this.createDefaultTags(userId);
		}

		return tags;
	}

	private async createDefaultTags(userId: string): Promise<EventTag[]> {
		const tagsToCreate = DEFAULT_TAGS.map((tag) => ({
			userId,
			name: tag.name,
			color: tag.color,
		}));

		return this.db.insert(eventTags).values(tagsToCreate).returning();
	}

	async findById(id: string, userId: string): Promise<EventTag | null> {
		const [tag] = await this.db
			.select()
			.from(eventTags)
			.where(and(eq(eventTags.id, id), eq(eventTags.userId, userId)));
		return tag || null;
	}

	async create(data: NewEventTag): Promise<EventTag> {
		const [tag] = await this.db.insert(eventTags).values(data).returning();
		return tag;
	}

	async update(id: string, userId: string, data: Partial<NewEventTag>): Promise<EventTag> {
		const [tag] = await this.db
			.update(eventTags)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(eventTags.id, id), eq(eventTags.userId, userId)))
			.returning();

		if (!tag) {
			throw new NotFoundException('Tag not found');
		}

		return tag;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.db.delete(eventTags).where(and(eq(eventTags.id, id), eq(eventTags.userId, userId)));
	}

	async getTagsForEvent(eventId: string): Promise<EventTag[]> {
		const results = await this.db
			.select({ tag: eventTags })
			.from(eventToTags)
			.innerJoin(eventTags, eq(eventToTags.tagId, eventTags.id))
			.where(eq(eventToTags.eventId, eventId));

		return results.map((r) => r.tag);
	}

	async getTagIdsForEvent(eventId: string): Promise<string[]> {
		const results = await this.db
			.select({ tagId: eventToTags.tagId })
			.from(eventToTags)
			.where(eq(eventToTags.eventId, eventId));

		return results.map((r) => r.tagId);
	}

	async setEventTags(eventId: string, tagIds: string[]): Promise<void> {
		// Remove existing tags
		await this.db.delete(eventToTags).where(eq(eventToTags.eventId, eventId));

		// Add new tags
		if (tagIds.length > 0) {
			const values = tagIds.map((tagId) => ({ eventId, tagId }));
			await this.db.insert(eventToTags).values(values).onConflictDoNothing();
		}
	}

	async addTagToEvent(eventId: string, tagId: string): Promise<void> {
		await this.db.insert(eventToTags).values({ eventId, tagId }).onConflictDoNothing();
	}

	async removeTagFromEvent(eventId: string, tagId: string): Promise<void> {
		await this.db
			.delete(eventToTags)
			.where(and(eq(eventToTags.eventId, eventId), eq(eventToTags.tagId, tagId)));
	}

	async getTagsByIds(ids: string[], userId: string): Promise<EventTag[]> {
		if (ids.length === 0) return [];

		return this.db
			.select()
			.from(eventTags)
			.where(and(inArray(eventTags.id, ids), eq(eventTags.userId, userId)));
	}
}
