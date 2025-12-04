import { Injectable, Inject, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { images, imageTags } from '../db/schema';
import type { Image } from '../db/schema';
import { StorageService } from './storage.service';

@Injectable()
export class UploadService {
	private readonly logger = new Logger(UploadService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: Database,
		private readonly storageService: StorageService
	) {}

	async uploadImage(userId: string, file: Express.Multer.File): Promise<Image> {
		try {
			// Upload to storage
			const { storagePath, publicUrl } = await this.storageService.uploadFile(
				file.buffer,
				userId,
				file.originalname,
				file.mimetype
			);

			// Get image dimensions (would need sharp for this)
			// For now, we'll skip dimensions

			// Create database record
			const result = await this.db
				.insert(images)
				.values({
					userId,
					prompt: file.originalname, // Use filename as prompt for uploaded images
					storagePath,
					publicUrl,
					filename: file.originalname,
					format: file.mimetype.split('/')[1],
					fileSize: file.size,
				})
				.returning();

			return result[0];
		} catch (error) {
			this.logger.error('Error uploading image', error);
			throw error;
		}
	}

	async uploadMultiple(userId: string, files: Express.Multer.File[]): Promise<Image[]> {
		const results: Image[] = [];

		for (const file of files) {
			try {
				const image = await this.uploadImage(userId, file);
				results.push(image);
			} catch (error) {
				this.logger.error(`Error uploading file ${file.originalname}`, error);
				// Continue with other files
			}
		}

		return results;
	}

	async deleteUploadedImage(id: string, userId: string): Promise<void> {
		try {
			// Get the image
			const result = await this.db.select().from(images).where(eq(images.id, id)).limit(1);

			if (result.length === 0) {
				throw new NotFoundException(`Image with id ${id} not found`);
			}

			const image = result[0];

			// Verify ownership
			if (image.userId !== userId) {
				throw new ForbiddenException('Access denied');
			}

			// Delete from storage
			try {
				await this.storageService.deleteFile(image.storagePath);
			} catch (error) {
				this.logger.warn(`Failed to delete file from storage: ${image.storagePath}`);
				// Continue with database deletion
			}

			// Delete image-tag relations
			await this.db.delete(imageTags).where(eq(imageTags.imageId, id));

			// Delete the database record
			await this.db.delete(images).where(eq(images.id, id));
		} catch (error) {
			if (error instanceof NotFoundException || error instanceof ForbiddenException) {
				throw error;
			}
			this.logger.error(`Error deleting uploaded image ${id}`, error);
			throw error;
		}
	}
}
