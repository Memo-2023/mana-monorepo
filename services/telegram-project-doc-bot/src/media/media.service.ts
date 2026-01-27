import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, asc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { MediaItem, NewMediaItem } from '../database/schema';
import { StorageService } from './storage.service';
import { TranscriptionService } from '../transcription/transcription.service';

@Injectable()
export class MediaService {
	private readonly logger = new Logger(MediaService.name);
	private readonly telegramApiUrl: string;

	constructor(
		@Inject(DATABASE_CONNECTION)
		private db: PostgresJsDatabase<typeof schema>,
		private storageService: StorageService,
		private transcriptionService: TranscriptionService,
		private configService: ConfigService
	) {
		const token = this.configService.get<string>('telegram.token');
		this.telegramApiUrl = `https://api.telegram.org/bot${token}`;
	}

	// Get file URL from Telegram
	private async getTelegramFileUrl(fileId: string): Promise<string> {
		const response = await fetch(`${this.telegramApiUrl}/getFile?file_id=${fileId}`);
		const data = await response.json();

		if (!data.ok) {
			throw new Error(`Telegram API error: ${data.description}`);
		}

		const token = this.configService.get<string>('telegram.token');
		return `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
	}

	// Download file from URL
	private async downloadFile(url: string): Promise<Buffer> {
		const response = await fetch(url);
		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}

	// Process a photo from Telegram
	async processPhoto(projectId: string, fileId: string, caption?: string): Promise<MediaItem> {
		this.logger.log(`Processing photo for project ${projectId}`);

		// 1. Download from Telegram
		const fileUrl = await this.getTelegramFileUrl(fileId);
		const buffer = await this.downloadFile(fileUrl);

		// 2. Generate storage key and upload
		const filename = `photo_${Date.now()}.jpg`;
		const storageKey = this.storageService.generateKey(projectId, 'photo', filename);
		await this.storageService.upload(storageKey, buffer, 'image/jpeg');

		// 3. Get next order index
		const orderIndex = await this.getNextOrderIndex(projectId);

		// 4. Save to database
		const [item] = await this.db
			.insert(schema.mediaItems)
			.values({
				projectId,
				type: 'photo',
				storageKey,
				caption,
				telegramFileId: fileId,
				orderIndex,
				metadata: { fileSize: buffer.length },
			})
			.returning();

		this.logger.log(`Photo saved: ${item.id}`);
		return item;
	}

	// Process a voice note from Telegram
	async processVoice(projectId: string, fileId: string, duration?: number): Promise<MediaItem> {
		this.logger.log(`Processing voice for project ${projectId}`);

		// 1. Download from Telegram
		const fileUrl = await this.getTelegramFileUrl(fileId);
		const buffer = await this.downloadFile(fileUrl);

		// 2. Transcribe with Whisper
		let transcription: string | undefined;
		if (this.transcriptionService.isAvailable()) {
			try {
				transcription = await this.transcriptionService.transcribe(buffer);
			} catch (error) {
				this.logger.warn('Transcription failed, saving without:', error);
			}
		}

		// 3. Generate storage key and upload
		const filename = `voice_${Date.now()}.ogg`;
		const storageKey = this.storageService.generateKey(projectId, 'voice', filename);
		await this.storageService.upload(storageKey, buffer, 'audio/ogg');

		// 4. Get next order index
		const orderIndex = await this.getNextOrderIndex(projectId);

		// 5. Save to database
		const [item] = await this.db
			.insert(schema.mediaItems)
			.values({
				projectId,
				type: 'voice',
				storageKey,
				transcription,
				telegramFileId: fileId,
				orderIndex,
				metadata: { duration, fileSize: buffer.length },
			})
			.returning();

		this.logger.log(`Voice saved: ${item.id}, transcription: ${transcription ? 'yes' : 'no'}`);
		return item;
	}

	// Add a text note
	async addTextNote(projectId: string, text: string): Promise<MediaItem> {
		const orderIndex = await this.getNextOrderIndex(projectId);

		const [item] = await this.db
			.insert(schema.mediaItems)
			.values({
				projectId,
				type: 'text',
				caption: text,
				orderIndex,
			})
			.returning();

		this.logger.log(`Text note saved: ${item.id}`);
		return item;
	}

	// Get all media items for a project
	async getByProject(projectId: string): Promise<MediaItem[]> {
		return this.db.query.mediaItems.findMany({
			where: eq(schema.mediaItems.projectId, projectId),
			orderBy: [asc(schema.mediaItems.orderIndex), asc(schema.mediaItems.createdAt)],
		});
	}

	// Get next order index for a project
	private async getNextOrderIndex(projectId: string): Promise<number> {
		const items = await this.db.query.mediaItems.findMany({
			where: eq(schema.mediaItems.projectId, projectId),
		});
		return items.length;
	}

	// Delete a media item
	async delete(id: string): Promise<boolean> {
		const result = await this.db.delete(schema.mediaItems).where(eq(schema.mediaItems.id, id));
		return (result as unknown as { rowCount: number }).rowCount > 0;
	}
}
