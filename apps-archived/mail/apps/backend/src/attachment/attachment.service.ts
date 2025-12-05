import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { attachments, type Attachment, type NewAttachment } from '../db/schema';
import { createMailStorage, generateUserFileKey, getContentType } from '@manacore/shared-storage';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface AttachmentFilters {
	emailId?: string;
	limit?: number;
	offset?: number;
}

@Injectable()
export class AttachmentService {
	private storage = createMailStorage();

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByEmailId(emailId: string, userId: string): Promise<Attachment[]> {
		return this.db
			.select()
			.from(attachments)
			.where(and(eq(attachments.emailId, emailId), eq(attachments.userId, userId)))
			.orderBy(desc(attachments.createdAt));
	}

	async findById(id: string, userId: string): Promise<Attachment | null> {
		const [attachment] = await this.db
			.select()
			.from(attachments)
			.where(and(eq(attachments.id, id), eq(attachments.userId, userId)));
		return attachment || null;
	}

	async create(data: NewAttachment): Promise<Attachment> {
		const [attachment] = await this.db.insert(attachments).values(data).returning();
		return attachment;
	}

	async delete(id: string, userId: string): Promise<void> {
		const attachment = await this.findById(id, userId);
		if (!attachment) {
			throw new NotFoundException('Attachment not found');
		}

		// Delete from storage if uploaded
		if (attachment.storageKey) {
			try {
				await this.storage.delete(attachment.storageKey);
			} catch (error) {
				// Log but don't fail if storage deletion fails
				console.error('Failed to delete attachment from storage:', error);
			}
		}

		await this.db
			.delete(attachments)
			.where(and(eq(attachments.id, id), eq(attachments.userId, userId)));
	}

	async deleteByEmailId(emailId: string, userId: string): Promise<void> {
		const emailAttachments = await this.findByEmailId(emailId, userId);

		// Delete all from storage
		for (const attachment of emailAttachments) {
			if (attachment.storageKey) {
				try {
					await this.storage.delete(attachment.storageKey);
				} catch (error) {
					console.error('Failed to delete attachment from storage:', error);
				}
			}
		}

		await this.db
			.delete(attachments)
			.where(and(eq(attachments.emailId, emailId), eq(attachments.userId, userId)));
	}

	// Generate a presigned URL for uploading
	async getUploadUrl(
		userId: string,
		data: { filename: string; mimeType: string; size: number }
	): Promise<{ uploadUrl: string; key: string }> {
		if (data.size > MAX_FILE_SIZE) {
			throw new BadRequestException(
				`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
			);
		}

		const key = generateUserFileKey(userId, data.filename, 'attachments');
		const uploadUrl = await this.storage.getUploadUrl(key, { expiresIn: 3600 });

		return { uploadUrl, key };
	}

	// Generate a presigned URL for downloading
	async getDownloadUrl(
		id: string,
		userId: string
	): Promise<{ downloadUrl: string; filename: string }> {
		const attachment = await this.findById(id, userId);
		if (!attachment) {
			throw new NotFoundException('Attachment not found');
		}

		if (!attachment.storageKey) {
			throw new BadRequestException('Attachment not yet uploaded');
		}

		const downloadUrl = await this.storage.getDownloadUrl(attachment.storageKey, {
			expiresIn: 3600,
		});

		return { downloadUrl, filename: attachment.filename };
	}

	// Mark attachment as uploaded with storage key
	async markUploaded(id: string, userId: string, storageKey: string): Promise<Attachment> {
		const attachment = await this.findById(id, userId);
		if (!attachment) {
			throw new NotFoundException('Attachment not found');
		}

		const [updated] = await this.db
			.update(attachments)
			.set({
				storageKey,
				isDownloaded: true,
			})
			.where(and(eq(attachments.id, id), eq(attachments.userId, userId)))
			.returning();

		return updated;
	}

	// Upload directly (for server-side operations like sync)
	async uploadDirect(
		userId: string,
		emailId: string,
		data: { filename: string; mimeType: string; content: Buffer }
	): Promise<Attachment> {
		if (data.content.length > MAX_FILE_SIZE) {
			throw new BadRequestException(
				`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`
			);
		}

		const key = generateUserFileKey(userId, data.filename, 'attachments');

		// Upload to storage
		await this.storage.upload(key, data.content, {
			contentType: data.mimeType,
		});

		// Create attachment record
		const attachment = await this.create({
			emailId,
			userId,
			filename: data.filename,
			mimeType: data.mimeType,
			size: data.content.length,
			storageKey: key,
			isDownloaded: true,
		});

		return attachment;
	}

	// Download content directly (for server-side operations)
	async downloadDirect(
		id: string,
		userId: string
	): Promise<{ content: Buffer; filename: string; mimeType: string }> {
		const attachment = await this.findById(id, userId);
		if (!attachment) {
			throw new NotFoundException('Attachment not found');
		}

		if (!attachment.storageKey) {
			throw new BadRequestException('Attachment not available');
		}

		const content = await this.storage.download(attachment.storageKey);

		return {
			content,
			filename: attachment.filename,
			mimeType: attachment.mimeType,
		};
	}
}
