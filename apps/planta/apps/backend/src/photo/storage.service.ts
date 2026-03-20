import { Injectable, Logger } from '@nestjs/common';
import {
	createPlantaStorage,
	generateUserFileKey,
	type StorageClient,
} from '@manacore/shared-storage';

const MAX_PHOTO_SIZE = 20 * 1024 * 1024; // 20MB

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private storage: StorageClient;

	constructor() {
		this.storage = createPlantaStorage();

		this.storage.hooks.on('upload', ({ key, sizeBytes }) => {
			this.logger.debug(`Uploaded photo ${key} (${sizeBytes} bytes)`);
		});
		this.storage.hooks.on('upload:error', ({ key, error }) => {
			this.logger.error(`Photo upload failed for ${key}: ${error.message}`);
		});
	}

	async uploadPhoto(
		userId: string,
		file: Express.Multer.File
	): Promise<{ storagePath: string; publicUrl: string }> {
		const storagePath = generateUserFileKey(userId, file.originalname, 'photos');

		const result = await this.storage.upload(storagePath, file.buffer, {
			contentType: file.mimetype,
			public: true,
			maxSizeBytes: MAX_PHOTO_SIZE,
			cacheControl: 'public, max-age=31536000, immutable',
		});

		return { storagePath, publicUrl: result.url ?? this.storage.getPublicUrl(storagePath) ?? '' };
	}

	async deletePhoto(storagePath: string): Promise<void> {
		try {
			await this.storage.delete(storagePath);
		} catch (err) {
			this.logger.warn(`Failed to delete photo ${storagePath}: ${err}`);
		}
	}

	getPhotoUrl(storagePath: string): string {
		return this.storage.getPublicUrl(storagePath) ?? '';
	}

	async downloadPhoto(storagePath: string): Promise<Buffer> {
		return this.storage.download(storagePath);
	}

	/**
	 * Delete all photos for a user (account deletion).
	 */
	async deleteAllUserPhotos(userId: string): Promise<number> {
		return this.storage.deleteByPrefix(`users/${userId}/`);
	}
}
