import { Injectable, Logger, BadRequestException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	createManaCoreStorage,
	generateUserFileKey,
	getContentType,
	validateFileSize,
	validateFileExtension,
	IMAGE_EXTENSIONS,
} from '@manacore/shared-storage';
import type { StorageClient } from '@manacore/shared-storage';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class StorageService implements OnModuleInit {
	private readonly logger = new Logger(StorageService.name);
	private storage: StorageClient | null = null;
	private readonly publicUrl: string | undefined;

	constructor(private readonly configService: ConfigService) {
		this.publicUrl = this.configService.get<string>('storage.publicUrl');
	}

	async onModuleInit() {
		try {
			this.storage = createManaCoreStorage(this.publicUrl);
			this.logger.log('Storage service initialized');
		} catch (error) {
			this.logger.warn(
				'Storage service not configured - avatar uploads will be disabled',
				error instanceof Error ? error.message : undefined
			);
		}
	}

	/**
	 * Check if storage is available
	 */
	isAvailable(): boolean {
		return this.storage !== null;
	}

	/**
	 * Generate a presigned URL for avatar upload
	 *
	 * @param userId - User ID
	 * @param filename - Original filename
	 * @returns Presigned upload URL and the final file URL
	 */
	async getAvatarUploadUrl(
		userId: string,
		filename: string
	): Promise<{
		uploadUrl: string;
		fileUrl: string;
		key: string;
		expiresIn: number;
	}> {
		if (!this.storage) {
			throw new BadRequestException('Storage service is not configured');
		}

		// Validate file extension
		const ext = filename.split('.').pop()?.toLowerCase();
		if (!ext || !validateFileExtension(filename, IMAGE_EXTENSIONS)) {
			throw new BadRequestException(`Invalid file type. Allowed: ${IMAGE_EXTENSIONS.join(', ')}`);
		}

		// Generate unique key for avatar
		const key = `avatars/${userId}/${Date.now()}.${ext}`;
		const contentType = getContentType(filename);

		// Get presigned upload URL (1 hour expiry)
		const expiresIn = 3600;
		const uploadUrl = await this.storage.getUploadUrl(key, {
			expiresIn,
		});

		// Construct the final public URL
		const fileUrl = await this.getPublicUrl(key);

		this.logger.debug('Generated avatar upload URL', { userId, key });

		return {
			uploadUrl,
			fileUrl,
			key,
			expiresIn,
		};
	}

	/**
	 * Upload avatar directly (for server-side uploads)
	 *
	 * @param userId - User ID
	 * @param buffer - File buffer
	 * @param filename - Original filename
	 * @returns Public URL of the uploaded avatar
	 */
	async uploadAvatar(
		userId: string,
		buffer: Buffer,
		filename: string
	): Promise<{ url: string; key: string }> {
		if (!this.storage) {
			throw new BadRequestException('Storage service is not configured');
		}

		// Validate file extension
		if (!validateFileExtension(filename, IMAGE_EXTENSIONS)) {
			throw new BadRequestException(`Invalid file type. Allowed: ${IMAGE_EXTENSIONS.join(', ')}`);
		}

		// Validate file size
		if (!validateFileSize(buffer.length, MAX_AVATAR_SIZE)) {
			throw new BadRequestException(
				`File too large. Maximum size: ${MAX_AVATAR_SIZE / 1024 / 1024}MB`
			);
		}

		// Generate unique key for avatar
		const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
		const key = `avatars/${userId}/${Date.now()}.${ext}`;

		// Upload file
		const result = await this.storage.upload(key, buffer, {
			contentType: getContentType(filename),
			public: true,
			cacheControl: 'public, max-age=31536000', // 1 year cache
		});

		const url = result.url || (await this.getPublicUrl(key));

		this.logger.log('Avatar uploaded', { userId, key });

		return { url, key };
	}

	/**
	 * Delete avatar
	 *
	 * @param key - Storage key of the avatar
	 */
	async deleteAvatar(key: string): Promise<void> {
		if (!this.storage) {
			throw new BadRequestException('Storage service is not configured');
		}

		await this.storage.delete(key);
		this.logger.log('Avatar deleted', { key });
	}

	/**
	 * Get public URL for a key
	 */
	private async getPublicUrl(key: string): Promise<string> {
		if (!this.storage) {
			throw new BadRequestException('Storage service is not configured');
		}

		// If we have a configured public URL, use it
		if (this.publicUrl) {
			return `${this.publicUrl}/${key}`;
		}

		// Check if the storage has a public URL configured
		const publicUrl = this.storage.getPublicUrl(key);
		if (publicUrl) {
			return publicUrl;
		}

		// Otherwise, get a presigned URL for reading
		return this.storage.getDownloadUrl(key, { expiresIn: 86400 * 365 }); // 1 year
	}
}
