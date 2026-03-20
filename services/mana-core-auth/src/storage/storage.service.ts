import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	createManaCoreStorage,
	generateUserFileKey,
	getContentType,
	validateFileExtension,
	IMAGE_EXTENSIONS,
} from '@manacore/shared-storage';
import type { StorageClient } from '@manacore/shared-storage';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class StorageService {
	private readonly logger = new Logger(StorageService.name);
	private storage: StorageClient | null = null;

	constructor(private readonly configService: ConfigService) {
		try {
			const publicUrl = this.configService.get<string>('storage.publicUrl');
			this.storage = createManaCoreStorage(publicUrl);

			this.storage.hooks.on('upload', ({ key, sizeBytes }) => {
				this.logger.debug(`Uploaded avatar ${key} (${sizeBytes} bytes)`);
			});
			this.storage.hooks.on('upload:error', ({ key, error }) => {
				this.logger.error(`Avatar upload failed for ${key}: ${error.message}`);
			});

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

		if (!validateFileExtension(filename, IMAGE_EXTENSIONS)) {
			throw new BadRequestException(`Invalid file type. Allowed: ${IMAGE_EXTENSIONS.join(', ')}`);
		}

		const key = generateUserFileKey(userId, filename, 'avatars');
		const expiresIn = 3600;
		const uploadUrl = await this.storage.getUploadUrl(key, { expiresIn });
		const fileUrl = this.storage.getPublicUrl(key) ?? '';

		return { uploadUrl, fileUrl, key, expiresIn };
	}

	/**
	 * Upload avatar directly (for server-side uploads)
	 */
	async uploadAvatar(
		userId: string,
		buffer: Buffer,
		filename: string
	): Promise<{ url: string; key: string }> {
		if (!this.storage) {
			throw new BadRequestException('Storage service is not configured');
		}

		if (!validateFileExtension(filename, IMAGE_EXTENSIONS)) {
			throw new BadRequestException(`Invalid file type. Allowed: ${IMAGE_EXTENSIONS.join(', ')}`);
		}

		const key = generateUserFileKey(userId, filename, 'avatars');

		const result = await this.storage.upload(key, buffer, {
			contentType: getContentType(filename),
			public: true,
			maxSizeBytes: MAX_AVATAR_SIZE,
			cacheControl: 'public, max-age=31536000, immutable',
		});

		return { url: result.url ?? this.storage.getPublicUrl(key) ?? '', key };
	}

	/**
	 * Delete avatar
	 */
	async deleteAvatar(key: string): Promise<void> {
		if (!this.storage) {
			throw new BadRequestException('Storage service is not configured');
		}

		await this.storage.delete(key);
	}

	/**
	 * Delete all avatars for a user (account deletion).
	 */
	async deleteAllUserAvatars(userId: string): Promise<number> {
		if (!this.storage) return 0;
		return this.storage.deleteByPrefix(`users/${userId}/`);
	}
}
