import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { DbClient } from '../db/connection';
import { items, itemDocuments } from '../db/schema';
import { StorageService } from '../storage/storage.service';
import type { DocumentType } from '@inventory/shared';

const ALLOWED_MIME_TYPES = [
	'application/pdf',
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@Injectable()
export class DocumentService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: DbClient,
		private storageService: StorageService
	) {}

	async uploadDocument(
		userId: string,
		itemId: string,
		file: Express.Multer.File,
		documentType: DocumentType = 'other'
	) {
		const item = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, itemId), eq(items.userId, userId)))
			.limit(1);

		if (!item.length) {
			throw new NotFoundException('Item not found');
		}

		if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
			throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
		}

		const { key } = await this.storageService.uploadDocument(userId, file);

		const [document] = await this.db
			.insert(itemDocuments)
			.values({
				itemId,
				storageKey: key,
				documentType,
				filename: file.originalname,
				mimeType: file.mimetype,
				fileSize: file.size,
			})
			.returning();

		return document;
	}

	async deleteDocument(userId: string, itemId: string, documentId: string) {
		const item = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, itemId), eq(items.userId, userId)))
			.limit(1);

		if (!item.length) {
			throw new NotFoundException('Item not found');
		}

		const document = await this.db
			.select()
			.from(itemDocuments)
			.where(and(eq(itemDocuments.id, documentId), eq(itemDocuments.itemId, itemId)))
			.limit(1);

		if (!document.length) {
			throw new NotFoundException('Document not found');
		}

		await this.storageService.deleteFile(document[0].storageKey);
		await this.db.delete(itemDocuments).where(eq(itemDocuments.id, documentId));

		return { success: true };
	}

	async getDownloadUrl(userId: string, itemId: string, documentId: string) {
		const item = await this.db
			.select()
			.from(items)
			.where(and(eq(items.id, itemId), eq(items.userId, userId)))
			.limit(1);

		if (!item.length) {
			throw new NotFoundException('Item not found');
		}

		const document = await this.db
			.select()
			.from(itemDocuments)
			.where(and(eq(itemDocuments.id, documentId), eq(itemDocuments.itemId, itemId)))
			.limit(1);

		if (!document.length) {
			throw new NotFoundException('Document not found');
		}

		const url = await this.storageService.getDownloadUrl(document[0].storageKey);

		return { url, filename: document[0].filename, mimeType: document[0].mimeType };
	}
}
