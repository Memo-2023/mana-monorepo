import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { files, fileVersions } from '../db/schema';
import type { File, NewFile, NewFileVersion } from '../db/schema';
import { StorageService } from '../storage/storage.service';
import { CreateFileDto, UpdateFileDto, MoveFileDto } from './dto/create-file.dto';

@Injectable()
export class FileService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private storageService: StorageService
	) {}

	async findAll(userId: string, parentFolderId?: string): Promise<File[]> {
		if (parentFolderId) {
			return this.db
				.select()
				.from(files)
				.where(
					and(
						eq(files.userId, userId),
						eq(files.parentFolderId, parentFolderId),
						eq(files.isDeleted, false)
					)
				);
		}

		// Root files (no parent folder)
		return this.db
			.select()
			.from(files)
			.where(
				and(eq(files.userId, userId), isNull(files.parentFolderId), eq(files.isDeleted, false))
			);
	}

	async findOne(userId: string, id: string): Promise<File> {
		const result = await this.db
			.select()
			.from(files)
			.where(and(eq(files.id, id), eq(files.userId, userId), eq(files.isDeleted, false)));

		if (result.length === 0) {
			throw new NotFoundException('File not found');
		}

		return result[0];
	}

	async upload(userId: string, file: Express.Multer.File, dto: CreateFileDto): Promise<File> {
		if (!file) {
			throw new BadRequestException('No file provided');
		}

		// Upload to S3
		const uploadResult = await this.storageService.uploadFile(
			userId,
			file.buffer,
			file.originalname,
			file.mimetype
		);

		// Create file record
		const newFile: NewFile = {
			userId,
			name: file.originalname,
			originalName: file.originalname,
			mimeType: file.mimetype,
			size: file.size,
			storagePath: uploadResult.storagePath,
			storageKey: uploadResult.storageKey,
			parentFolderId: dto.parentFolderId || null,
			currentVersion: 1,
		};

		const result = await this.db.insert(files).values(newFile).returning();
		const createdFile = result[0];

		// Create initial version record
		const version: NewFileVersion = {
			fileId: createdFile.id,
			versionNumber: 1,
			storagePath: uploadResult.storagePath,
			storageKey: uploadResult.storageKey,
			size: file.size,
			createdBy: userId,
		};

		await this.db.insert(fileVersions).values(version);

		return createdFile;
	}

	async update(userId: string, id: string, dto: UpdateFileDto): Promise<File> {
		await this.findOne(userId, id);

		const result = await this.db
			.update(files)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(files.id, id), eq(files.userId, userId)))
			.returning();

		return result[0];
	}

	async move(userId: string, id: string, dto: MoveFileDto): Promise<File> {
		await this.findOne(userId, id);

		const result = await this.db
			.update(files)
			.set({
				parentFolderId: dto.parentFolderId || null,
				updatedAt: new Date(),
			})
			.where(and(eq(files.id, id), eq(files.userId, userId)))
			.returning();

		return result[0];
	}

	async delete(userId: string, id: string): Promise<void> {
		await this.findOne(userId, id);

		// Soft delete
		await this.db
			.update(files)
			.set({
				isDeleted: true,
				deletedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(and(eq(files.id, id), eq(files.userId, userId)));
	}

	async toggleFavorite(userId: string, id: string): Promise<File> {
		const file = await this.findOne(userId, id);

		const result = await this.db
			.update(files)
			.set({
				isFavorite: !file.isFavorite,
				updatedAt: new Date(),
			})
			.where(and(eq(files.id, id), eq(files.userId, userId)))
			.returning();

		return result[0];
	}

	async download(userId: string, id: string): Promise<{ buffer: Buffer; file: File }> {
		const file = await this.findOne(userId, id);
		const buffer = await this.storageService.downloadFile(file.storageKey);
		return { buffer, file };
	}

	async getDownloadUrl(userId: string, id: string): Promise<string> {
		const file = await this.findOne(userId, id);
		return this.storageService.getDownloadUrl(file.storageKey);
	}

	async getStats(userId: string): Promise<{
		totalFiles: number;
		totalSize: number;
		favoriteCount: number;
		recentFiles: File[];
	}> {
		const { count, sum } = await import('drizzle-orm');

		// Get total files and size
		const [stats] = await this.db
			.select({
				totalFiles: count(files.id),
				totalSize: sum(files.size),
			})
			.from(files)
			.where(and(eq(files.userId, userId), eq(files.isDeleted, false)));

		// Get favorite count
		const [favStats] = await this.db
			.select({
				count: count(files.id),
			})
			.from(files)
			.where(
				and(eq(files.userId, userId), eq(files.isDeleted, false), eq(files.isFavorite, true))
			);

		// Get recent files (last 5)
		const { desc } = await import('drizzle-orm');
		const recentFiles = await this.db
			.select()
			.from(files)
			.where(and(eq(files.userId, userId), eq(files.isDeleted, false)))
			.orderBy(desc(files.updatedAt))
			.limit(5);

		return {
			totalFiles: Number(stats.totalFiles) || 0,
			totalSize: Number(stats.totalSize) || 0,
			favoriteCount: Number(favStats.count) || 0,
			recentFiles,
		};
	}
}
