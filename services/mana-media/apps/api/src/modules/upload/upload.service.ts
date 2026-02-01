import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuid } from 'uuid';
import * as mime from 'mime-types';
import * as crypto from 'crypto';
import { StorageService } from '../storage/storage.service';
import { PROCESS_QUEUE } from '../process/process.constants';

export interface MediaRecord {
	id: string;
	originalName: string;
	mimeType: string;
	size: number;
	hash: string;
	status: 'uploading' | 'processing' | 'ready' | 'failed';
	app?: string;
	userId?: string;
	keys: {
		original: string;
		thumbnail?: string;
		medium?: string;
		large?: string;
	};
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

// In-memory store for MVP (replace with DB later)
const mediaStore = new Map<string, MediaRecord>();

@Injectable()
export class UploadService {
	constructor(
		private storage: StorageService,
		@InjectQueue(PROCESS_QUEUE) private processQueue: Queue
	) {}

	async upload(
		file: Express.Multer.File,
		options?: {
			app?: string;
			userId?: string;
			skipProcessing?: boolean;
		}
	): Promise<MediaRecord> {
		const id = uuid();
		const ext = mime.extension(file.mimetype) || 'bin';
		const hash = this.computeHash(file.buffer);

		// Check for duplicate
		const existing = this.findByHash(hash);
		if (existing) {
			return existing;
		}

		// Generate storage keys
		const date = new Date();
		const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
		const originalKey = `originals/${datePath}/${id}.${ext}`;

		// Upload original
		await this.storage.upload(originalKey, file.buffer, file.mimetype, {
			'x-amz-meta-original-name': file.originalname,
			'x-amz-meta-media-id': id,
		});

		// Create record
		const record: MediaRecord = {
			id,
			originalName: file.originalname,
			mimeType: file.mimetype,
			size: file.size,
			hash,
			status: options?.skipProcessing ? 'ready' : 'processing',
			app: options?.app,
			userId: options?.userId,
			keys: {
				original: originalKey,
			},
			createdAt: date,
			updatedAt: date,
		};

		mediaStore.set(id, record);

		// Queue processing job
		if (!options?.skipProcessing) {
			await this.processQueue.add('process-media', {
				mediaId: id,
				mimeType: file.mimetype,
				originalKey,
			});
		}

		return record;
	}

	async get(id: string): Promise<MediaRecord | null> {
		return mediaStore.get(id) || null;
	}

	async update(id: string, updates: Partial<MediaRecord>): Promise<MediaRecord | null> {
		const record = mediaStore.get(id);
		if (!record) return null;

		const updated = {
			...record,
			...updates,
			updatedAt: new Date(),
		};
		mediaStore.set(id, updated);
		return updated;
	}

	async delete(id: string): Promise<boolean> {
		const record = mediaStore.get(id);
		if (!record) return false;

		// Delete all associated files
		const keys = Object.values(record.keys).filter(Boolean) as string[];
		for (const key of keys) {
			await this.storage.delete(key).catch(() => {});
		}

		mediaStore.delete(id);
		return true;
	}

	async list(options?: { app?: string; userId?: string; limit?: number }): Promise<MediaRecord[]> {
		let records = Array.from(mediaStore.values());

		if (options?.app) {
			records = records.filter((r) => r.app === options.app);
		}
		if (options?.userId) {
			records = records.filter((r) => r.userId === options.userId);
		}

		records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		if (options?.limit) {
			records = records.slice(0, options.limit);
		}

		return records;
	}

	private computeHash(buffer: Buffer): string {
		return crypto.createHash('sha256').update(buffer).digest('hex');
	}

	private findByHash(hash: string): MediaRecord | undefined {
		return Array.from(mediaStore.values()).find((r) => r.hash === hash);
	}
}
