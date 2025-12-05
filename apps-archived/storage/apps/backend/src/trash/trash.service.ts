import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { files, folders } from '../db/schema';
import type { File, Folder } from '../db/schema';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class TrashService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private storageService: StorageService
	) {}

	async findAll(userId: string): Promise<{ files: File[]; folders: Folder[] }> {
		const trashedFiles = await this.db
			.select()
			.from(files)
			.where(and(eq(files.userId, userId), eq(files.isDeleted, true)));

		const trashedFolders = await this.db
			.select()
			.from(folders)
			.where(and(eq(folders.userId, userId), eq(folders.isDeleted, true)));

		return { files: trashedFiles, folders: trashedFolders };
	}

	async restoreFile(userId: string, id: string): Promise<File> {
		const result = await this.db
			.update(files)
			.set({
				isDeleted: false,
				deletedAt: null,
				updatedAt: new Date(),
			})
			.where(and(eq(files.id, id), eq(files.userId, userId)))
			.returning();

		if (result.length === 0) {
			throw new NotFoundException('File not found in trash');
		}

		return result[0];
	}

	async restoreFolder(userId: string, id: string): Promise<Folder> {
		const result = await this.db
			.update(folders)
			.set({
				isDeleted: false,
				deletedAt: null,
				updatedAt: new Date(),
			})
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		if (result.length === 0) {
			throw new NotFoundException('Folder not found in trash');
		}

		return result[0];
	}

	async permanentlyDeleteFile(userId: string, id: string): Promise<void> {
		const file = await this.db
			.select()
			.from(files)
			.where(and(eq(files.id, id), eq(files.userId, userId), eq(files.isDeleted, true)));

		if (file.length === 0) {
			throw new NotFoundException('File not found in trash');
		}

		// Delete from S3
		await this.storageService.deleteFile(file[0].storageKey);

		// Delete from database
		await this.db.delete(files).where(eq(files.id, id));
	}

	async permanentlyDeleteFolder(userId: string, id: string): Promise<void> {
		await this.db
			.delete(folders)
			.where(and(eq(folders.id, id), eq(folders.userId, userId), eq(folders.isDeleted, true)));
	}

	async emptyTrash(userId: string): Promise<void> {
		// Get all trashed files to delete from S3
		const trashedFiles = await this.db
			.select()
			.from(files)
			.where(and(eq(files.userId, userId), eq(files.isDeleted, true)));

		// Delete from S3
		for (const file of trashedFiles) {
			await this.storageService.deleteFile(file.storageKey);
		}

		// Delete from database
		await this.db.delete(files).where(and(eq(files.userId, userId), eq(files.isDeleted, true)));
		await this.db
			.delete(folders)
			.where(and(eq(folders.userId, userId), eq(folders.isDeleted, true)));
	}
}
