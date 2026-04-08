import { Queue } from 'bullmq';
import * as mime from 'mime-types';
import * as crypto from 'crypto';
import { eq, and, gte, lte, like, isNotNull, sql, desc, asc, inArray } from 'drizzle-orm';
import type { Database } from '../db';
import { StorageService } from './storage';
import { PROCESS_QUEUE } from '../constants';
import {
	media,
	mediaReferences,
	type Media,
	type NewMedia,
	type NewMediaReference,
} from '../db/schema';

export interface MediaRecord {
	id: string;
	originalName: string | null;
	mimeType: string;
	size: number;
	hash: string;
	status: 'uploading' | 'processing' | 'ready' | 'failed';
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

export class UploadService {
	constructor(
		private db: Database,
		private storage: StorageService,
		private processQueue: Queue
	) {}

	async upload(
		buffer: Buffer,
		originalname: string,
		mimetype: string,
		fileSize: number,
		options?: { app?: string; userId?: string; skipProcessing?: boolean }
	): Promise<MediaRecord> {
		const hash = this.computeHash(buffer);

		const existing = await this.findByHash(hash);
		if (existing) {
			if (options?.userId && options?.app) {
				await this.createReference(existing.id, options.userId, options.app);
			}
			return this.toMediaRecord(existing);
		}

		const ext = mime.extension(mimetype) || 'bin';
		const date = new Date();
		const datePath = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
		const id = crypto.randomUUID();
		const originalKey = `originals/${datePath}/${id}.${ext}`;

		await this.storage.upload(originalKey, buffer, mimetype, {
			'x-amz-meta-original-name': originalname,
			'x-amz-meta-media-id': id,
		});

		const [inserted] = await this.db
			.insert(media)
			.values({
				id,
				contentHash: hash,
				originalName: originalname,
				mimeType: mimetype,
				size: fileSize,
				originalKey,
				status: options?.skipProcessing ? 'ready' : 'processing',
			} satisfies NewMedia)
			.returning();

		if (options?.userId && options?.app) {
			await this.createReference(inserted.id, options.userId, options.app);
		}

		if (!options?.skipProcessing) {
			await this.processQueue.add('process-media', {
				mediaId: inserted.id,
				mimeType: mimetype,
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
			.set({ ...updates, updatedAt: new Date() })
			.where(eq(media.id, id))
			.returning();
		return updated ? this.toMediaRecord(updated) : null;
	}

	async delete(id: string): Promise<boolean> {
		const [record] = await this.db.select().from(media).where(eq(media.id, id)).limit(1);
		if (!record) return false;

		const keys = [
			record.originalKey,
			record.thumbnailKey,
			record.mediumKey,
			record.largeKey,
		].filter(Boolean) as string[];
		for (const key of keys) {
			await this.storage.delete(key).catch(() => {});
		}

		await this.db.delete(media).where(eq(media.id, id));
		return true;
	}

	async list(options?: { app?: string; userId?: string; limit?: number }): Promise<MediaRecord[]> {
		if (options?.userId || options?.app) {
			const conditions = [];
			if (options.userId) conditions.push(eq(mediaReferences.userId, options.userId));
			if (options.app) conditions.push(eq(mediaReferences.app, options.app));

			const results = await this.db
				.select({ media: media })
				.from(media)
				.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
				.where(conditions.length === 1 ? conditions[0] : and(...conditions))
				.limit(options.limit || 50);

			return results.map((r) => this.toMediaRecord(r.media));
		}

		const results = await this.db
			.select()
			.from(media)
			.orderBy(media.createdAt)
			.limit(options?.limit || 50);
		return results.map((r) => this.toMediaRecord(r));
	}

	async listAll(options: ListAllOptions): Promise<ListAllResult> {
		const conditions = [eq(mediaReferences.userId, options.userId)];

		if (options.apps && options.apps.length > 0) {
			conditions.push(inArray(mediaReferences.app, options.apps));
		}
		if (options.mimeType) {
			if (options.mimeType.endsWith('/*')) {
				conditions.push(like(media.mimeType, `${options.mimeType.slice(0, -1)}%`));
			} else {
				conditions.push(eq(media.mimeType, options.mimeType));
			}
		}
		if (options.dateFrom) conditions.push(gte(media.createdAt, options.dateFrom));
		if (options.dateTo) conditions.push(lte(media.createdAt, options.dateTo));
		if (options.hasLocation) {
			conditions.push(isNotNull(media.gpsLatitude));
			conditions.push(isNotNull(media.gpsLongitude));
		}
		conditions.push(eq(media.status, 'ready'));

		const orderColumn =
			options.sortBy === 'dateTaken'
				? media.dateTaken
				: options.sortBy === 'size'
					? media.size
					: media.createdAt;
		const orderFn = options.sortOrder === 'asc' ? asc : desc;

		const countResult = await this.db
			.select({ count: sql<number>`count(distinct ${media.id})` })
			.from(media)
			.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
			.where(and(...conditions));
		const total = Number(countResult[0]?.count || 0);

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

	async getStats(userId: string): Promise<StatsResult> {
		const totalResult = await this.db
			.select({
				count: sql<number>`count(distinct ${media.id})`,
				size: sql<number>`sum(${media.size})`,
			})
			.from(media)
			.innerJoin(mediaReferences, eq(media.id, mediaReferences.mediaId))
			.where(eq(mediaReferences.userId, userId));

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
