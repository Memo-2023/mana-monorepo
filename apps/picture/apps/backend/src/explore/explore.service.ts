import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, isNull, desc, ilike } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { images } from '../db/schema';
import type { Image } from '../db/schema';
import { GetPublicImagesDto, SearchPublicImagesDto } from './dto/explore.dto';

@Injectable()
export class ExploreService {
	private readonly logger = new Logger(ExploreService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getPublicImages(query: GetPublicImagesDto): Promise<Image[]> {
		try {
			const { page = 1, limit = 20, sortBy = 'recent' } = query;
			const offset = (page - 1) * limit;

			const conditions = [eq(images.isPublic, true), isNull(images.archivedAt)];

			let orderBy;
			switch (sortBy) {
				case 'popular':
					orderBy = desc(images.downloadCount);
					break;
				case 'trending':
					// For trending, we could implement a more complex algorithm
					// For now, just use recent with some weight on downloads
					orderBy = desc(images.createdAt);
					break;
				case 'recent':
				default:
					orderBy = desc(images.createdAt);
			}

			const result = await this.db
				.select()
				.from(images)
				.where(and(...conditions))
				.orderBy(orderBy)
				.limit(limit)
				.offset(offset);

			return result;
		} catch (error) {
			this.logger.error('Error fetching public images', error);
			throw error;
		}
	}

	async searchPublicImages(query: SearchPublicImagesDto): Promise<Image[]> {
		try {
			const { searchTerm, page = 1, limit = 20 } = query;
			const offset = (page - 1) * limit;

			if (!searchTerm || searchTerm.trim().length === 0) {
				return this.getPublicImages({ page, limit });
			}

			const conditions = [
				eq(images.isPublic, true),
				isNull(images.archivedAt),
				ilike(images.prompt, `%${searchTerm}%`),
			];

			const result = await this.db
				.select()
				.from(images)
				.where(and(...conditions))
				.orderBy(desc(images.createdAt))
				.limit(limit)
				.offset(offset);

			return result;
		} catch (error) {
			this.logger.error('Error searching public images', error);
			throw error;
		}
	}
}
