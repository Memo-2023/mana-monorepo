import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { favorites } from '../db/schema';
import type { Favorite } from '../db/schema';

@Injectable()
export class FavoriteService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<Favorite[]> {
		return this.db.select().from(favorites).where(eq(favorites.userId, userId));
	}

	async add(userId: string, locationId: string): Promise<Favorite> {
		const existing = await this.db
			.select()
			.from(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.locationId, locationId)));

		if (existing.length > 0) {
			throw new ConflictException('Location already in favorites');
		}

		const [favorite] = await this.db.insert(favorites).values({ userId, locationId }).returning();
		return favorite;
	}

	async remove(userId: string, locationId: string): Promise<void> {
		await this.db
			.delete(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.locationId, locationId)));
	}

	async isFavorite(userId: string, locationId: string): Promise<boolean> {
		const result = await this.db
			.select()
			.from(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.locationId, locationId)));
		return result.length > 0;
	}
}
