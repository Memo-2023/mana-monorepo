import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, inArray } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { tagLinks, tags } from '../db/schema';
import { CreateTagLinkDto } from './dto/create-tag-link.dto';
import { QueryTagLinksDto } from './dto/query-tag-links.dto';

@Injectable()
export class TagLinksService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Link a tag to an entity
	 */
	async create(userId: string, dto: CreateTagLinkDto) {
		const db = this.getDb();

		// Verify tag belongs to user
		const [tag] = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, dto.tagId), eq(tags.userId, userId)))
			.limit(1);

		if (!tag) {
			throw new NotFoundException('Tag not found');
		}

		const [link] = await db
			.insert(tagLinks)
			.values({
				tagId: dto.tagId,
				appId: dto.appId,
				entityId: dto.entityId,
				entityType: dto.entityType,
				userId,
			})
			.onConflictDoNothing()
			.returning();

		// If conflict (already exists), return the existing link
		if (!link) {
			const [existing] = await db
				.select()
				.from(tagLinks)
				.where(
					and(
						eq(tagLinks.tagId, dto.tagId),
						eq(tagLinks.appId, dto.appId),
						eq(tagLinks.entityId, dto.entityId)
					)
				)
				.limit(1);
			return existing;
		}

		return link;
	}

	/**
	 * Bulk link tags to entities
	 */
	async bulkCreate(userId: string, dtos: CreateTagLinkDto[]) {
		if (dtos.length === 0) return [];

		const db = this.getDb();

		// Verify all tags belong to user
		const tagIds = [...new Set(dtos.map((d) => d.tagId))];
		const userTags = await db
			.select()
			.from(tags)
			.where(and(inArray(tags.id, tagIds), eq(tags.userId, userId)));

		if (userTags.length !== tagIds.length) {
			throw new NotFoundException('One or more tags not found');
		}

		const values = dtos.map((dto) => ({
			tagId: dto.tagId,
			appId: dto.appId,
			entityId: dto.entityId,
			entityType: dto.entityType,
			userId,
		}));

		const links = await db.insert(tagLinks).values(values).onConflictDoNothing().returning();

		return links;
	}

	/**
	 * Delete a tag link by ID
	 */
	async delete(id: string, userId: string) {
		const db = this.getDb();

		const [existing] = await db
			.select()
			.from(tagLinks)
			.where(and(eq(tagLinks.id, id), eq(tagLinks.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException('Tag link not found');
		}

		await db.delete(tagLinks).where(and(eq(tagLinks.id, id), eq(tagLinks.userId, userId)));
	}

	/**
	 * Query tag links with optional filters
	 */
	async query(userId: string, query: QueryTagLinksDto) {
		const db = this.getDb();

		const conditions = [eq(tagLinks.userId, userId)];

		if (query.appId) {
			conditions.push(eq(tagLinks.appId, query.appId));
		}
		if (query.entityId) {
			conditions.push(eq(tagLinks.entityId, query.entityId));
		}
		if (query.entityType) {
			conditions.push(eq(tagLinks.entityType, query.entityType));
		}
		if (query.tagId) {
			conditions.push(eq(tagLinks.tagId, query.tagId));
		}

		return db
			.select()
			.from(tagLinks)
			.where(and(...conditions));
	}

	/**
	 * Get full Tag objects for a specific entity (joins with tags table)
	 */
	async getTagsForEntity(userId: string, appId: string, entityId: string) {
		const db = this.getDb();

		const results = await db
			.select({
				id: tags.id,
				userId: tags.userId,
				name: tags.name,
				color: tags.color,
				icon: tags.icon,
				groupId: tags.groupId,
				sortOrder: tags.sortOrder,
				createdAt: tags.createdAt,
				updatedAt: tags.updatedAt,
			})
			.from(tagLinks)
			.innerJoin(tags, eq(tagLinks.tagId, tags.id))
			.where(
				and(eq(tagLinks.userId, userId), eq(tagLinks.appId, appId), eq(tagLinks.entityId, entityId))
			);

		return results;
	}

	/**
	 * Sync tags for an entity: adds missing links, removes extra ones.
	 * Wrapped in a transaction to prevent race conditions.
	 */
	async sync(
		userId: string,
		appId: string,
		entityId: string,
		entityType: string,
		tagIds: string[]
	) {
		const db = this.getDb();

		// Verify all tags belong to user (before transaction)
		if (tagIds.length > 0) {
			const userTags = await db
				.select()
				.from(tags)
				.where(and(inArray(tags.id, tagIds), eq(tags.userId, userId)));

			if (userTags.length !== tagIds.length) {
				throw new NotFoundException('One or more tags not found');
			}
		}

		await db.transaction(async (tx) => {
			// Get current links for this entity
			const currentLinks = await tx
				.select()
				.from(tagLinks)
				.where(
					and(
						eq(tagLinks.userId, userId),
						eq(tagLinks.appId, appId),
						eq(tagLinks.entityId, entityId)
					)
				);

			const currentTagIds = currentLinks.map((l) => l.tagId);
			const toAdd = tagIds.filter((id) => !currentTagIds.includes(id));
			const toRemove = currentLinks.filter((l) => !tagIds.includes(l.tagId));

			// Add missing links
			if (toAdd.length > 0) {
				await tx
					.insert(tagLinks)
					.values(
						toAdd.map((tagId) => ({
							tagId,
							appId,
							entityId,
							entityType,
							userId,
						}))
					)
					.onConflictDoNothing();
			}

			// Remove extra links
			if (toRemove.length > 0) {
				const removeIds = toRemove.map((l) => l.id);
				await tx
					.delete(tagLinks)
					.where(and(inArray(tagLinks.id, removeIds), eq(tagLinks.userId, userId)));
			}
		});

		// Return updated tags for entity (after transaction commits)
		return this.getTagsForEntity(userId, appId, entityId);
	}
}
