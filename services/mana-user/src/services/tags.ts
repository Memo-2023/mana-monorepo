/**
 * Tags Service — CRUD for user tags, tag groups, and tag links
 */

import { eq, and, desc, inArray } from 'drizzle-orm';
import { tags, tagGroups, tagLinks } from '../db/schema/index';
import type { Database } from '../db/connection';
import { NotFoundError, BadRequestError } from '../lib/errors';

const DEFAULT_TAGS = [
	{ name: 'Arbeit', color: '#3B82F6', icon: 'briefcase' },
	{ name: 'Persönlich', color: '#10B981', icon: 'user' },
	{ name: 'Familie', color: '#F59E0B', icon: 'users' },
	{ name: 'Wichtig', color: '#EF4444', icon: 'star' },
];

export class TagsService {
	constructor(private db: Database) {}

	// ─── Tags ───────────────────────────────────────────────

	async getUserTags(userId: string) {
		return this.db.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.sortOrder);
	}

	async getTagById(userId: string, tagId: string) {
		const [tag] = await this.db
			.select()
			.from(tags)
			.where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
			.limit(1);
		return tag;
	}

	async getTagsByIds(tagIds: string[]) {
		if (tagIds.length === 0) return [];
		return this.db.select().from(tags).where(inArray(tags.id, tagIds));
	}

	async createTag(
		userId: string,
		data: { name: string; color?: string; icon?: string; groupId?: string; sortOrder?: number }
	) {
		const [tag] = await this.db
			.insert(tags)
			.values({ userId, ...data })
			.returning();
		return tag;
	}

	async updateTag(
		userId: string,
		tagId: string,
		data: {
			name?: string;
			color?: string;
			icon?: string;
			groupId?: string | null;
			sortOrder?: number;
		}
	) {
		const [tag] = await this.db
			.update(tags)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
			.returning();
		if (!tag) throw new NotFoundError('Tag not found');
		return tag;
	}

	async deleteTag(userId: string, tagId: string) {
		const result = await this.db
			.delete(tags)
			.where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
			.returning();
		if (result.length === 0) throw new NotFoundError('Tag not found');
	}

	async createDefaultTags(userId: string) {
		const existing = await this.getUserTags(userId);
		if (existing.length > 0) return existing;

		const created = [];
		for (let i = 0; i < DEFAULT_TAGS.length; i++) {
			const [tag] = await this.db
				.insert(tags)
				.values({ userId, ...DEFAULT_TAGS[i], sortOrder: i })
				.returning();
			created.push(tag);
		}
		return created;
	}

	// ─── Tag Groups ─────────────────────────────────────────

	async getUserGroups(userId: string) {
		return this.db
			.select()
			.from(tagGroups)
			.where(eq(tagGroups.userId, userId))
			.orderBy(tagGroups.sortOrder);
	}

	async createGroup(
		userId: string,
		data: { name: string; color?: string; icon?: string; sortOrder?: number }
	) {
		const [group] = await this.db
			.insert(tagGroups)
			.values({ userId, ...data })
			.returning();
		return group;
	}

	async updateGroup(
		userId: string,
		groupId: string,
		data: { name?: string; color?: string; icon?: string; sortOrder?: number }
	) {
		const [group] = await this.db
			.update(tagGroups)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(tagGroups.id, groupId), eq(tagGroups.userId, userId)))
			.returning();
		if (!group) throw new NotFoundError('Tag group not found');
		return group;
	}

	async deleteGroup(userId: string, groupId: string) {
		// Unlink tags from this group first (set groupId to null)
		await this.db.update(tags).set({ groupId: null }).where(eq(tags.groupId, groupId));
		const result = await this.db
			.delete(tagGroups)
			.where(and(eq(tagGroups.id, groupId), eq(tagGroups.userId, userId)))
			.returning();
		if (result.length === 0) throw new NotFoundError('Tag group not found');
	}

	// ─── Tag Links ──────────────────────────────────────────

	async getLinksForEntity(userId: string, appId: string, entityId: string) {
		const links = await this.db
			.select()
			.from(tagLinks)
			.where(
				and(eq(tagLinks.userId, userId), eq(tagLinks.appId, appId), eq(tagLinks.entityId, entityId))
			);

		// Resolve full tag objects
		const tagIds = links.map((l) => l.tagId);
		const resolvedTags = tagIds.length > 0 ? await this.getTagsByIds(tagIds) : [];
		return resolvedTags;
	}

	async createLink(
		userId: string,
		data: { tagId: string; appId: string; entityId: string; entityType: string }
	) {
		const [link] = await this.db
			.insert(tagLinks)
			.values({ userId, ...data })
			.returning();
		return link;
	}

	async syncLinks(
		userId: string,
		appId: string,
		entityId: string,
		entityType: string,
		tagIds: string[]
	) {
		return this.db.transaction(async (tx) => {
			// Delete all existing links for this entity
			await tx
				.delete(tagLinks)
				.where(
					and(
						eq(tagLinks.userId, userId),
						eq(tagLinks.appId, appId),
						eq(tagLinks.entityId, entityId)
					)
				);

			// Insert new links
			if (tagIds.length > 0) {
				await tx
					.insert(tagLinks)
					.values(tagIds.map((tagId) => ({ tagId, appId, entityId, entityType, userId })));
			}

			return { synced: tagIds.length };
		});
	}

	async deleteLink(userId: string, linkId: string) {
		await this.db.delete(tagLinks).where(and(eq(tagLinks.id, linkId), eq(tagLinks.userId, userId)));
	}

	async queryLinks(
		userId: string,
		filters: { appId?: string; entityId?: string; entityType?: string; tagId?: string }
	) {
		let query = this.db.select().from(tagLinks).where(eq(tagLinks.userId, userId)).$dynamic();
		if (filters.appId) query = query.where(eq(tagLinks.appId, filters.appId));
		if (filters.entityId) query = query.where(eq(tagLinks.entityId, filters.entityId));
		if (filters.tagId) query = query.where(eq(tagLinks.tagId, filters.tagId));
		return query;
	}
}
