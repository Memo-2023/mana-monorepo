import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, desc } from 'drizzle-orm';
import * as schema from '../db/schema';
import {
	UserDataResponse,
	DeleteUserDataResponse,
	EntityCount,
} from './dto/user-data-response.dto';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase<typeof schema>
	) {}

	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count favorites
		const favoritesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.favorites)
			.where(eq(schema.favorites.userId, userId));
		const favoritesCount = favoritesResult[0]?.count ?? 0;

		// Count user lists
		const userListsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.userLists)
			.where(eq(schema.userLists.userId, userId));
		const userListsCount = userListsResult[0]?.count ?? 0;

		// Get last activity
		const lastFavorite = await this.db
			.select({ createdAt: schema.favorites.createdAt })
			.from(schema.favorites)
			.where(eq(schema.favorites.userId, userId))
			.orderBy(desc(schema.favorites.createdAt))
			.limit(1);
		const lastActivityAt = lastFavorite[0]?.createdAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'favorites', count: favoritesCount, label: 'Favorites' },
			{ entity: 'user_lists', count: userListsCount, label: 'User Lists' },
		];

		const totalCount = favoritesCount + userListsCount;

		return { entities, totalCount, lastActivityAt };
	}

	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete favorites
		const deletedFavorites = await this.db
			.delete(schema.favorites)
			.where(eq(schema.favorites.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'favorites', count: deletedFavorites.length, label: 'Favorites' });
		totalDeleted += deletedFavorites.length;

		// Delete user lists
		const deletedUserLists = await this.db
			.delete(schema.userLists)
			.where(eq(schema.userLists.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'user_lists',
			count: deletedUserLists.length,
			label: 'User Lists',
		});
		totalDeleted += deletedUserLists.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return { success: true, deletedCounts, totalDeleted };
	}
}
