import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { reviews } from '../db/schema';
import type { Review } from '../db/schema';

export interface ReviewStats {
	averageRating: number;
	totalReviews: number;
}

@Injectable()
export class ReviewService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByLocationId(locationId: string): Promise<Review[]> {
		return this.db
			.select()
			.from(reviews)
			.where(eq(reviews.locationId, locationId))
			.orderBy(desc(reviews.createdAt));
	}

	async getStats(locationId: string): Promise<ReviewStats> {
		const [result] = await this.db
			.select({
				averageRating: sql<number>`coalesce(round(avg(${reviews.rating})::numeric, 1), 0)::float`,
				totalReviews: sql<number>`count(*)::int`,
			})
			.from(reviews)
			.where(eq(reviews.locationId, locationId));

		return result || { averageRating: 0, totalReviews: 0 };
	}

	async getStatsForLocations(locationIds: string[]): Promise<Record<string, ReviewStats>> {
		if (locationIds.length === 0) return {};

		const results = await this.db
			.select({
				locationId: reviews.locationId,
				averageRating: sql<number>`round(avg(${reviews.rating})::numeric, 1)::float`,
				totalReviews: sql<number>`count(*)::int`,
			})
			.from(reviews)
			.where(
				sql`${reviews.locationId} = ANY(${sql.raw(`ARRAY[${locationIds.map((id) => `'${id}'::uuid`).join(',')}]`)})`
			)
			.groupBy(reviews.locationId);

		const map: Record<string, ReviewStats> = {};
		for (const r of results) {
			map[r.locationId] = { averageRating: r.averageRating, totalReviews: r.totalReviews };
		}
		return map;
	}

	async create(
		userId: string,
		locationId: string,
		rating: number,
		comment?: string
	): Promise<Review> {
		const existing = await this.db
			.select()
			.from(reviews)
			.where(and(eq(reviews.userId, userId), eq(reviews.locationId, locationId)));

		if (existing.length > 0) {
			throw new ConflictException('You have already reviewed this location');
		}

		const [review] = await this.db
			.insert(reviews)
			.values({
				userId,
				locationId,
				rating: Math.min(5, Math.max(1, rating)),
				comment: comment || null,
			})
			.returning();
		return review;
	}

	async delete(userId: string, locationId: string): Promise<void> {
		await this.db
			.delete(reviews)
			.where(and(eq(reviews.userId, userId), eq(reviews.locationId, locationId)));
	}
}
