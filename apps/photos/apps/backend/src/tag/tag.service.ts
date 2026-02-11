import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION, Database } from '../db/database.module';
import { tags, photoTags, type Tag, type NewTag } from '../db/schema';

@Injectable()
export class TagService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Tag[]> {
		return this.db.select().from(tags).where(eq(tags.userId, userId)).orderBy(tags.name);
	}

	async findById(id: string, userId: string): Promise<Tag | null> {
		const [tag] = await this.db
			.select()
			.from(tags)
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.limit(1);
		return tag || null;
	}

	async create(userId: string, data: Omit<NewTag, 'userId'>): Promise<Tag> {
		const [tag] = await this.db
			.insert(tags)
			.values({ ...data, userId })
			.returning();
		return tag;
	}

	async update(id: string, userId: string, data: Partial<NewTag>): Promise<Tag | null> {
		const [updated] = await this.db
			.update(tags)
			.set(data)
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.returning();
		return updated || null;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, userId)));
	}

	async getTagsForPhoto(mediaId: string): Promise<Tag[]> {
		const tagIds = await this.db
			.select({ tagId: photoTags.tagId })
			.from(photoTags)
			.where(eq(photoTags.mediaId, mediaId));

		if (tagIds.length === 0) return [];

		return this.db
			.select()
			.from(tags)
			.where(
				inArray(
					tags.id,
					tagIds.map((t) => t.tagId)
				)
			);
	}

	async getTagsForPhotos(mediaIds: string[]): Promise<Map<string, Tag[]>> {
		if (mediaIds.length === 0) return new Map();

		const results = await this.db
			.select({ mediaId: photoTags.mediaId, tag: tags })
			.from(photoTags)
			.innerJoin(tags, eq(photoTags.tagId, tags.id))
			.where(inArray(photoTags.mediaId, mediaIds));

		const map = new Map<string, Tag[]>();
		for (const { mediaId, tag } of results) {
			if (!map.has(mediaId)) {
				map.set(mediaId, []);
			}
			map.get(mediaId)!.push(tag);
		}
		return map;
	}

	async addTagToPhoto(mediaId: string, tagId: string, userId: string): Promise<void> {
		const tag = await this.findById(tagId, userId);
		if (!tag) {
			throw new NotFoundException('Tag not found');
		}

		await this.db.insert(photoTags).values({ mediaId, tagId }).onConflictDoNothing();
	}

	async removeTagFromPhoto(mediaId: string, tagId: string): Promise<void> {
		await this.db
			.delete(photoTags)
			.where(and(eq(photoTags.mediaId, mediaId), eq(photoTags.tagId, tagId)));
	}

	async setTagsForPhoto(mediaId: string, tagIds: string[], userId: string): Promise<void> {
		// Remove all existing tags
		await this.db.delete(photoTags).where(eq(photoTags.mediaId, mediaId));

		// Add new tags
		if (tagIds.length > 0) {
			// Verify all tags belong to user
			const userTags = await this.db
				.select()
				.from(tags)
				.where(and(eq(tags.userId, userId), inArray(tags.id, tagIds)));

			const validTagIds = userTags.map((t) => t.id);

			if (validTagIds.length > 0) {
				await this.db.insert(photoTags).values(validTagIds.map((tagId) => ({ mediaId, tagId })));
			}
		}
	}
}
