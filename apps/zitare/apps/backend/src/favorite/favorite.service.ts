import { Injectable, Inject } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { favorites } from '../db/schema';
import type { Favorite, NewFavorite } from '../db/schema';

@Injectable()
export class FavoriteService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<Favorite[]> {
		return this.db.select().from(favorites).where(eq(favorites.userId, userId));
	}

	async create(data: NewFavorite): Promise<Favorite> {
		const [favorite] = await this.db.insert(favorites).values(data).returning();
		return favorite;
	}

	async delete(userId: string, quoteId: string): Promise<void> {
		await this.db
			.delete(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.quoteId, quoteId)));
	}

	async exists(userId: string, quoteId: string): Promise<boolean> {
		const result = await this.db
			.select()
			.from(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.quoteId, quoteId)));
		return result.length > 0;
	}
}
