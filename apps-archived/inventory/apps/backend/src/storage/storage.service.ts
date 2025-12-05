import { Injectable } from '@nestjs/common';
import {
	createInventoryStorage,
	generateUserFileKey,
	getContentType,
} from '@manacore/shared-storage';
import type { StorageClient } from '@manacore/shared-storage';

@Injectable()
export class StorageService {
	private storage: StorageClient;

	constructor() {
		this.storage = createInventoryStorage();
	}

	async uploadPhoto(
		userId: string,
		file: Express.Multer.File
	): Promise<{ key: string; url: string }> {
		const key = generateUserFileKey(userId, `photos/${Date.now()}-${file.originalname}`);
		const result = await this.storage.upload(key, file.buffer, {
			contentType: file.mimetype,
			public: true,
		});
		return { key, url: result.url || this.getPublicUrl(key) };
	}

	async uploadDocument(
		userId: string,
		file: Express.Multer.File
	): Promise<{ key: string; url: string }> {
		const key = generateUserFileKey(userId, `documents/${Date.now()}-${file.originalname}`);
		const result = await this.storage.upload(key, file.buffer, {
			contentType: file.mimetype,
			public: false,
		});
		return { key, url: result.url || '' };
	}

	async deleteFile(key: string): Promise<void> {
		await this.storage.delete(key);
	}

	async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
		return this.storage.getDownloadUrl(key, { expiresIn });
	}

	getPublicUrl(key: string): string {
		const publicUrl = process.env.INVENTORY_S3_PUBLIC_URL || process.env.S3_ENDPOINT;
		return `${publicUrl}/${key}`;
	}
}
