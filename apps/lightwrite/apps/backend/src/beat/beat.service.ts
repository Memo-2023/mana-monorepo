import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { beats, projects, markers } from '../db/schema';
import type { Beat, Marker } from '../db/schema';
import {
	createLightWriteStorage,
	generateUserFileKey,
	getContentType,
	type StorageClient,
} from '@manacore/shared-storage';

@Injectable()
export class BeatService {
	private storage: StorageClient;

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {
		this.storage = createLightWriteStorage();
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
}
