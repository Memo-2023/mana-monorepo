import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { eventTagGroups, eventTags } from '../db/schema';
import type { EventTagGroup, NewEventTagGroup } from '../db/schema';

const DEFAULT_TAG_GROUPS = [
	{ name: 'Personen', color: '#ec4899' }, // pink
	{ name: 'Orte', color: '#14b8a6' }, // teal
	{ name: 'Allgemein', color: '#3b82f6' }, // blue
] as const;

@Injectable()
export class EventTagGroupService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<EventTagGroup[]> {
		const groups = await this.db
			.select()
			.from(eventTagGroups)
			.where(eq(eventTagGroups.userId, userId))
			.orderBy(asc(eventTagGroups.sortOrder), asc(eventTagGroups.name));

		// Create default groups on first access (when user has no groups yet)
		if (groups.length === 0) {
			return this.createDefaultGroups(userId);
		}

		return groups;
	}

	async createDefaultGroups(userId: string): Promise<EventTagGroup[]> {
		const groupsToCreate = DEFAULT_TAG_GROUPS.map((group, index) => ({
			userId,
			name: group.name,
			color: group.color,
			sortOrder: index,
		}));

		return this.db.insert(eventTagGroups).values(groupsToCreate).returning();
	}

	async findById(id: string, userId: string): Promise<EventTagGroup | null> {
		const [group] = await this.db
			.select()
			.from(eventTagGroups)
			.where(and(eq(eventTagGroups.id, id), eq(eventTagGroups.userId, userId)));
		return group || null;
	}

	async create(data: NewEventTagGroup): Promise<EventTagGroup> {
		// Get highest sortOrder for user
		const existing = await this.db
			.select()
			.from(eventTagGroups)
			.where(eq(eventTagGroups.userId, data.userId));

		const maxSortOrder = existing.reduce((max, g) => Math.max(max, g.sortOrder ?? 0), -1);

		const [group] = await this.db
			.insert(eventTagGroups)
			.values({ ...data, sortOrder: maxSortOrder + 1 })
			.returning();
		return group;
	}

	async update(
		id: string,
		userId: string,
		data: Partial<Omit<NewEventTagGroup, 'userId'>>
	): Promise<EventTagGroup> {
		const [group] = await this.db
			.update(eventTagGroups)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(eventTagGroups.id, id), eq(eventTagGroups.userId, userId)))
			.returning();

		if (!group) {
			throw new NotFoundException('Tag group not found');
		}

		return group;
	}

	async delete(id: string, userId: string): Promise<void> {
		// First, unassign all tags from this group (set groupId to null)
		await this.db.update(eventTags).set({ groupId: null }).where(eq(eventTags.groupId, id));

		// Then delete the group
		await this.db
			.delete(eventTagGroups)
			.where(and(eq(eventTagGroups.id, id), eq(eventTagGroups.userId, userId)));
	}

	async getTagCountByGroup(groupId: string): Promise<number> {
		const tags = await this.db.select().from(eventTags).where(eq(eventTags.groupId, groupId));
		return tags.length;
	}

	async getTagCountsForUser(userId: string): Promise<Map<string | null, number>> {
		const tags = await this.db.select().from(eventTags).where(eq(eventTags.userId, userId));

		const counts = new Map<string | null, number>();
		for (const tag of tags) {
			const groupId = tag.groupId;
			counts.set(groupId, (counts.get(groupId) ?? 0) + 1);
		}
		return counts;
	}

	async reorder(userId: string, groupIds: string[]): Promise<EventTagGroup[]> {
		// Update sortOrder for each group based on array position
		await Promise.all(
			groupIds.map((id, index) =>
				this.db
					.update(eventTagGroups)
					.set({ sortOrder: index, updatedAt: new Date() })
					.where(and(eq(eventTagGroups.id, id), eq(eventTagGroups.userId, userId)))
			)
		);

		return this.findByUserId(userId);
	}
}
