import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contacts } from '../db/schema';
import {
	createUnifiedStorage,
	getContentType,
	validateFileSize,
	validateFileExtension,
	IMAGE_EXTENSIONS,
	APPS,
} from '@manacore/shared-storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class PhotoService {
	private storage = createUnifiedStorage();

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

		// Delete old photo if exists
		if (contact.photoUrl) {
			try {
				const oldKey = this.extractKeyFromUrl(contact.photoUrl);
				if (oldKey) {
					await this.storage.delete(oldKey);
				}
			} catch {
				// Ignore deletion errors
			}
		}

		// Generate unique key for the new photo: {userId}/contacts/{contactId}.{ext}
		const filename = `${contactId}.${extension}`;
		const key = `${userId}/${APPS.CONTACTS}/${filename}`;

		// Upload to S3
		const contentType = getContentType(filename);
		const result = await this.storage.upload(key, file.buffer, {
			contentType,
			public: true,
		});

		// Get URL from storage client or construct manually
		const photoUrl =
			result.url ||
			this.storage.getPublicUrl(key) ||
			`${process.env.MANACORE_STORAGE_PUBLIC_URL || 'http://localhost:9000/manacore-storage'}/${key}`;

		// Update contact with photo URL
		await this.db
			.update(contacts)
			.set({ photoUrl, updatedAt: new Date() })
			.where(eq(contacts.id, contactId));

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
		// Extract key from URLs like http://localhost:9000/manacore-storage/userId/contacts/file.jpg
		// Also support old format: http://localhost:9000/contacts-storage/users/xxx/file.jpg
		const unifiedMatch = url.match(/manacore-storage\/(.+)$/);
		if (unifiedMatch) return unifiedMatch[1];

		const legacyMatch = url.match(/contacts-storage\/(.+)$/);
		return legacyMatch ? legacyMatch[1] : null;
	}
}
