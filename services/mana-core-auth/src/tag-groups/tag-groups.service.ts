import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, inArray } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { tagGroups, tags } from '../db/schema';
import { CreateTagGroupDto } from './dto/create-tag-group.dto';
import { UpdateTagGroupDto } from './dto/update-tag-group.dto';

@Injectable()
export class TagGroupsService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Get all tag groups for a user, ordered by sortOrder
	 */
	async findByUserId(userId: string) {
		const db = this.getDb();
		return db
			.select()
			.from(tagGroups)
			.where(eq(tagGroups.userId, userId))
			.orderBy(tagGroups.sortOrder);
	}

	/**
	 * Get a single tag group by ID (only if owned by user)
	 */
	async findById(id: string, userId: string) {
		const db = this.getDb();
		const [group] = await db
			.select()
			.from(tagGroups)
			.where(and(eq(tagGroups.id, id), eq(tagGroups.userId, userId)))
			.limit(1);

		return group || null;
	}

	/**
	 * Create a new tag group
	 */
	async create(userId: string, dto: CreateTagGroupDto) {
		const db = this.getDb();

		// Check for duplicate name
		const [existing] = await db
			.select()
			.from(tagGroups)
			.where(and(eq(tagGroups.userId, userId), eq(tagGroups.name, dto.name)))
			.limit(1);

		if (existing) {
			throw new ConflictException(`Tag group "${dto.name}" already exists`);
		}

		const [group] = await db
			.insert(tagGroups)
			.values({
				userId,
				name: dto.name,
				color: dto.color || '#3B82F6',
				icon: dto.icon || null,
				sortOrder: dto.sortOrder ?? 0,
			})
			.returning();

		return group;
	}

	/**
	 * Update an existing tag group
	 */
	async update(id: string, userId: string, dto: UpdateTagGroupDto) {
		const db = this.getDb();

		// Verify group exists and belongs to user
		const [existing] = await db
			.select()
			.from(tagGroups)
			.where(and(eq(tagGroups.id, id), eq(tagGroups.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException(`Tag group not found`);
		}

		// Check for duplicate name if name is being changed
		if (dto.name && dto.name !== existing.name) {
			const [duplicate] = await db
				.select()
				.from(tagGroups)
				.where(and(eq(tagGroups.userId, userId), eq(tagGroups.name, dto.name)))
				.limit(1);

			if (duplicate) {
				throw new ConflictException(`Tag group "${dto.name}" already exists`);
			}
		}

		const [group] = await db
			.update(tagGroups)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(tagGroups.id, id), eq(tagGroups.userId, userId)))
			.returning();

		return group;
	}

	/**
	 * Delete a tag group. Tags in the group get groupId set to null.
	 */
	async delete(id: string, userId: string) {
		const db = this.getDb();

		// Verify group exists and belongs to user
		const [existing] = await db
			.select()
			.from(tagGroups)
			.where(and(eq(tagGroups.id, id), eq(tagGroups.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException(`Tag group not found`);
		}

		// Unlink tags from this group (set groupId to null)
		await db
			.update(tags)
			.set({ groupId: null, updatedAt: new Date() })
			.where(and(eq(tags.groupId, id), eq(tags.userId, userId)));

		// Delete the group
		await db.delete(tagGroups).where(and(eq(tagGroups.id, id), eq(tagGroups.userId, userId)));
	}

	/**
	 * Reorder tag groups by providing an ordered array of IDs
	 */
	async reorder(userId: string, ids: string[]) {
		const db = this.getDb();

		// Verify all groups belong to user
		const userGroups = await db
			.select()
			.from(tagGroups)
			.where(and(eq(tagGroups.userId, userId), inArray(tagGroups.id, ids)));

		if (userGroups.length !== ids.length) {
			throw new NotFoundException('One or more tag groups not found');
		}

		// Update sort order for each group
		for (let i = 0; i < ids.length; i++) {
			await db
				.update(tagGroups)
				.set({ sortOrder: i, updatedAt: new Date() })
				.where(and(eq(tagGroups.id, ids[i]), eq(tagGroups.userId, userId)));
		}

		// Return updated groups
		return this.findByUserId(userId);
	}
}
