import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { beats, projects, markers, libraryBeats } from '../db/schema';
import type { Beat, Marker, LibraryBeat } from '../db/schema';
import {
	createMukkeStorage,
	generateUserFileKey,
	getContentType,
	type StorageClient,
} from '@manacore/shared-storage';
import { SttService } from '../stt/stt.service';
import { LyricsService } from '../lyrics/lyrics.service';

@Injectable()
export class BeatService {
	private readonly logger = new Logger(BeatService.name);
	private storage: StorageClient;

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private sttService: SttService,
		private lyricsService: LyricsService
	) {
		this.storage = createMukkeStorage();
	}

	async findByProjectId(projectId: string): Promise<Beat | null> {
		const [beat] = await this.db.select().from(beats).where(eq(beats.projectId, projectId));
		return beat || null;
	}

	async findById(id: string): Promise<Beat | null> {
		const [beat] = await this.db.select().from(beats).where(eq(beats.id, id));
		return beat || null;
	}

	async findByIdOrThrow(id: string): Promise<Beat> {
		const beat = await this.findById(id);
		if (!beat) {
			throw new NotFoundException('Beat not found');
		}
		return beat;
	}

	async verifyProjectOwnership(projectId: string, userId: string): Promise<void> {
		const [project] = await this.db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
		if (!project) {
			throw new NotFoundException('Project not found');
		}
	}

	async createUploadUrl(
		projectId: string,
		userId: string,
		filename: string
	): Promise<{ beat: Beat; uploadUrl: string }> {
		await this.verifyProjectOwnership(projectId, userId);

		// Check if beat already exists for this project
		const existingBeat = await this.findByProjectId(projectId);
		if (existingBeat) {
			throw new BadRequestException('Beat already exists for this project. Delete it first.');
		}

		const key = generateUserFileKey(userId, filename);
		const contentType = getContentType(filename);

		if (!contentType.startsWith('audio/') && !['application/octet-stream'].includes(contentType)) {
			throw new BadRequestException('Invalid file type. Only audio files are allowed.');
		}

		// Create beat record
		const [beat] = await this.db
			.insert(beats)
			.values({
				projectId,
				storagePath: key,
				filename,
			})
			.returning();

		// Generate presigned upload URL
		const uploadUrl = await this.storage.getUploadUrl(key, {
			expiresIn: 3600,
		});

		return { beat, uploadUrl };
	}

	async updateBeatMetadata(
		id: string,
		userId: string,
		data: {
			duration?: number;
			bpm?: number;
			bpmConfidence?: number;
			waveformData?: unknown;
		}
	): Promise<Beat> {
		const beat = await this.findByIdOrThrow(id);
		await this.verifyProjectOwnership(beat.projectId, userId);

		const [updatedBeat] = await this.db.update(beats).set(data).where(eq(beats.id, id)).returning();
		return updatedBeat;
	}

	async getDownloadUrl(id: string, userId: string): Promise<string> {
		const beat = await this.findByIdOrThrow(id);
		await this.verifyProjectOwnership(beat.projectId, userId);

		return this.storage.getDownloadUrl(beat.storagePath, { expiresIn: 3600 });
	}

	async delete(id: string, userId: string): Promise<void> {
		const beat = await this.findByIdOrThrow(id);
		await this.verifyProjectOwnership(beat.projectId, userId);

		// Delete from storage
		try {
			await this.storage.delete(beat.storagePath);
		} catch {
			// Ignore storage errors, continue with DB deletion
		}

		// Delete from database (markers will be cascade deleted)
		await this.db.delete(beats).where(eq(beats.id, id));
	}

	async getMarkersForBeat(beatId: string): Promise<Marker[]> {
		return this.db.select().from(markers).where(eq(markers.beatId, beatId));
	}

	// ==================== Library Beats ====================

	async getLibraryBeats(): Promise<LibraryBeat[]> {
		return this.db
			.select()
			.from(libraryBeats)
			.where(eq(libraryBeats.isActive, true))
			.orderBy(libraryBeats.title);
	}

	async getLibraryBeatById(id: string): Promise<LibraryBeat | null> {
		const [beat] = await this.db.select().from(libraryBeats).where(eq(libraryBeats.id, id));
		return beat || null;
	}

	async getLibraryBeatDownloadUrl(id: string): Promise<string> {
		const beat = await this.getLibraryBeatById(id);
		if (!beat) {
			throw new NotFoundException('Library beat not found');
		}
		return this.storage.getDownloadUrl(beat.storagePath, { expiresIn: 3600 });
	}

	async useLibraryBeat(libraryBeatId: string, projectId: string, userId: string): Promise<Beat> {
		await this.verifyProjectOwnership(projectId, userId);

		// Check if beat already exists for this project
		const existingBeat = await this.findByProjectId(projectId);
		if (existingBeat) {
			throw new BadRequestException('Beat already exists for this project. Delete it first.');
		}

		const libraryBeat = await this.getLibraryBeatById(libraryBeatId);
		if (!libraryBeat) {
			throw new NotFoundException('Library beat not found');
		}

		// Create beat record referencing the same storage path
		const [beat] = await this.db
			.insert(beats)
			.values({
				projectId,
				storagePath: libraryBeat.storagePath,
				filename: `${libraryBeat.title}${libraryBeat.artist ? ` - ${libraryBeat.artist}` : ''}.mp3`,
				duration: libraryBeat.duration,
				bpm: libraryBeat.bpm,
			})
			.returning();

		return beat;
	}

	// ==================== STT Transcription ====================

	/**
	 * Check if STT service is available
	 */
	async isSttAvailable(): Promise<boolean> {
		return this.sttService.isAvailable();
	}

	/**
	 * Transcribe beat audio and save lyrics to the project
	 */
	async transcribeBeat(
		beatId: string,
		userId: string
	): Promise<{ beat: Beat; lyrics: string | null }> {
		const beat = await this.findByIdOrThrow(beatId);
		await this.verifyProjectOwnership(beat.projectId, userId);

		// Set status to pending
		await this.db
			.update(beats)
			.set({
				transcriptionStatus: 'pending',
				transcriptionError: null,
			})
			.where(eq(beats.id, beatId));

		try {
			this.logger.log(`Starting transcription for beat ${beatId}`);

			// Download audio from storage
			const audioBuffer = await this.storage.download(beat.storagePath);

			// Call STT service
			const result = await this.sttService.transcribe(audioBuffer, beat.filename || 'audio.mp3');

			// Save transcribed text as lyrics
			const lyricsRecord = await this.lyricsService.createOrUpdate(
				beat.projectId,
				userId,
				result.text
			);

			// Update beat status to completed
			const [updatedBeat] = await this.db
				.update(beats)
				.set({
					transcriptionStatus: 'completed',
					transcribedAt: new Date(),
					transcriptionError: null,
				})
				.where(eq(beats.id, beatId))
				.returning();

			this.logger.log(`Transcription completed for beat ${beatId}: ${result.text.length} chars`);

			return {
				beat: updatedBeat,
				lyrics: lyricsRecord.content,
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Transcription failed for beat ${beatId}: ${errorMessage}`);

			// Update beat status to failed
			await this.db
				.update(beats)
				.set({
					transcriptionStatus: 'failed',
					transcriptionError: errorMessage,
				})
				.where(eq(beats.id, beatId));

			throw error;
		}
	}
}
