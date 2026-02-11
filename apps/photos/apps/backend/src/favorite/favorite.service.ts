import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION, Database } from '../db/database.module';
import { favorites, type Favorite } from '../db/schema';

@Injectable()
export class FavoriteService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string, limit = 50, offset = 0): Promise<Favorite[]> {
		return this.db
			.select()
			.from(favorites)
			.where(eq(favorites.userId, userId))
			.orderBy(desc(favorites.createdAt))
			.limit(limit)
			.offset(offset);
	}

	async isFavorited(userId: string, mediaId: string): Promise<boolean> {
		const [result] = await this.db
			.select()
			.from(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.mediaId, mediaId)))
			.limit(1);
		return !!result;
	}

	async getFavoritedIds(userId: string, mediaIds: string[]): Promise<Set<string>> {
		if (mediaIds.length === 0) return new Set();

		const results = await this.db
			.select({ mediaId: favorites.mediaId })
			.from(favorites)
			.where(and(eq(favorites.userId, userId), inArray(favorites.mediaId, mediaIds)));

		return new Set(results.map((r) => r.mediaId));
	}

	async add(userId: string, mediaId: string): Promise<Favorite> {
		const existing = await this.isFavorited(userId, mediaId);
		if (existing) {
			const [result] = await this.db
				.select()
				.from(favorites)
				.where(and(eq(favorites.userId, userId), eq(favorites.mediaId, mediaId)))
				.limit(1);
			return result;
		}

		const [favorite] = await this.db.insert(favorites).values({ userId, mediaId }).returning();
		return favorite;
	}

	async remove(userId: string, mediaId: string): Promise<void> {
		await this.db
			.delete(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.mediaId, mediaId)));
	}

	async toggle(userId: string, mediaId: string): Promise<{ isFavorited: boolean }> {
		const isFavorited = await this.isFavorited(userId, mediaId);
		if (isFavorited) {
			await this.remove(userId, mediaId);
			return { isFavorited: false };
		} else {
			await this.add(userId, mediaId);
			return { isFavorited: true };
		}
	}
}
