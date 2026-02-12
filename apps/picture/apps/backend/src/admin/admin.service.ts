import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
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
		private readonly db: PostgresJsDatabase<typeof schema>
	) {}

	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count images
		const imagesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.images)
			.where(eq(schema.images.userId, userId));
		const imagesCount = imagesResult[0]?.count ?? 0;

		// Count image generations
		const generationsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.imageGenerations)
			.where(eq(schema.imageGenerations.userId, userId));
		const generationsCount = generationsResult[0]?.count ?? 0;

		// Count boards
		const boardsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.boards)
			.where(eq(schema.boards.userId, userId));
		const boardsCount = boardsResult[0]?.count ?? 0;

		// Count image likes
		const likesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.imageLikes)
			.where(eq(schema.imageLikes.userId, userId));
		const likesCount = likesResult[0]?.count ?? 0;

		// Get last activity
		const lastImage = await this.db
			.select({ updatedAt: schema.images.updatedAt })
			.from(schema.images)
			.where(eq(schema.images.userId, userId))
			.orderBy(desc(schema.images.updatedAt))
			.limit(1);
		const lastActivityAt = lastImage[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'images', count: imagesCount, label: 'Images' },
			{ entity: 'image_generations', count: generationsCount, label: 'Image Generations' },
			{ entity: 'boards', count: boardsCount, label: 'Boards' },
			{ entity: 'image_likes', count: likesCount, label: 'Image Likes' },
		];

		const totalCount = imagesCount + generationsCount + boardsCount + likesCount;

		return { entities, totalCount, lastActivityAt };
	}

	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete image likes
		const deletedLikes = await this.db
			.delete(schema.imageLikes)
			.where(eq(schema.imageLikes.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'image_likes', count: deletedLikes.length, label: 'Image Likes' });
		totalDeleted += deletedLikes.length;

		// Delete board items (through boards)
		const userBoards = await this.db
			.select({ id: schema.boards.id })
			.from(schema.boards)
			.where(eq(schema.boards.userId, userId));

		if (userBoards.length > 0) {
			const boardIds = userBoards.map((b) => b.id);
			const deletedBoardItems = await this.db
				.delete(schema.boardItems)
				.where(sql`${schema.boardItems.boardId} IN (${sql.join(boardIds, sql`, `)})`)
				.returning();
			deletedCounts.push({
				entity: 'board_items',
				count: deletedBoardItems.length,
				label: 'Board Items',
			});
			totalDeleted += deletedBoardItems.length;
		}

		// Delete boards
		const deletedBoards = await this.db
			.delete(schema.boards)
			.where(eq(schema.boards.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'boards', count: deletedBoards.length, label: 'Boards' });
		totalDeleted += deletedBoards.length;

		// Delete batch generations
		const deletedBatchGenerations = await this.db
			.delete(schema.batchGenerations)
			.where(eq(schema.batchGenerations.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'batch_generations',
			count: deletedBatchGenerations.length,
			label: 'Batch Generations',
		});
		totalDeleted += deletedBatchGenerations.length;

		// Delete image generations
		const deletedGenerations = await this.db
			.delete(schema.imageGenerations)
			.where(eq(schema.imageGenerations.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'image_generations',
			count: deletedGenerations.length,
			label: 'Image Generations',
		});
		totalDeleted += deletedGenerations.length;

		// Delete images
		const deletedImages = await this.db
			.delete(schema.images)
			.where(eq(schema.images.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'images', count: deletedImages.length, label: 'Images' });
		totalDeleted += deletedImages.length;

		// Delete profiles (profile ID is the user ID)
		const deletedProfiles = await this.db
			.delete(schema.profiles)
			.where(eq(schema.profiles.id, userId))
			.returning();
		deletedCounts.push({ entity: 'profiles', count: deletedProfiles.length, label: 'Profiles' });
		totalDeleted += deletedProfiles.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return { success: true, deletedCounts, totalDeleted };
	}
}
