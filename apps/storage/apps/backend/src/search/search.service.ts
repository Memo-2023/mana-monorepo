import { Injectable, Inject } from '@nestjs/common';
import { eq, and, ilike, or } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { files, folders, type File, type Folder } from '../db/schema';

@Injectable()
export class SearchService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async search(userId: string, query: string): Promise<{ files: File[]; folders: Folder[] }> {
		const searchPattern = `%${query}%`;

		const matchingFiles = await this.db
			.select()
			.from(files)
			.where(
				and(
					eq(files.userId, userId),
					eq(files.isDeleted, false),
					or(ilike(files.name, searchPattern), ilike(files.originalName, searchPattern))
				)
			)
			.limit(50);

		const matchingFolders = await this.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.userId, userId),
					eq(folders.isDeleted, false),
					or(ilike(folders.name, searchPattern), ilike(folders.description, searchPattern))
				)
			)
			.limit(50);

		return { files: matchingFiles, folders: matchingFolders };
	}

	async getFavorites(userId: string): Promise<{ files: File[]; folders: Folder[] }> {
		const favoriteFiles = await this.db
			.select()
			.from(files)
			.where(and(eq(files.userId, userId), eq(files.isDeleted, false), eq(files.isFavorite, true)));

		const favoriteFolders = await this.db
			.select()
			.from(folders)
			.where(and(eq(folders.userId, userId), eq(folders.isDeleted, false), eq(folders.isFavorite, true)));

		return { files: favoriteFiles, folders: favoriteFolders };
	}
}
