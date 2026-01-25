import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/db';
import { favoriteMeals, type NewFavoriteMeal } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

@Injectable()
export class FavoritesService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string) {
		return this.db
			.select()
			.from(favoriteMeals)
			.where(eq(favoriteMeals.userId, userId))
			.orderBy(desc(favoriteMeals.usageCount));
	}

	async create(userId: string, data: Omit<NewFavoriteMeal, 'id' | 'userId' | 'usageCount'>) {
		const [favorite] = await this.db
			.insert(favoriteMeals)
			.values({ ...data, userId, usageCount: 0 })
			.returning();
		return favorite;
	}

	async incrementUsage(userId: string, favoriteId: string) {
		const [favorite] = await this.db
			.select()
			.from(favoriteMeals)
			.where(and(eq(favoriteMeals.id, favoriteId), eq(favoriteMeals.userId, userId)))
			.limit(1);

		if (!favorite) return null;

		const [updated] = await this.db
			.update(favoriteMeals)
			.set({ usageCount: favorite.usageCount + 1, updatedAt: new Date() })
			.where(eq(favoriteMeals.id, favoriteId))
			.returning();

		return updated;
	}

	async delete(userId: string, favoriteId: string) {
		const [deleted] = await this.db
			.delete(favoriteMeals)
			.where(and(eq(favoriteMeals.id, favoriteId), eq(favoriteMeals.userId, userId)))
			.returning();
		return deleted;
	}

	async update(userId: string, favoriteId: string, data: Partial<NewFavoriteMeal>) {
		const [updated] = await this.db
			.update(favoriteMeals)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(favoriteMeals.id, favoriteId), eq(favoriteMeals.userId, userId)))
			.returning();
		return updated;
	}
}
