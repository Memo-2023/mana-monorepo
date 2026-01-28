import { Injectable, Inject, Logger } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import { projectItems } from '../database/schema';
import { StorageService } from './storage.service';
import { TranscriptionService } from '../transcription/transcription.service';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class MediaService {
	private readonly logger = new Logger(MediaService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private storageService: StorageService,
		private transcriptionService: TranscriptionService
	) {}

	async processPhoto(
		projectId: string,
		buffer: Buffer,
		contentType: string,
		mxcUrl: string,
		caption?: string
	) {
		const key = await this.storageService.uploadFile(buffer, contentType, projectId);

		const [item] = await this.db
			.insert(projectItems)
			.values({
				projectId,
				type: 'photo',
				content: caption || null,
				mediaUrl: key,
				mediaMxcUrl: mxcUrl,
			})
			.returning();

		this.logger.log(`Saved photo for project ${projectId}`);
		return item;
	}

	async processVoice(
		projectId: string,
		buffer: Buffer,
		contentType: string,
		mxcUrl: string,
		duration: number
	) {
		const key = await this.storageService.uploadFile(buffer, contentType, projectId);

		// Transcribe the voice message
		let transcription: string | null = null;
		try {
			transcription = await this.transcriptionService.transcribe(buffer);
			this.logger.log(`Transcribed voice message: ${transcription?.substring(0, 50)}...`);
		} catch (error) {
			this.logger.error('Transcription failed:', error);
		}

		const [item] = await this.db
			.insert(projectItems)
			.values({
				projectId,
				type: 'voice',
				content: transcription,
				mediaUrl: key,
				mediaMxcUrl: mxcUrl,
				duration,
			})
			.returning();

		this.logger.log(`Saved voice message for project ${projectId}`);
		return item;
	}

	async addTextNote(projectId: string, content: string) {
		const [item] = await this.db
			.insert(projectItems)
			.values({
				projectId,
				type: 'text',
				content,
			})
			.returning();

		this.logger.log(`Saved text note for project ${projectId}`);
		return item;
	}
}
