import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	createStorageStorage,
	StorageClient,
	generateUserFileKey,
	getContentType,
} from '@manacore/shared-storage';

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private storage: StorageClient;
	private maxFileSize: number;

	constructor(private configService: ConfigService) {
		const publicUrl = this.configService.get<string>('STORAGE_S3_PUBLIC_URL');
		this.storage = createStorageStorage(publicUrl);
		this.maxFileSize = this.configService.get<number>('STORAGE_MAX_FILE_SIZE') || 100 * 1024 * 1024;

		this.storage.hooks.on('upload', ({ key, sizeBytes }) => {
			this.logger.debug(`Uploaded ${key} (${sizeBytes} bytes)`);
		});
		this.storage.hooks.on('upload:error', ({ key, error }) => {
			this.logger.error(`Upload failed for ${key}: ${error.message}`);
		});
	}

	async uploadFile(
		userId: string,
		buffer: Buffer,
		originalName: string,
		mimeType: string,
		subfolder?: string
	) {
		const storageKey = generateUserFileKey(userId, originalName, subfolder);

		const result = await this.storage.upload(storageKey, buffer, {
			contentType: mimeType || getContentType(originalName),
			maxSizeBytes: this.maxFileSize,
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

	async deleteFiles(storageKeys: string[]): Promise<void> {
		await this.storage.deleteMany(storageKeys);
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

	/**
	 * Delete all files for a user (account deletion).
	 */
	async deleteAllUserFiles(userId: string): Promise<number> {
		return this.storage.deleteByPrefix(`users/${userId}/`);
	}
}
