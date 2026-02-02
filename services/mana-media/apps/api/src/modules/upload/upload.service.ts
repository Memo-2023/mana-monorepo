import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as mime from 'mime-types';
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { StorageService } from '../storage/storage.service';
import { MatrixService } from '../matrix/matrix.service';
import { PROCESS_QUEUE } from '../process/process.constants';
import { DATABASE_CONNECTION } from '../../db/database.module';
import type { Database } from '../../db/connection';
import {
	media,
	mediaReferences,
	type Media,
	type NewMedia,
	type NewMediaReference,
} from '../../db/schema';

export interface MediaRecord {
	id: string;
	originalName: string | null;
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
	metadata?: {
		width?: number;
		height?: number;
		format?: string;
		hasAlpha?: boolean;
	};
	createdAt: Date;
	updatedAt: Date;
}

@Injectable()
export class UploadService {
	constructor(
		private storage: StorageService,
		private matrixService: MatrixService,
		@InjectQueue(PROCESS_QUEUE) private processQueue: Queue,
		@Inject(DATABASE_CONNECTION) private db: Database
	) {}

	async upload(
		file: Express.Multer.File,
		options?: {
			app?: string;
			userId?: string;
			skipProcessing?: boolean;
		}
	): Promise<MediaRecord> {
		const hash = this.computeHash(file.buffer);

		// Check for existing media with same content hash
		const existing = await this.findByHash(hash);
		if (existing) {
			// If userId and app provided, create a reference
			if (options?.userId && options?.app) {
				await this.createReference(existing.id, options.userId, options.app);
			}
			return this.toMediaRecord(existing);
		}

		// Generate storage key
		const ext = mime.extension(file.mimetype) || 'bin';
		const date = new Date();
		const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
		const id = crypto.randomUUID();
		const originalKey = `originals/${datePath}/${id}.${ext}`;

		// Upload to storage
		await this.storage.upload(originalKey, file.buffer, file.mimetype, {
			'x-amz-meta-original-name': file.originalname,
			'x-amz-meta-media-id': id,
		});

		// Insert into database
		const [inserted] = await this.db
			.insert(media)
			.values({
				id,
				contentHash: hash,
				originalName: file.originalname,
				mimeType: file.mimetype,
				size: file.size,
				originalKey,
				status: options?.skipProcessing ? 'ready' : 'processing',
			} satisfies NewMedia)
			.returning();

		// Create reference if user provided
		if (options?.userId && options?.app) {
			await this.createReference(inserted.id, options.userId, options.app);
		}

		// Queue processing job
		if (!options?.skipProcessing) {
			await this.processQueue.add('process-media', {
				mediaId: inserted.id,
				mimeType: file.mimetype,
				originalKey,
			});
		}

		return this.toMediaRecord(inserted);
	}

	/**
	 * Import media from a Matrix MXC URL
	 */
	async importFromMatrix(
		mxcUrl: string,
		options: {
			app: string;
			userId: string;
			skipProcessing?: boolean;
		}
	): Promise<MediaRecord | null> {
		// Download from Matrix
		const matrixMedia = await this.matrixService.downloadFromMxc(mxcUrl);
		if (!matrixMedia) {
			return null;
		}

		const hash = this.computeHash(matrixMedia.buffer);

		// Check for existing media
		const existing = await this.findByHash(hash);
		if (existing) {
			// Create reference with source URL
			await this.createReference(existing.id, options.userId, options.app, mxcUrl);
			return this.toMediaRecord(existing);
		}

		// Generate storage key
		const ext = mime.extension(matrixMedia.mimeType) || 'bin';
		const date = new Date();
		const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
		const id = crypto.randomUUID();
		const originalKey = `originals/${datePath}/${id}.${ext}`;

		// Upload to storage
		await this.storage.upload(originalKey, matrixMedia.buffer, matrixMedia.mimeType, {
			'x-amz-meta-source': 'matrix',
			'x-amz-meta-source-url': mxcUrl,
			'x-amz-meta-media-id': id,
		});

		// Insert into database
		const [inserted] = await this.db
			.insert(media)
			.values({
				id,
				contentHash: hash,
				originalName: matrixMedia.filename || null,
				mimeType: matrixMedia.mimeType,
				size: matrixMedia.size,
				originalKey,
				status: options?.skipProcessing ? 'ready' : 'processing',
			} satisfies NewMedia)
			.returning();

		// Create reference with source URL
		await this.createReference(inserted.id, options.userId, options.app, mxcUrl);

		// Queue processing job
		if (!options?.skipProcessing) {
			await this.processQueue.add('process-media', {
				mediaId: inserted.id,
				mimeType: matrixMedia.mimeType,
				originalKey,
			});
		}

		return this.toMediaRecord(inserted);
	}

	async get(id: string): Promise<MediaRecord | null> {
		const [result] = await this.db.select().from(media).where(eq(media.id, id)).limit(1);
		return result ? this.toMediaRecord(result) : null;
	}

	async getByHash(hash: string): Promise<MediaRecord | null> {
		const result = await this.findByHash(hash);
		return result ? this.toMediaRecord(result) : null;
	}

	async update(
		id: string,
		updates: Partial<
			Pick<
				Media,
				| 'status'
				| 'thumbnailKey'
				| 'mediumKey'
				| 'largeKey'
				| 'width'
				| 'height'
				| 'format'
				| 'hasAlpha'
			>
		>
	): Promise<MediaRecord | null> {
		const [updated] = await this.db
			.update(media)
			.set({
				...updates,
				updatedAt: new Date(),
			})
			.where(eq(media.id, id))
			.returning();

		return updated ? this.toMediaRecord(updated) : null;
	}

	async delete(id: string): Promise<boolean> {
		const [record] = await this.db.select().from(media).where(eq(media.id, id)).limit(1);
		if (!record) return false;

		// Delete all associated storage files
		const keys = [
			record.originalKey,
			record.thumbnailKey,
			record.mediumKey,
			record.largeKey,
		].filter(Boolean) as string[];
		for (const key of keys) {
			await this.storage.delete(key).catch(() => {});
		}

		// Delete from database (references will cascade)
		await this.db.delete(media).where(eq(media.id, id));
		return true;
	}

	async list(options?: { app?: string; userId?: string; limit?: number }): Promise<MediaRecord[]> {
		// If filtering by user/app, we need to join with references
		if (options?.userId || options?.app) {
			const query = this.db
				.select({ media: media })
				.from(media)
				.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId));

			// Build conditions
			const conditions = [];
			if (options.userId) {
				conditions.push(eq(mediaReferences.userId, options.userId));
			}
			if (options.app) {
				conditions.push(eq(mediaReferences.app, options.app));
			}

			const results = await query
				.where(conditions.length === 1 ? conditions[0] : undefined)
				.limit(options.limit || 50);

			return results.map((r) => this.toMediaRecord(r.media));
		}

		// Simple list without filtering
		const results = await this.db
			.select()
			.from(media)
			.orderBy(media.createdAt)
			.limit(options?.limit || 50);

		return results.map((r) => this.toMediaRecord(r));
	}

	private async findByHash(hash: string): Promise<Media | null> {
		const [result] = await this.db.select().from(media).where(eq(media.contentHash, hash)).limit(1);
		return result || null;
	}

	private async createReference(
		mediaId: string,
		userId: string,
		app: string,
		sourceUrl?: string
	): Promise<void> {
		await this.db.insert(mediaReferences).values({
			mediaId,
			userId,
			app,
			sourceUrl: sourceUrl || null,
		} satisfies NewMediaReference);
	}

	private computeHash(buffer: Buffer): string {
		return crypto.createHash('sha256').update(buffer).digest('hex');
	}

	private toMediaRecord(m: Media): MediaRecord {
		return {
			id: m.id,
			originalName: m.originalName,
			mimeType: m.mimeType,
			size: Number(m.size),
			hash: m.contentHash,
			status: m.status as MediaRecord['status'],
			keys: {
				original: m.originalKey,
				thumbnail: m.thumbnailKey || undefined,
				medium: m.mediumKey || undefined,
				large: m.largeKey || undefined,
			},
			metadata: m.width
				? {
						width: m.width || undefined,
						height: m.height || undefined,
						format: m.format || undefined,
						hasAlpha: m.hasAlpha || undefined,
					}
				: undefined,
			createdAt: m.createdAt,
			updatedAt: m.updatedAt,
		};
	}
}
