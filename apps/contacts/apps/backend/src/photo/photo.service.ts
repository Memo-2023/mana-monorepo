import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts } from '../db/schema';
import {
	createContactsStorage,
	generateUserFileKey,
	getContentType,
	validateFileSize,
	validateFileExtension,
	IMAGE_EXTENSIONS,
	getStorageConfig,
	BUCKETS,
} from '@manacore/shared-storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class PhotoService {
	private storage = createContactsStorage();

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	/**
	 * Upload a photo for a contact
	 */
	async uploadPhoto(
		contactId: string,
		userId: string,
		file: Express.Multer.File
	): Promise<{ photoUrl: string }> {
		// Validate file
		if (!file) {
			throw new BadRequestException('No file provided');
		}

		if (!validateFileSize(file.size, MAX_FILE_SIZE)) {
			throw new BadRequestException(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
		}

		// validateFileExtension expects a filename, not just the extension
		if (!validateFileExtension(file.originalname, IMAGE_EXTENSIONS)) {
			throw new BadRequestException(`Invalid file type. Allowed: ${IMAGE_EXTENSIONS.join(', ')}`);
		}

		const extension = file.originalname.split('.').pop()?.toLowerCase() || '';

		// Verify contact belongs to user
		const [contact] = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

		if (!contact) {
			throw new BadRequestException('Contact not found');
		}

		// Generate unique key for the new photo
		const filename = `${contactId}.${extension}`;
		const key = generateUserFileKey(userId, filename);

		// Upload new photo to S3 first (safe: if this fails, nothing is lost)
		const contentType = getContentType(filename);
		await this.storage.upload(key, file.buffer, {
			contentType,
			public: true,
		});

		// Generate the URL from S3 endpoint configuration
		const { endpoint } = getStorageConfig();
		const photoUrl = `${endpoint}/${BUCKETS.CONTACTS}/${key}`;

		// Update contact with photo URL
		await this.db
			.update(contacts)
			.set({ photoUrl, updatedAt: new Date() })
			.where(eq(contacts.id, contactId));

		// Delete old photo if exists (after successful upload + DB update)
		if (contact.photoUrl) {
			try {
				const oldKey = this.extractKeyFromUrl(contact.photoUrl);
				if (oldKey) {
					await this.storage.delete(oldKey);
				}
			} catch {
				// Ignore deletion errors - orphaned old file is harmless
			}
		}

		return { photoUrl };
	}

	/**
	 * Delete photo for a contact
	 */
	async deletePhoto(contactId: string, userId: string): Promise<void> {
		// Get contact
		const [contact] = await this.db
			.select()
			.from(contacts)
			.where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));

		if (!contact) {
			throw new BadRequestException('Contact not found');
		}

		if (!contact.photoUrl) {
			return; // No photo to delete
		}

		// Delete from S3
		try {
			const key = this.extractKeyFromUrl(contact.photoUrl);
			if (key) {
				await this.storage.delete(key);
			}
		} catch {
			// Ignore deletion errors
		}

		// Update contact to remove photo URL
		await this.db
			.update(contacts)
			.set({ photoUrl: null, updatedAt: new Date() })
			.where(eq(contacts.id, contactId));
	}

	private extractKeyFromUrl(url: string): string | null {
		// Extract key from URLs like {endpoint}/contacts-storage/users/xxx/file.jpg
		const match = url.match(/contacts-storage\/(.+)$/);
		return match ? match[1] : null;
	}
}
