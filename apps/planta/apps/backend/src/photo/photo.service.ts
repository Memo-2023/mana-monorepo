import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { plantPhotos } from '../db/schema';
import { StorageService } from './storage.service';

@Injectable()
export class PhotoService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private storageService: StorageService
	) {}

	async upload(userId: string, file: Express.Multer.File, plantId?: string) {
		// Upload to storage
		const { storagePath, publicUrl } = await this.storageService.uploadPhoto(userId, file);

		// Create photo record
		const [photo] = await this.db
			.insert(plantPhotos)
			.values({
				userId,
				plantId: plantId || null,
				storagePath,
				publicUrl,
				filename: file.originalname,
				mimeType: file.mimetype,
				fileSize: file.size,
				isPrimary: false,
				isAnalyzed: false,
			})
			.returning();

		// If this is the first photo for the plant, set it as primary
		if (plantId) {
			const existingPhotos = await this.db
				.select()
				.from(plantPhotos)
				.where(eq(plantPhotos.plantId, plantId));

			if (existingPhotos.length === 1) {
				await this.db
					.update(plantPhotos)
					.set({ isPrimary: true })
					.where(eq(plantPhotos.id, photo.id));
				photo.isPrimary = true;
			}
		}

		return photo;
	}

	async findOne(id: string, userId: string) {
		const [photo] = await this.db
			.select()
			.from(plantPhotos)
			.where(and(eq(plantPhotos.id, id), eq(plantPhotos.userId, userId)))
			.limit(1);

		if (!photo) {
			throw new NotFoundException('Photo not found');
		}

		return photo;
	}

	async delete(id: string, userId: string) {
		const photo = await this.findOne(id, userId);

		// Delete from storage
		await this.storageService.deletePhoto(photo.storagePath);

		// Delete from database
		await this.db.delete(plantPhotos).where(eq(plantPhotos.id, id));

		return { success: true };
	}

	async setPrimary(id: string, userId: string) {
		const photo = await this.findOne(id, userId);

		if (!photo.plantId) {
			throw new NotFoundException('Photo is not associated with a plant');
		}

		// Remove primary from all photos of this plant
		await this.db
			.update(plantPhotos)
			.set({ isPrimary: false })
			.where(eq(plantPhotos.plantId, photo.plantId));

		// Set this photo as primary
		await this.db.update(plantPhotos).set({ isPrimary: true }).where(eq(plantPhotos.id, id));

		return { success: true };
	}

	async linkToPlant(photoId: string, plantId: string, userId: string) {
		const photo = await this.findOne(photoId, userId);

		await this.db.update(plantPhotos).set({ plantId }).where(eq(plantPhotos.id, photo.id));

		return { success: true };
	}

	async markAnalyzed(photoId: string) {
		await this.db.update(plantPhotos).set({ isAnalyzed: true }).where(eq(plantPhotos.id, photoId));
	}

	async getPhotoBuffer(storagePath: string): Promise<Buffer> {
		return this.storageService.downloadPhoto(storagePath);
	}
}
