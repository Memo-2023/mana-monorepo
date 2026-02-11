import { Injectable, Logger } from '@nestjs/common';
import { FavoriteService } from '../favorite/favorite.service';
import { TagService } from '../tag/tag.service';
import type { Tag } from '../db/schema';

export interface MediaItem {
	id: string;
	status: string;
	originalName: string | null;
	mimeType: string;
	size: number;
	hash: string;
	urls: {
		original: string;
		thumbnail?: string;
		medium?: string;
		large?: string;
	};
	metadata?: {
		width?: number;
		height?: number;
		format?: string;
	};
	exif?: {
		cameraMake?: string;
		cameraModel?: string;
		dateTaken?: string;
		focalLength?: string;
		aperture?: string;
		iso?: number;
		exposureTime?: string;
		gpsLatitude?: string;
		gpsLongitude?: string;
	};
	createdAt: string;
}

export interface EnrichedPhoto extends MediaItem {
	isFavorited: boolean;
	tags: Tag[];
}

export interface ListPhotosParams {
	apps?: string[];
	mimeType?: string;
	dateFrom?: string;
	dateTo?: string;
	hasLocation?: boolean;
	limit?: number;
	offset?: number;
	sortBy?: 'createdAt' | 'dateTaken' | 'size';
	sortOrder?: 'asc' | 'desc';
}

export interface ListPhotosResult {
	items: EnrichedPhoto[];
	total: number;
	hasMore: boolean;
}

export interface PhotoStats {
	totalCount: number;
	totalSize: number;
	byApp: Record<string, { count: number; size: number }>;
	byYear: Record<string, number>;
}

@Injectable()
export class PhotoService {
	private readonly logger = new Logger(PhotoService.name);
	private readonly manaMediaUrl: string;

	constructor(
		private favoriteService: FavoriteService,
		private tagService: TagService
	) {
		this.manaMediaUrl = process.env.MANA_MEDIA_URL || 'http://localhost:3015';
	}

	async listPhotos(userId: string, params: ListPhotosParams): Promise<ListPhotosResult> {
		const queryParams = new URLSearchParams();
		queryParams.set('userId', userId);

		if (params.apps?.length) {
			queryParams.set('apps', params.apps.join(','));
		}
		if (params.mimeType) {
			queryParams.set('mimeType', params.mimeType);
		}
		if (params.dateFrom) {
			queryParams.set('dateFrom', params.dateFrom);
		}
		if (params.dateTo) {
			queryParams.set('dateTo', params.dateTo);
		}
		if (params.hasLocation) {
			queryParams.set('hasLocation', 'true');
		}
		if (params.limit) {
			queryParams.set('limit', String(params.limit));
		}
		if (params.offset) {
			queryParams.set('offset', String(params.offset));
		}
		if (params.sortBy) {
			queryParams.set('sortBy', params.sortBy);
		}
		if (params.sortOrder) {
			queryParams.set('sortOrder', params.sortOrder);
		}

		try {
			const response = await fetch(
				`${this.manaMediaUrl}/api/v1/media/list/all?${queryParams.toString()}`
			);

			if (!response.ok) {
				this.logger.error(`Failed to fetch photos from mana-media: ${response.status}`);
				return { items: [], total: 0, hasMore: false };
			}

			const data = await response.json();
			const mediaItems: MediaItem[] = data.items || [];

			// Enrich with local data
			const enriched = await this.enrichPhotos(userId, mediaItems);

			return {
				items: enriched,
				total: data.total || 0,
				hasMore: data.hasMore || false,
			};
		} catch (error) {
			this.logger.error('Failed to fetch photos from mana-media', error);
			return { items: [], total: 0, hasMore: false };
		}
	}

	async getPhoto(userId: string, mediaId: string): Promise<EnrichedPhoto | null> {
		try {
			const response = await fetch(`${this.manaMediaUrl}/api/v1/media/${mediaId}`);

			if (!response.ok) {
				return null;
			}

			const mediaItem: MediaItem = await response.json();
			const [enriched] = await this.enrichPhotos(userId, [mediaItem]);
			return enriched;
		} catch (error) {
			this.logger.error(`Failed to fetch photo ${mediaId} from mana-media`, error);
			return null;
		}
	}

	async getStats(userId: string): Promise<PhotoStats> {
		try {
			const response = await fetch(`${this.manaMediaUrl}/api/v1/media/stats?userId=${userId}`);

			if (!response.ok) {
				return { totalCount: 0, totalSize: 0, byApp: {}, byYear: {} };
			}

			return response.json();
		} catch (error) {
			this.logger.error('Failed to fetch stats from mana-media', error);
			return { totalCount: 0, totalSize: 0, byApp: {}, byYear: {} };
		}
	}

	private async enrichPhotos(userId: string, items: MediaItem[]): Promise<EnrichedPhoto[]> {
		if (items.length === 0) return [];

		const mediaIds = items.map((i) => i.id);

		// Fetch favorites and tags in parallel
		const [favoritedIds, tagsMap] = await Promise.all([
			this.favoriteService.getFavoritedIds(userId, mediaIds),
			this.tagService.getTagsForPhotos(mediaIds),
		]);

		return items.map((item) => ({
			...item,
			isFavorited: favoritedIds.has(item.id),
			tags: tagsMap.get(item.id) || [],
		}));
	}
}
