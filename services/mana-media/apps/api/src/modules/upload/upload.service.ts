import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as mime from 'mime-types';
import * as crypto from 'crypto';
import { eq, and, or, gte, lte, like, isNotNull, sql, desc, asc, inArray } from 'drizzle-orm';
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
	exif?: {
		cameraMake?: string;
		cameraModel?: string;
		dateTaken?: Date;
		focalLength?: string;
		aperture?: string;
		iso?: number;
		exposureTime?: string;
		gpsLatitude?: string;
		gpsLongitude?: string;
	};
	createdAt: Date;
	updatedAt: Date;
}

export interface ListAllOptions {
	userId: string;
	apps?: string[];
	mimeType?: string;
	dateFrom?: Date;
	dateTo?: Date;
	hasLocation?: boolean;
	limit?: number;
	offset?: number;
	sortBy?: 'createdAt' | 'dateTaken' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface ListAllResult {
	items: MediaRecord[];
	total: number;
	hasMore: boolean;
}

export interface StatsResult {
	totalCount: number;
	totalSize: number;
	byApp: Record<string, { count: number; size: number }>;
	byYear: Record<string, number>;
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
				| 'exifData'
				| 'dateTaken'
				| 'cameraMake'
				| 'cameraModel'
				| 'focalLength'
				| 'aperture'
				| 'iso'
				| 'exposureTime'
				| 'gpsLatitude'
				| 'gpsLongitude'
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

	/**
	 * List media across all apps for a user with advanced filtering
	 */
	async listAll(options: ListAllOptions): Promise<ListAllResult> {
		const conditions = [eq(mediaReferences.userId, options.userId)];

		// Filter by multiple apps
		if (options.apps && options.apps.length > 0) {
			conditions.push(inArray(mediaReferences.app, options.apps));
		}

		// Filter by MIME type (supports wildcards like "image/*")
		if (options.mimeType) {
			if (options.mimeType.endsWith('/*')) {
				const prefix = options.mimeType.slice(0, -1);
				conditions.push(like(media.mimeType, `${prefix}%`));
			} else {
				conditions.push(eq(media.mimeType, options.mimeType));
			}
		}

		// Filter by date range
		if (options.dateFrom) {
			conditions.push(gte(media.createdAt, options.dateFrom));
		}
		if (options.dateTo) {
			conditions.push(lte(media.createdAt, options.dateTo));
		}

		// Filter by location
		if (options.hasLocation) {
			conditions.push(isNotNull(media.gpsLatitude));
			conditions.push(isNotNull(media.gpsLongitude));
		}

		// Only show ready media
		conditions.push(eq(media.status, 'ready'));

		// Build order by
		const orderColumn =
			options.sortBy === 'dateTaken'
				? media.dateTaken
				: options.sortBy === 'size'
					? media.size
					: media.createdAt;
		const orderFn = options.sortOrder === 'asc' ? asc : desc;

		// Get total count
		const countResult = await this.db
			.select({ count: sql<number>`count(distinct ${media.id})` })
			.from(media)
			.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
			.where(and(...conditions));
		const total = Number(countResult[0]?.count || 0);

		// Get paginated results
		const limit = options.limit || 50;
		const offset = options.offset || 0;

		const results = await this.db
			.selectDistinct({ media: media })
			.from(media)
			.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
			.where(and(...conditions))
			.orderBy(orderFn(orderColumn))
			.limit(limit)
			.offset(offset);

		return {
			items: results.map((r) => this.toMediaRecord(r.media)),
			total,
			hasMore: offset + results.length < total,
		};
	}

	/**
	 * Get media statistics for a user
	 */
	async getStats(userId: string): Promise<StatsResult> {
		// Total count and size
		const totalResult = await this.db
			.select({
				count: sql<number>`count(distinct ${media.id})`,
				size: sql<number>`sum(${media.size})`,
			})
			.from(media)
			.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
			.where(eq(mediaReferences.userId, userId));

		// By app
		const byAppResult = await this.db
			.select({
				app: mediaReferences.app,
				count: sql<number>`count(distinct ${media.id})`,
				size: sql<number>`sum(${media.size})`,
			})
			.from(media)
			.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
			.where(eq(mediaReferences.userId, userId))
			.groupBy(mediaReferences.app);

		// By year
		const byYearResult = await this.db
			.select({
				year: sql<string>`extract(year from ${media.createdAt})::text`,
				count: sql<number>`count(distinct ${media.id})`,
			})
			.from(media)
			.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
			.where(eq(mediaReferences.userId, userId))
			.groupBy(sql`extract(year from ${media.createdAt})`);

		const byApp: Record<string, { count: number; size: number }> = {};
		for (const row of byAppResult) {
			byApp[row.app] = { count: Number(row.count), size: Number(row.size) };
		}

		const byYear: Record<string, number> = {};
		for (const row of byYearResult) {
			byYear[row.year] = Number(row.count);
		}

		return {
			totalCount: Number(totalResult[0]?.count || 0),
			totalSize: Number(totalResult[0]?.size || 0),
			byApp,
			byYear,
		};
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
			exif:
				m.cameraMake || m.dateTaken || m.gpsLatitude
					? {
							cameraMake: m.cameraMake || undefined,
							cameraModel: m.cameraModel || undefined,
							dateTaken: m.dateTaken || undefined,
							focalLength: m.focalLength || undefined,
							aperture: m.aperture || undefined,
							iso: m.iso || undefined,
							exposureTime: m.exposureTime || undefined,
							gpsLatitude: m.gpsLatitude || undefined,
							gpsLongitude: m.gpsLongitude || undefined,
						}
					: undefined,
			createdAt: m.createdAt,
			updatedAt: m.updatedAt,
		};
	}
}
