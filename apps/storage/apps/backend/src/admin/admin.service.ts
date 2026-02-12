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

		// Count files
		const filesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.files)
			.where(eq(schema.files.userId, userId));
		const filesCount = filesResult[0]?.count ?? 0;

		// Count folders
		const foldersResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.folders)
			.where(eq(schema.folders.userId, userId));
		const foldersCount = foldersResult[0]?.count ?? 0;

		// Count shares
		const sharesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.shares)
			.where(eq(schema.shares.userId, userId));
		const sharesCount = sharesResult[0]?.count ?? 0;

		// Count tags
		const tagsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.tags)
			.where(eq(schema.tags.userId, userId));
		const tagsCount = tagsResult[0]?.count ?? 0;

		// Count file tags (through files)
		const fileTagsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.fileTags)
			.innerJoin(schema.files, eq(schema.fileTags.fileId, schema.files.id))
			.where(eq(schema.files.userId, userId));
		const fileTagsCount = fileTagsResult[0]?.count ?? 0;

		// Get last activity (most recent file update)
		const lastFile = await this.db
			.select({ updatedAt: schema.files.updatedAt })
			.from(schema.files)
			.where(eq(schema.files.userId, userId))
			.orderBy(desc(schema.files.updatedAt))
			.limit(1);
		const lastActivityAt = lastFile[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'files', count: filesCount, label: 'Dateien' },
			{ entity: 'folders', count: foldersCount, label: 'Ordner' },
			{ entity: 'shares', count: sharesCount, label: 'Freigaben' },
			{ entity: 'tags', count: tagsCount, label: 'Tags' },
			{ entity: 'file_tags', count: fileTagsCount, label: 'Datei-Tags' },
		];

		const totalCount = filesCount + foldersCount + sharesCount + tagsCount + fileTagsCount;

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

		// Delete shares first (references files/folders)
		const deletedShares = await this.db
			.delete(schema.shares)
			.where(eq(schema.shares.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'shares',
			count: deletedShares.length,
			label: 'Freigaben',
		});
		totalDeleted += deletedShares.length;

		// Delete tags (cascades to file_tags)
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

		// Delete files (cascades to file_versions)
		const deletedFiles = await this.db
			.delete(schema.files)
			.where(eq(schema.files.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'files',
			count: deletedFiles.length,
			label: 'Dateien',
		});
		totalDeleted += deletedFiles.length;

		// Delete folders
		const deletedFolders = await this.db
			.delete(schema.folders)
			.where(eq(schema.folders.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'folders',
			count: deletedFolders.length,
			label: 'Ordner',
		});
		totalDeleted += deletedFolders.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return {
			success: true,
			deletedCounts,
			totalDeleted,
		};
	}
}
