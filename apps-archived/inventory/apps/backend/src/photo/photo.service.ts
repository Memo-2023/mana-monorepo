import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { DbClient } from '../db/connection';
import { items, itemPhotos } from '../db/schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class PhotoService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: DbClient,
		private storageService: StorageService
	) {}

	async uploadPhotos(userId: string, itemId: string, files: Express.Multer.File[]) {
		const item = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, itemId), eq(items.userId, userId)))
			.limit(1);

		if (!item.length) {
			throw new NotFoundException('Item not found');
		}

		const existingPhotos = await this.db
			.select()
			.from(itemPhotos)
			.where(eq(itemPhotos.itemId, itemId));

		const isPrimaryAvailable = !existingPhotos.some((p) => p.isPrimary);
		const startOrder = existingPhotos.length;

		const uploadedPhotos: Array<typeof itemPhotos.$inferSelect & { url: string }> = [];

		for (let i = 0; i < files.length; i++) {
			const file = files[i];

			if (!file.mimetype.startsWith('image/')) {
				throw new BadRequestException(`File ${file.originalname} is not an image`);
			}

			const { key, url } = await this.storageService.uploadPhoto(userId, file);

			const [photo] = await this.db
				.insert(itemPhotos)
				.values({
					itemId,
					storageKey: key,
					isPrimary: isPrimaryAvailable && i === 0,
					sortOrder: startOrder + i,
				})
				.returning();

			uploadedPhotos.push({ ...photo, url });
		}

		return uploadedPhotos;
	}

	async deletePhoto(userId: string, itemId: string, photoId: string) {
		const item = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, itemId), eq(items.userId, userId)))
			.limit(1);

		if (!item.length) {
			throw new NotFoundException('Item not found');
		}

		const photo = await this.db
			.select()
			.from(itemPhotos)
			.where(and(eq(itemPhotos.id, photoId), eq(itemPhotos.itemId, itemId)))
			.limit(1);

		if (!photo.length) {
			throw new NotFoundException('Photo not found');
		}

		await this.storageService.deleteFile(photo[0].storageKey);
		await this.db.delete(itemPhotos).where(eq(itemPhotos.id, photoId));

		if (photo[0].isPrimary) {
			const remainingPhotos = await this.db
				.select()
				.from(itemPhotos)
				.where(eq(itemPhotos.itemId, itemId))
				.orderBy(asc(itemPhotos.sortOrder))
				.limit(1);

			if (remainingPhotos.length) {
				await this.db
					.update(itemPhotos)
					.set({ isPrimary: true })
					.where(eq(itemPhotos.id, remainingPhotos[0].id));
			}
		}

		return { success: true };
	}

	async setPrimary(userId: string, itemId: string, photoId: string) {
		const item = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, itemId), eq(items.userId, userId)))
			.limit(1);

		if (!item.length) {
			throw new NotFoundException('Item not found');
		}

		const photo = await this.db
			.select()
			.from(itemPhotos)
			.where(and(eq(itemPhotos.id, photoId), eq(itemPhotos.itemId, itemId)))
			.limit(1);

		if (!photo.length) {
			throw new NotFoundException('Photo not found');
		}

		await this.db.update(itemPhotos).set({ isPrimary: false }).where(eq(itemPhotos.itemId, itemId));
		const [updatedPhoto] = await this.db
			.update(itemPhotos)
			.set({ isPrimary: true })
			.where(eq(itemPhotos.id, photoId))
			.returning();

		return updatedPhoto;
	}

	async reorderPhotos(userId: string, itemId: string, photoIds: string[]) {
		const item = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, itemId), eq(items.userId, userId)))
			.limit(1);

		if (!item.length) {
			throw new NotFoundException('Item not found');
		}

		for (let i = 0; i < photoIds.length; i++) {
			await this.db.update(itemPhotos).set({ sortOrder: i }).where(eq(itemPhotos.id, photoIds[i]));
		}

		return { success: true };
	}
}
