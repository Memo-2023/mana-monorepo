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

	/**
	 * Get user data counts for a specific user
	 */
	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count albums
		const albumsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.albums)
			.where(eq(schema.albums.userId, userId));
		const albumsCount = albumsResult[0]?.count ?? 0;

		// Count album items (through albums)
		const albumItemsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.albumItems)
			.innerJoin(schema.albums, eq(schema.albumItems.albumId, schema.albums.id))
			.where(eq(schema.albums.userId, userId));
		const albumItemsCount = albumItemsResult[0]?.count ?? 0;

		// Count favorites
		const favoritesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.favorites)
			.where(eq(schema.favorites.userId, userId));
		const favoritesCount = favoritesResult[0]?.count ?? 0;

		// Count tags
		const tagsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.tags)
			.where(eq(schema.tags.userId, userId));
		const tagsCount = tagsResult[0]?.count ?? 0;

		// Count photo tags (through tags)
		const photoTagsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.photoTags)
			.innerJoin(schema.tags, eq(schema.photoTags.tagId, schema.tags.id))
			.where(eq(schema.tags.userId, userId));
		const photoTagsCount = photoTagsResult[0]?.count ?? 0;

		// Get last activity (most recent album update)
		const lastAlbum = await this.db
			.select({ updatedAt: schema.albums.updatedAt })
			.from(schema.albums)
			.where(eq(schema.albums.userId, userId))
			.orderBy(desc(schema.albums.updatedAt))
			.limit(1);
		const lastActivityAt = lastAlbum[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'albums', count: albumsCount, label: 'Alben' },
			{ entity: 'album_items', count: albumItemsCount, label: 'Album-Einträge' },
			{ entity: 'favorites', count: favoritesCount, label: 'Favoriten' },
			{ entity: 'tags', count: tagsCount, label: 'Tags' },
			{ entity: 'photo_tags', count: photoTagsCount, label: 'Foto-Tags' },
		];

		const totalCount = albumsCount + albumItemsCount + favoritesCount + tagsCount + photoTagsCount;

		return {
			entities,
			totalCount,
			lastActivityAt,
		};
	}

	/**
	 * Delete all user data (GDPR right to be forgotten)
	 */
	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete favorites
		const deletedFavorites = await this.db
			.delete(schema.favorites)
			.where(eq(schema.favorites.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'favorites',
			count: deletedFavorites.length,
			label: 'Favoriten',
		});
		totalDeleted += deletedFavorites.length;

		// Delete tags (cascades to photo_tags)
		const deletedTags = await this.db
			.delete(schema.tags)
			.where(eq(schema.tags.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'tags',
			count: deletedTags.length,
			label: 'Tags',
		});
		totalDeleted += deletedTags.length;

		// Delete albums (cascades to album_items)
		const deletedAlbums = await this.db
			.delete(schema.albums)
			.where(eq(schema.albums.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'albums',
			count: deletedAlbums.length,
			label: 'Alben',
		});
		totalDeleted += deletedAlbums.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return {
			success: true,
			deletedCounts,
			totalDeleted,
		};
	}
}
