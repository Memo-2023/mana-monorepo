import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { eq, and, isNull, isNotNull, desc, inArray, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { images, imageTags, type Image } from '../db/schema';
import { GetImagesQueryDto } from './dto/image.dto';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

  async getImages(
    userId: string,
    query: GetImagesQueryDto,
  ): Promise<Image[]> {
    try {
      const {
        page = 1,
        limit = 20,
        archived = false,
        tagIds,
        favoritesOnly = false,
      } = query;

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
      const result = await this.db
        .select()
        .from(images)
        .where(eq(images.id, id))
        .limit(1);

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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error unpublishing image ${id}`, error);
      throw error;
    }
  }

  async toggleFavorite(
    id: string,
    userId: string,
    isFavorite: boolean,
  ): Promise<Image> {
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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Error toggling favorite for image ${id}`, error);
      throw error;
    }
  }

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
