import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { folders } from '../db/schema';
import type { Folder, NewFolder } from '../db/schema';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto, MoveFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FolderService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string, parentFolderId?: string): Promise<Folder[]> {
		if (parentFolderId) {
			return this.db
				.select()
				.from(folders)
				.where(
					and(
						eq(folders.userId, userId),
						eq(folders.parentFolderId, parentFolderId),
						eq(folders.isDeleted, false)
					)
				);
		}

		// Root folders (no parent)
		return this.db
			.select()
			.from(folders)
			.where(
				and(
					eq(folders.userId, userId),
					isNull(folders.parentFolderId),
					eq(folders.isDeleted, false)
				)
			);
	}

	async findOne(userId: string, id: string): Promise<Folder> {
		const result = await this.db
			.select()
			.from(folders)
			.where(and(eq(folders.id, id), eq(folders.userId, userId), eq(folders.isDeleted, false)));

		if (result.length === 0) {
			throw new NotFoundException('Folder not found');
		}

		return result[0];
	}

	async create(userId: string, dto: CreateFolderDto): Promise<Folder> {
		let path = `/${dto.name}`;
		let depth = 0;

		if (dto.parentFolderId) {
			const parent = await this.findOne(userId, dto.parentFolderId);
			path = `${parent.path}/${dto.name}`;
			depth = parent.depth + 1;
		}

		const newFolder: NewFolder = {
			userId,
			name: dto.name,
			parentFolderId: dto.parentFolderId || null,
			color: dto.color,
			description: dto.description,
			path,
			depth,
		};

		const result = await this.db.insert(folders).values(newFolder).returning();
		return result[0];
	}

	async update(userId: string, id: string, dto: UpdateFolderDto): Promise<Folder> {
		const folder = await this.findOne(userId, id);

		const result = await this.db
			.update(folders)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		return result[0];
	}

	async move(userId: string, id: string, dto: MoveFolderDto): Promise<Folder> {
		const folder = await this.findOne(userId, id);

		let newPath = `/${folder.name}`;
		let newDepth = 0;

		if (dto.parentFolderId) {
			const parent = await this.findOne(userId, dto.parentFolderId);
			newPath = `${parent.path}/${folder.name}`;
			newDepth = parent.depth + 1;
		}

		const result = await this.db
			.update(folders)
			.set({
				parentFolderId: dto.parentFolderId || null,
				path: newPath,
				depth: newDepth,
				updatedAt: new Date(),
			})
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		return result[0];
	}

	async delete(userId: string, id: string): Promise<void> {
		await this.findOne(userId, id);

		// Soft delete
		await this.db
			.update(folders)
			.set({
				isDeleted: true,
				deletedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(and(eq(folders.id, id), eq(folders.userId, userId)));
	}

	async toggleFavorite(userId: string, id: string): Promise<Folder> {
		const folder = await this.findOne(userId, id);

		const result = await this.db
			.update(folders)
			.set({
				isFavorite: !folder.isFavorite,
				updatedAt: new Date(),
			})
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		return result[0];
	}
}
