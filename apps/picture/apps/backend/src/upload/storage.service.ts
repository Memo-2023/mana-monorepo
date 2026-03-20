import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPictureStorage, StorageClient, generateUserFileKey } from '@manacore/shared-storage';

const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_THUMBNAIL_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private storage: StorageClient;

	constructor(private configService: ConfigService) {
		const publicUrl = this.configService.get<string>(
			'STORAGE_PUBLIC_URL',
			'http://localhost:9000/picture-storage'
		);
		this.storage = createPictureStorage(publicUrl);

		this.storage.hooks.on('upload', ({ key, sizeBytes, contentType }) => {
			this.logger.debug(`Uploaded ${key} (${sizeBytes} bytes, ${contentType})`);
		});
		this.storage.hooks.on('upload:error', ({ key, error }) => {
			this.logger.error(`Upload failed for ${key}: ${error.message}`);
		});
	}

	async uploadFile(
		buffer: Buffer,
		userId: string,
		filename: string,
		contentType: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		const storagePath = generateUserFileKey(userId, filename, 'images');

		const result = await this.storage.upload(storagePath, buffer, {
			contentType,
			public: true,
			maxSizeBytes: MAX_IMAGE_SIZE,
			cacheControl: 'public, max-age=31536000, immutable',
		});

		return { storagePath, publicUrl: result.url ?? this.getPublicUrl(storagePath) };
	}

	async uploadFromUrl(
		url: string,
		userId: string,
		filename: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`Failed to download file from ${url}`);
		}

		const buffer = Buffer.from(await response.arrayBuffer());
		const contentType = response.headers.get('content-type') || 'image/jpeg';

		return this.uploadFile(buffer, userId, filename, contentType);
	}

	async deleteFile(storagePath: string): Promise<void> {
		try {
			await this.storage.delete(storagePath);
		} catch (error) {
			this.logger.warn(`Failed to delete file ${storagePath}: ${error}`);
		}
	}

	async uploadBoardThumbnail(boardId: string, dataUrl: string): Promise<string> {
		const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
		const buffer = Buffer.from(base64Data, 'base64');
		const storagePath = `boards/${boardId}/thumbnail.png`;

		const result = await this.storage.upload(storagePath, buffer, {
			contentType: 'image/png',
			public: true,
			maxSizeBytes: MAX_THUMBNAIL_SIZE,
			cacheControl: 'public, max-age=604800', // 7 days (thumbnails can be regenerated)
		});

		return result.url ?? this.getPublicUrl(storagePath);
	}

	async getFile(storagePath: string): Promise<Buffer | null> {
		try {
			return await this.storage.download(storagePath);
		} catch (error) {
			this.logger.error(`Error getting file ${storagePath}`, error);
			return null;
		}
	}

	getPublicUrl(storagePath: string): string {
		return this.storage.getPublicUrl(storagePath) ?? '';
	}

	/**
	 * Delete all files for a user (account deletion).
	 */
	async deleteAllUserFiles(userId: string): Promise<number> {
		return this.storage.deleteByPrefix(`users/${userId}/`);
	}
}
