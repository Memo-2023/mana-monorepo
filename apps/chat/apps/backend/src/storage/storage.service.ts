import { Injectable, Logger } from '@nestjs/common';
import {
	createChatStorage,
	generateUserFileKey,
	getContentType,
	validateFileSize,
	validateFileExtension,
	IMAGE_EXTENSIONS,
	DOCUMENT_EXTENSIONS,
	AUDIO_EXTENSIONS,
} from '@manacore/shared-storage';
import type { StorageClient, UploadResult } from '@manacore/shared-storage';

export interface FileUploadResult {
	key: string;
	url?: string;
	contentType: string;
	size: number;
}

export interface PresignedUploadData {
	uploadUrl: string;
	key: string;
	expiresIn: number;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [...IMAGE_EXTENSIONS, ...DOCUMENT_EXTENSIONS, ...AUDIO_EXTENSIONS];

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private storage: StorageClient | null = null;

	private getStorage(): StorageClient {
		if (!this.storage) {
			this.storage = createChatStorage();
		}
		return this.storage;
	}

	/**
	 * Upload a file to storage
	 */
	async uploadFile(
		userId: string,
		filename: string,
		data: Buffer,
		options?: { folder?: string; public?: boolean }
	): Promise<FileUploadResult> {
		// Validate file size (MAX_FILE_SIZE is in bytes)
		if (!validateFileSize(data.length, MAX_FILE_SIZE / (1024 * 1024))) {
			throw new Error(`File size exceeds maximum allowed (${MAX_FILE_SIZE / (1024 * 1024)}MB)`);
		}

		// Validate file extension
		if (!validateFileExtension(filename, ALLOWED_EXTENSIONS)) {
			throw new Error(
				`File type not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
			);
		}

		const contentType = getContentType(filename);
		const key = generateUserFileKey(userId, filename, options?.folder);

		const storage = this.getStorage();
		const result: UploadResult = await storage.upload(key, data, {
			contentType,
			public: options?.public ?? false,
		});

		this.logger.log(`File uploaded: ${key} (${data.length} bytes)`);

		return {
			key: result.key,
			url: result.url,
			contentType,
			size: data.length,
		};
	}

	/**
	 * Get a presigned URL for uploading (client-side upload)
	 */
	async getPresignedUploadUrl(
		userId: string,
		filename: string,
		options?: { folder?: string; expiresIn?: number }
	): Promise<PresignedUploadData> {
		// Validate file extension
		if (!validateFileExtension(filename, ALLOWED_EXTENSIONS)) {
			throw new Error(
				`File type not allowed. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`
			);
		}

		const key = generateUserFileKey(userId, filename, options?.folder);
		const expiresIn = options?.expiresIn ?? 3600; // 1 hour default

		const storage = this.getStorage();
		const uploadUrl = await storage.getUploadUrl(key, { expiresIn });

		return {
			uploadUrl,
			key,
			expiresIn,
		};
	}

	/**
	 * Get a presigned URL for downloading
	 */
	async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
		const storage = this.getStorage();
		return storage.getDownloadUrl(key, { expiresIn });
	}

	/**
	 * Download a file from storage
	 */
	async downloadFile(key: string): Promise<Buffer> {
		const storage = this.getStorage();
		return storage.download(key);
	}

	/**
	 * Delete a file from storage
	 */
	async deleteFile(key: string): Promise<void> {
		const storage = this.getStorage();
		await storage.delete(key);
		this.logger.log(`File deleted: ${key}`);
	}

	/**
	 * Check if a file exists
	 */
	async fileExists(key: string): Promise<boolean> {
		const storage = this.getStorage();
		return storage.exists(key);
	}

	/**
	 * List files for a user
	 */
	async listUserFiles(userId: string, folder?: string): Promise<string[]> {
		const storage = this.getStorage();
		const prefix = folder ? `users/${userId}/${folder}/` : `users/${userId}/`;
		const files = await storage.list(prefix);
		return files.map((f) => f.key);
	}
}
