import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { tags, imageTags, images } from '../db/schema';
import type { Tag } from '../db/schema';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagService {
	private readonly logger = new Logger(TagService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getAllTags(): Promise<Tag[]> {
		try {
			const result = await this.db.select().from(tags).orderBy(tags.name);

			return result;
		} catch (error) {
			this.logger.error('Error fetching tags', error);
			throw error;
		}
	}

	async createTag(dto: CreateTagDto): Promise<Tag> {
		try {
			const result = await this.db
				.insert(tags)
				.values({
					name: dto.name,
					color: dto.color,
				})
				.returning();

			return result[0];
		} catch (error) {
			this.logger.error('Error creating tag', error);
			throw error;
		}
	}

	async updateTag(id: string, dto: UpdateTagDto): Promise<Tag> {
		try {
			const result = await this.db
				.update(tags)
				.set({
					...(dto.name && { name: dto.name }),
					...(dto.color !== undefined && { color: dto.color }),
				})
				.where(eq(tags.id, id))
				.returning();

			if (result.length === 0) {
				throw new NotFoundException(`Tag with id ${id} not found`);
			}

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error(`Error updating tag ${id}`, error);
			throw error;
		}
	}

	async deleteTag(id: string): Promise<void> {
		try {
			// Delete image-tag relations first
			await this.db.delete(imageTags).where(eq(imageTags.tagId, id));

			// Delete the tag
			const result = await this.db.delete(tags).where(eq(tags.id, id)).returning();

			if (result.length === 0) {
				throw new NotFoundException(`Tag with id ${id} not found`);
			}
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error(`Error deleting tag ${id}`, error);
			throw error;
		}
	}

	async getImageTags(imageId: string): Promise<Tag[]> {
		try {
			const result = await this.db
				.select({
					id: tags.id,
					name: tags.name,
					color: tags.color,
					createdAt: tags.createdAt,
				})
				.from(imageTags)
				.innerJoin(tags, eq(imageTags.tagId, tags.id))
				.where(eq(imageTags.imageId, imageId))
				.orderBy(tags.name);

			return result;
		} catch (error) {
			this.logger.error(`Error fetching tags for image ${imageId}`, error);
			throw error;
		}
	}

	async addTagToImage(imageId: string, tagId: string): Promise<void> {
		try {
			// Check if relation already exists
			const existing = await this.db
				.select()
				.from(imageTags)
				.where(and(eq(imageTags.imageId, imageId), eq(imageTags.tagId, tagId)))
				.limit(1);

			if (existing.length > 0) {
				return; // Already exists
			}

			await this.db.insert(imageTags).values({
				imageId,
				tagId,
			});
		} catch (error) {
			this.logger.error(`Error adding tag ${tagId} to image ${imageId}`, error);
			throw error;
		}
	}

	async removeTagFromImage(imageId: string, tagId: string): Promise<void> {
		try {
			await this.db
				.delete(imageTags)
				.where(and(eq(imageTags.imageId, imageId), eq(imageTags.tagId, tagId)));
		} catch (error) {
			this.logger.error(`Error removing tag ${tagId} from image ${imageId}`, error);
			throw error;
		}
	}
}
