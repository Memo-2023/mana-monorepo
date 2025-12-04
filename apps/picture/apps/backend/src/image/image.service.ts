import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { eq, and, isNull, isNotNull, desc, inArray, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import {
	images,
	imageTags,
	imageLikes,
	imageGenerations,
	type Image,
	type ImageGeneration,
} from '../db/schema';
import { GetImagesQueryDto } from './dto/image.dto';

@Injectable()
export class ImageService {
	private readonly logger = new Logger(ImageService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getImages(userId: string, query: GetImagesQueryDto): Promise<Image[]> {
		try {
			const { page = 1, limit = 20, archived = false, tagIds, favoritesOnly = false } = query;

			const offset = (page - 1) * limit;

			// Build base conditions
			const conditions = [eq(images.userId, userId)];

			if (archived) {
				conditions.push(isNotNull(images.archivedAt));
			} else {
				conditions.push(isNull(images.archivedAt));
			}

			if (favoritesOnly) {
				conditions.push(eq(images.isFavorite, true));
			}

			// If tag filtering is needed
			if (tagIds && tagIds.length > 0) {
				const tagIdArray = Array.isArray(tagIds) ? tagIds : tagIds.split(',');

				// Get image IDs that have ALL specified tags
				const imageIdsWithTags = await this.db
					.select({ imageId: imageTags.imageId })
					.from(imageTags)
					.where(inArray(imageTags.tagId, tagIdArray))
					.groupBy(imageTags.imageId)
					.having(sql`count(distinct ${imageTags.tagId}) = ${tagIdArray.length}`);

				const validImageIds = imageIdsWithTags.map((r) => r.imageId);

				if (validImageIds.length === 0) {
					return [];
				}

				conditions.push(inArray(images.id, validImageIds));
			}

			const result = await this.db
				.select()
				.from(images)
				.where(and(...conditions))
				.orderBy(desc(images.createdAt))
				.limit(limit)
				.offset(offset);

			return result;
		} catch (error) {
			this.logger.error('Error fetching images', error);
			throw error;
		}
	}

	async getImageById(id: string, userId: string): Promise<Image> {
		try {
			const result = await this.db.select().from(images).where(eq(images.id, id)).limit(1);

			if (result.length === 0) {
				throw new NotFoundException(`Image with id ${id} not found`);
			}

			const image = result[0];

			// Check ownership (allow if public or owned by user)
			if (image.userId !== userId && !image.isPublic) {
				throw new ForbiddenException('Access denied');
			}

			return image;
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error fetching image ${id}`, error);
			throw error;
		}
	}

	async archiveImage(id: string, userId: string): Promise<Image> {
		try {
			await this.verifyOwnership(id, userId);

			const result = await this.db
				.update(images)
				.set({
					archivedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(images.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error archiving image ${id}`, error);
			throw error;
		}
	}

	async unarchiveImage(id: string, userId: string): Promise<Image> {
		try {
			await this.verifyOwnership(id, userId);

			const result = await this.db
				.update(images)
				.set({
					archivedAt: null,
					updatedAt: new Date(),
				})
				.where(eq(images.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error unarchiving image ${id}`, error);
			throw error;
		}
	}

	async deleteImage(id: string, userId: string): Promise<void> {
		try {
			await this.verifyOwnership(id, userId);

			// Delete image-tag relations first
			await this.db.delete(imageTags).where(eq(imageTags.imageId, id));

			// Delete the image
			await this.db.delete(images).where(eq(images.id, id));
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error deleting image ${id}`, error);
			throw error;
		}
	}

	async publishImage(id: string, userId: string): Promise<Image> {
		try {
			await this.verifyOwnership(id, userId);

			const result = await this.db
				.update(images)
				.set({
					isPublic: true,
					updatedAt: new Date(),
				})
				.where(eq(images.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error publishing image ${id}`, error);
			throw error;
		}
	}

	async unpublishImage(id: string, userId: string): Promise<Image> {
		try {
			await this.verifyOwnership(id, userId);

			const result = await this.db
				.update(images)
				.set({
					isPublic: false,
					updatedAt: new Date(),
				})
				.where(eq(images.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error unpublishing image ${id}`, error);
			throw error;
		}
	}

	async toggleFavorite(id: string, userId: string, isFavorite: boolean): Promise<Image> {
		try {
			await this.verifyOwnership(id, userId);

			const result = await this.db
				.update(images)
				.set({
					isFavorite,
					updatedAt: new Date(),
				})
				.where(eq(images.id, id))
				.returning();

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error toggling favorite for image ${id}`, error);
			throw error;
		}
	}

	async getArchivedCount(userId: string): Promise<{ count: number }> {
		try {
			const result = await this.db
				.select({ count: sql<number>`count(*)` })
				.from(images)
				.where(and(eq(images.userId, userId), isNotNull(images.archivedAt)));

			return { count: Number(result[0]?.count || 0) };
		} catch (error) {
			this.logger.error('Error getting archived count', error);
			throw error;
		}
	}

	async batchArchiveImages(imageIds: string[], userId: string): Promise<{ affected: number }> {
		try {
			const result = await this.db
				.update(images)
				.set({
					archivedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(and(inArray(images.id, imageIds), eq(images.userId, userId)))
				.returning();

			return { affected: result.length };
		} catch (error) {
			this.logger.error('Error batch archiving images', error);
			throw error;
		}
	}

	async batchRestoreImages(imageIds: string[], userId: string): Promise<{ affected: number }> {
		try {
			const result = await this.db
				.update(images)
				.set({
					archivedAt: null,
					updatedAt: new Date(),
				})
				.where(and(inArray(images.id, imageIds), eq(images.userId, userId)))
				.returning();

			return { affected: result.length };
		} catch (error) {
			this.logger.error('Error batch restoring images', error);
			throw error;
		}
	}

	async batchDeleteImages(imageIds: string[], userId: string): Promise<{ affected: number }> {
		try {
			// Delete image-tag relations first
			await this.db.delete(imageTags).where(inArray(imageTags.imageId, imageIds));

			// Delete the images (only those owned by user)
			const result = await this.db
				.delete(images)
				.where(and(inArray(images.id, imageIds), eq(images.userId, userId)))
				.returning();

			return { affected: result.length };
		} catch (error) {
			this.logger.error('Error batch deleting images', error);
			throw error;
		}
	}

	// ==================== LIKES ====================

	async likeImage(imageId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
		try {
			// Check if image exists and is public (or owned by user)
			const image = await this.db.select().from(images).where(eq(images.id, imageId)).limit(1);

			if (image.length === 0) {
				throw new NotFoundException(`Image with id ${imageId} not found`);
			}

			// Only allow liking public images (or own images)
			if (!image[0].isPublic && image[0].userId !== userId) {
				throw new ForbiddenException('Cannot like a private image');
			}

			// Check if already liked
			const existingLike = await this.db
				.select()
				.from(imageLikes)
				.where(and(eq(imageLikes.imageId, imageId), eq(imageLikes.userId, userId)))
				.limit(1);

			if (existingLike.length > 0) {
				// Already liked, return current state
				const count = await this.getLikeCount(imageId);
				return { liked: true, likeCount: count };
			}

			// Add like
			await this.db.insert(imageLikes).values({
				imageId,
				userId,
			});

			const count = await this.getLikeCount(imageId);
			return { liked: true, likeCount: count };
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error liking image ${imageId}`, error);
			throw error;
		}
	}

	async unlikeImage(
		imageId: string,
		userId: string
	): Promise<{ liked: boolean; likeCount: number }> {
		try {
			// Check if image exists
			const image = await this.db.select().from(images).where(eq(images.id, imageId)).limit(1);

			if (image.length === 0) {
				throw new NotFoundException(`Image with id ${imageId} not found`);
			}

			// Delete like
			await this.db
				.delete(imageLikes)
				.where(and(eq(imageLikes.imageId, imageId), eq(imageLikes.userId, userId)));

			const count = await this.getLikeCount(imageId);
			return { liked: false, likeCount: count };
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error(`Error unliking image ${imageId}`, error);
			throw error;
		}
	}

	async getLikeStatus(
		imageId: string,
		userId: string
	): Promise<{ liked: boolean; likeCount: number }> {
		try {
			// Check if image exists
			const image = await this.db.select().from(images).where(eq(images.id, imageId)).limit(1);

			if (image.length === 0) {
				throw new NotFoundException(`Image with id ${imageId} not found`);
			}

			// Check if liked by user
			const existingLike = await this.db
				.select()
				.from(imageLikes)
				.where(and(eq(imageLikes.imageId, imageId), eq(imageLikes.userId, userId)))
				.limit(1);

			const count = await this.getLikeCount(imageId);

			return {
				liked: existingLike.length > 0,
				likeCount: count,
			};
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error(`Error getting like status for image ${imageId}`, error);
			throw error;
		}
	}

	private async getLikeCount(imageId: string): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(imageLikes)
			.where(eq(imageLikes.imageId, imageId));

		return Number(result[0]?.count || 0);
	}

	// ==================== GENERATION DETAILS ====================

	async getGenerationDetails(
		generationId: string,
		userId: string
	): Promise<Partial<ImageGeneration> | null> {
		try {
			const result = await this.db
				.select({
					steps: imageGenerations.steps,
					guidanceScale: imageGenerations.guidanceScale,
					generationTimeSeconds: imageGenerations.generationTimeSeconds,
					status: imageGenerations.status,
				})
				.from(imageGenerations)
				.where(and(eq(imageGenerations.id, generationId), eq(imageGenerations.userId, userId)))
				.limit(1);

			if (result.length === 0) {
				return null;
			}

			return result[0];
		} catch (error) {
			this.logger.error(`Error fetching generation details ${generationId}`, error);
			throw error;
		}
	}

	// ==================== PRIVATE HELPERS ====================

	private async verifyOwnership(id: string, userId: string): Promise<void> {
		const result = await this.db
			.select({ userId: images.userId })
			.from(images)
			.where(eq(images.id, id))
			.limit(1);

		if (result.length === 0) {
			throw new NotFoundException(`Image with id ${id} not found`);
		}

		if (result[0].userId !== userId) {
			throw new ForbiddenException('Access denied');
		}
	}
}
