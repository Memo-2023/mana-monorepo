import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, inArray } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { tags } from '../db/schema';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

// Default tags created for new users
const DEFAULT_TAGS = [
	{ name: 'Arbeit', color: '#3B82F6', icon: 'Briefcase' },
	{ name: 'Persönlich', color: '#10B981', icon: 'User' },
	{ name: 'Familie', color: '#EC4899', icon: 'Heart' },
	{ name: 'Wichtig', color: '#EF4444', icon: 'Star' },
];

@Injectable()
export class TagsService {
	constructor(private configService: ConfigService) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	/**
	 * Get all tags for a user
	 */
	async findByUserId(userId: string) {
		const db = this.getDb();
		return db.select().from(tags).where(eq(tags.userId, userId));
	}

	/**
	 * Get a single tag by ID (only if owned by user)
	 */
	async findById(id: string, userId: string) {
		const db = this.getDb();
		const [tag] = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.limit(1);

		return tag || null;
	}

	/**
	 * Get multiple tags by IDs (only those owned by user)
	 * Used by apps to resolve tagIds to full tag objects
	 */
	async getByIds(ids: string[], userId: string) {
		if (ids.length === 0) return [];

		const db = this.getDb();
		return db
			.select()
			.from(tags)
			.where(and(inArray(tags.id, ids), eq(tags.userId, userId)));
	}

	/**
	 * Create a new tag
	 */
	async create(userId: string, dto: CreateTagDto) {
		const db = this.getDb();

		// Check for duplicate name
		const [existing] = await db
			.select()
			.from(tags)
			.where(and(eq(tags.userId, userId), eq(tags.name, dto.name)))
			.limit(1);

		if (existing) {
			throw new ConflictException(`Tag "${dto.name}" already exists`);
		}

		const [tag] = await db
			.insert(tags)
			.values({
				userId,
				name: dto.name,
				color: dto.color || '#3B82F6',
				icon: dto.icon || null,
				groupId: dto.groupId || null,
				sortOrder: dto.sortOrder ?? 0,
			})
			.returning();

		return tag;
	}

	/**
	 * Update an existing tag
	 */
	async update(id: string, userId: string, dto: UpdateTagDto) {
		const db = this.getDb();

		// Verify tag exists and belongs to user
		const [existing] = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException(`Tag not found`);
		}

		// Check for duplicate name if name is being changed
		if (dto.name && dto.name !== existing.name) {
			const [duplicate] = await db
				.select()
				.from(tags)
				.where(and(eq(tags.userId, userId), eq(tags.name, dto.name)))
				.limit(1);

			if (duplicate) {
				throw new ConflictException(`Tag "${dto.name}" already exists`);
			}
		}

		const [tag] = await db
			.update(tags)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.returning();

		return tag;
	}

	/**
	 * Delete a tag
	 */
	async delete(id: string, userId: string) {
		const db = this.getDb();

		// Verify tag exists and belongs to user
		const [existing] = await db
			.select()
			.from(tags)
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException(`Tag not found`);
		}

		await db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, userId)));
	}

	/**
	 * Get all tags in a specific group (only those owned by user)
	 */
	async findByGroupId(groupId: string, userId: string) {
		const db = this.getDb();
		return db
			.select()
			.from(tags)
			.where(and(eq(tags.groupId, groupId), eq(tags.userId, userId)));
	}

	/**
	 * Create default tags for a new user
	 * Called during user registration or first access
	 */
	async createDefaultTags(userId: string) {
		const db = this.getDb();

		// Check if user already has tags
		const existingTags = await db.select().from(tags).where(eq(tags.userId, userId)).limit(1);

		if (existingTags.length > 0) {
			// User already has tags, return existing
			return this.findByUserId(userId);
		}

		// Create default tags
		const createdTags = await db
			.insert(tags)
			.values(
				DEFAULT_TAGS.map((tag) => ({
					userId,
					name: tag.name,
					color: tag.color,
					icon: tag.icon,
				}))
			)
			.returning();

		return createdTags;
	}
}
