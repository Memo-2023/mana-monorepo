import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createUnifiedStorage, StorageClient, APPS } from '@manacore/shared-storage';

export type StorageMode = 's3';

@Injectable()
export class StorageService implements OnModuleInit {
	private readonly logger = new Logger(StorageService.name);
	private storage!: StorageClient;
	private publicUrl: string;

	constructor(private configService: ConfigService) {
		// Get public URL from config
		this.publicUrl = this.configService.get<string>(
			'MANACORE_STORAGE_PUBLIC_URL',
			'http://localhost:9000/manacore-storage'
		);
	}

	onModuleInit() {
		// Initialize unified storage client
		this.storage = createUnifiedStorage(this.publicUrl);
		this.logger.log(`Storage initialized with @manacore/shared-storage (bucket: manacore-storage)`);
	}

	async uploadFile(
		buffer: Buffer,
		userId: string,
		filename: string,
		contentType: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		const timestamp = Date.now();
		const randomId = Math.random().toString(36).substring(2, 10);
		const ext = filename.split('.').pop() || 'jpg';
		// Path: {userId}/picture/{timestamp}-{randomId}.{ext}
		const storagePath = `${userId}/${APPS.PICTURE}/${timestamp}-${randomId}.${ext}`;

		const result = await this.storage.upload(storagePath, buffer, {
			contentType,
			public: true,
		});

		const publicUrl = result.url || this.getPublicUrl(storagePath);

		this.logger.debug(`Uploaded file to ${storagePath}`);

		return { storagePath, publicUrl };
	}

	async uploadFromUrl(
		url: string,
		userId: string,
		filename: string
	): Promise<{ storagePath: string; publicUrl: string }> {
		// Download the file
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
			this.logger.debug(`Deleted file: ${storagePath}`);
		} catch (error) {
			this.logger.error(`Error deleting file ${storagePath}`, error);
			throw error;
		}
	}

	async uploadBoardThumbnail(boardId: string, dataUrl: string): Promise<string> {
		const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
		const buffer = Buffer.from(base64Data, 'base64');
		// Path: boards/picture/{boardId}/thumbnail-{timestamp}.png
		const storagePath = `boards/${APPS.PICTURE}/${boardId}/thumbnail-${Date.now()}.png`;

		const result = await this.storage.upload(storagePath, buffer, {
			contentType: 'image/png',
			public: true,
		});

		return result.url || this.getPublicUrl(storagePath);
	}

	async getFile(storagePath: string): Promise<Buffer | null> {
		try {
			return await this.storage.download(storagePath);
		} catch (error) {
			this.logger.error(`Error getting file ${storagePath}`, error);
			return null;
		}
	}

	getStorageMode(): StorageMode {
		return 's3';
	}

	getPublicUrl(storagePath: string): string {
		return this.storage.getPublicUrl(storagePath) || `${this.publicUrl}/${storagePath}`;
	}
}
