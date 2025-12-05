import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { tags, fileTags, type Tag, type NewTag } from '../db/schema';

@Injectable()
export class TagService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Tag[]> {
		return this.db.select().from(tags).where(eq(tags.userId, userId));
	}

	async create(userId: string, name: string, color?: string): Promise<Tag> {
		const newTag: NewTag = {
			userId,
			name,
			color,
		};

		const result = await this.db.insert(tags).values(newTag).returning();
		return result[0];
	}

	async update(userId: string, id: string, data: { name?: string; color?: string }): Promise<Tag> {
		const result = await this.db
			.update(tags)
			.set(data)
			.where(and(eq(tags.id, id), eq(tags.userId, userId)))
			.returning();

		if (result.length === 0) {
			throw new NotFoundException('Tag not found');
		}

		return result[0];
	}

	async delete(userId: string, id: string): Promise<void> {
		await this.db.delete(tags).where(and(eq(tags.id, id), eq(tags.userId, userId)));
	}

	async addTagToFile(fileId: string, tagId: string): Promise<void> {
		await this.db.insert(fileTags).values({ fileId, tagId }).onConflictDoNothing();
	}

	async removeTagFromFile(fileId: string, tagId: string): Promise<void> {
		await this.db
			.delete(fileTags)
			.where(and(eq(fileTags.fileId, fileId), eq(fileTags.tagId, tagId)));
	}

	async getFileTags(fileId: string): Promise<Tag[]> {
		const result = await this.db
			.select({ tag: tags })
			.from(fileTags)
			.innerJoin(tags, eq(fileTags.tagId, tags.id))
			.where(eq(fileTags.fileId, fileId));

		return result.map((r) => r.tag);
	}
}
