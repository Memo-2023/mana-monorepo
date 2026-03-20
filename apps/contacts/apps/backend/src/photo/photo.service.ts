import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts } from '../db/schema';
import {
	createContactsStorage,
	generateUserFileKey,
	getContentType,
	validateFileExtension,
	IMAGE_EXTENSIONS,
	type StorageClient,
} from '@manacore/shared-storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class PhotoService {
	private readonly logger = new Logger(PhotoService.name);
	private storage: StorageClient;

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {
		this.storage = createContactsStorage();

		this.storage.hooks.on('upload', ({ key, sizeBytes, contentType }) => {
			this.logger.debug(`Uploaded photo ${key} (${sizeBytes} bytes, ${contentType})`);
		});
		this.storage.hooks.on('upload:error', ({ key, error }) => {
			this.logger.error(`Failed to upload photo ${key}: ${error.message}`);
		});
	}

	/**
	 * Upload a photo for a contact
	 */
	async uploadPhoto(
		contactId: string,
		userId: string,
		file: Express.Multer.File
	): Promise<{ photoUrl: string }> {
		if (!file) {
			throw new BadRequestException('No file provided');
		}

		if (!validateFileExtension(file.originalname, IMAGE_EXTENSIONS)) {
			throw new BadRequestException(`Invalid file type. Allowed: ${IMAGE_EXTENSIONS.join(', ')}`);
		}

		// Verify contact belongs to user
		const [contact] = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

		if (!contact) {
			throw new BadRequestException('Contact not found');
		}

		// Generate unique key for the new photo
		const key = generateUserFileKey(userId, file.originalname, 'photos');

		// Upload with size enforcement and cache headers
		const result = await this.storage.upload(key, file.buffer, {
			contentType: getContentType(file.originalname),
			public: true,
			maxSizeBytes: MAX_FILE_SIZE,
			cacheControl: 'public, max-age=31536000, immutable',
		});

		const photoUrl = result.url ?? this.storage.getPublicUrl(key) ?? '';

		// Update contact with photo URL
		await this.db
			.update(contacts)
			.set({ photoUrl, updatedAt: new Date() })
			.where(eq(contacts.id, contactId));

		// Delete old photo if exists (after successful upload + DB update)
		if (contact.photoUrl) {
			await this.deleteStorageFile(contact.photoUrl);
		}

		return { photoUrl };
	}

	/**
	 * Delete photo for a contact
	 */
	async deletePhoto(contactId: string, userId: string): Promise<void> {
		const [contact] = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

		if (!contact) {
			throw new BadRequestException('Contact not found');
		}

		if (!contact.photoUrl) {
			return;
		}

		await this.deleteStorageFile(contact.photoUrl);

		await this.db
			.update(contacts)
			.set({ photoUrl: null, updatedAt: new Date() })
			.where(eq(contacts.id, contactId));
	}

	/**
	 * Delete photo from S3 when a contact is deleted.
	 * Called by ContactService.delete() to avoid orphaned files.
	 */
	async deletePhotoByUrl(photoUrl: string | null): Promise<void> {
		if (!photoUrl) return;
		await this.deleteStorageFile(photoUrl);
	}

	/**
	 * Delete all photos for a user (account deletion).
	 */
	async deleteAllUserPhotos(userId: string): Promise<number> {
		return this.storage.deleteByPrefix(`users/${userId}/`);
	}

	private async deleteStorageFile(photoUrl: string): Promise<void> {
		try {
			const key = this.extractKeyFromUrl(photoUrl);
			if (key) {
				await this.storage.delete(key);
			}
		} catch (err) {
			this.logger.warn(
				`Failed to delete photo from storage: ${photoUrl} — ${err instanceof Error ? err.message : err}`
			);
		}
	}

	private extractKeyFromUrl(url: string): string | null {
		const match = url.match(/contacts-storage\/(.+)$/);
		return match ? match[1] : null;
	}
}
