import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	createStorageStorage,
	StorageClient,
	generateUserFileKey,
	getContentType,
	validateFileSize,
} from '@manacore/shared-storage';

@Injectable()
export class StorageService {
	private storage: StorageClient;
	private maxFileSize: number;

	constructor(private configService: ConfigService) {
		const publicUrl = this.configService.get<string>('STORAGE_S3_PUBLIC_URL');
		this.storage = createStorageStorage(publicUrl);
		this.maxFileSize = this.configService.get<number>('STORAGE_MAX_FILE_SIZE') || 100 * 1024 * 1024; // 100MB default
	}

	async uploadFile(
		userId: string,
		buffer: Buffer,
		originalName: string,
		mimeType: string,
		subfolder?: string
	) {
		if (!validateFileSize(buffer.length, this.maxFileSize / (1024 * 1024))) {
			throw new Error(
				`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`
			);
		}

		const storageKey = generateUserFileKey(userId, originalName, subfolder);

		const result = await this.storage.upload(storageKey, buffer, {
			contentType: mimeType || getContentType(originalName),
		});

		return {
			storageKey,
			storagePath: result.key,
			publicUrl: result.url,
			etag: result.etag,
		};
	}

	async downloadFile(storageKey: string): Promise<Buffer> {
		return this.storage.download(storageKey);
	}

	async deleteFile(storageKey: string): Promise<void> {
		await this.storage.delete(storageKey);
	}

	async fileExists(storageKey: string): Promise<boolean> {
		return this.storage.exists(storageKey);
	}

	async getDownloadUrl(storageKey: string, expiresIn = 3600): Promise<string> {
		return this.storage.getDownloadUrl(storageKey, { expiresIn });
	}

	async getUploadUrl(storageKey: string, expiresIn = 3600): Promise<string> {
		return this.storage.getUploadUrl(storageKey, { expiresIn });
	}

	getPublicUrl(storageKey: string): string | undefined {
		return this.storage.getPublicUrl(storageKey);
	}
}
