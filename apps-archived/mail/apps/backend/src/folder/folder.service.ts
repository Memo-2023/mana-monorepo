import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { folders, type Folder, type NewFolder } from '../db/schema';

export interface FolderFilters {
	accountId?: string;
	type?: string;
	includeHidden?: boolean;
}

// Standard folder types that should be created for each account
export const SYSTEM_FOLDERS = [
	{ type: 'inbox', name: 'Inbox', path: 'INBOX', icon: 'inbox' },
	{ type: 'sent', name: 'Sent', path: 'Sent', icon: 'send' },
	{ type: 'drafts', name: 'Drafts', path: 'Drafts', icon: 'file-text' },
	{ type: 'trash', name: 'Trash', path: 'Trash', icon: 'trash' },
	{ type: 'spam', name: 'Spam', path: 'Spam', icon: 'alert-triangle' },
	{ type: 'archive', name: 'Archive', path: 'Archive', icon: 'archive' },
];

@Injectable()
export class FolderService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string, filters: FolderFilters = {}): Promise<Folder[]> {
		const { accountId, type, includeHidden = false } = filters;

		let conditions = [eq(folders.userId, userId)];

		if (accountId) {
			conditions.push(eq(folders.accountId, accountId));
		}

		if (type) {
			conditions.push(eq(folders.type, type));
		}

		if (!includeHidden) {
			conditions.push(eq(folders.isHidden, false));
		}

		return this.db
			.select()
			.from(folders)
			.where(and(...conditions))
			.orderBy(desc(folders.isSystem), folders.name);
	}

	async findById(id: string, userId: string): Promise<Folder | null> {
		const [folder] = await this.db
			.select()
			.from(folders)
			.where(and(eq(folders.id, id), eq(folders.userId, userId)));
		return folder || null;
	}

	async findByAccountId(accountId: string, userId: string): Promise<Folder[]> {
		return this.db
			.select()
			.from(folders)
			.where(and(eq(folders.accountId, accountId), eq(folders.userId, userId)))
			.orderBy(desc(folders.isSystem), folders.name);
	}

	async findByType(accountId: string, userId: string, type: string): Promise<Folder | null> {
		const [folder] = await this.db
			.select()
			.from(folders)
			.where(
				and(eq(folders.accountId, accountId), eq(folders.userId, userId), eq(folders.type, type))
			);
		return folder || null;
	}

	async create(data: NewFolder): Promise<Folder> {
		const [folder] = await this.db.insert(folders).values(data).returning();
		return folder;
	}

	async update(id: string, userId: string, data: Partial<NewFolder>): Promise<Folder> {
		const [folder] = await this.db
			.update(folders)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(folders.id, id), eq(folders.userId, userId)))
			.returning();

		if (!folder) {
			throw new NotFoundException('Folder not found');
		}

		return folder;
	}

	async delete(id: string, userId: string): Promise<void> {
		const folder = await this.findById(id, userId);
		if (!folder) {
			throw new NotFoundException('Folder not found');
		}

		// Prevent deletion of system folders
		if (folder.isSystem) {
			throw new NotFoundException('Cannot delete system folder');
		}

		await this.db.delete(folders).where(and(eq(folders.id, id), eq(folders.userId, userId)));
	}

	// Create system folders for a new account
	async createSystemFolders(accountId: string, userId: string): Promise<Folder[]> {
		const createdFolders: Folder[] = [];

		for (const systemFolder of SYSTEM_FOLDERS) {
			const folder = await this.create({
				accountId,
				userId,
				name: systemFolder.name,
				type: systemFolder.type,
				path: systemFolder.path,
				icon: systemFolder.icon,
				isSystem: true,
				isHidden: false,
			});
			createdFolders.push(folder);
		}

		return createdFolders;
	}

	// Update folder counts
	async updateCounts(id: string, totalCount: number, unreadCount: number): Promise<void> {
		await this.db
			.update(folders)
			.set({ totalCount, unreadCount, updatedAt: new Date() })
			.where(eq(folders.id, id));
	}

	// Increment/decrement counts
	async incrementUnreadCount(id: string, delta: number): Promise<void> {
		await this.db
			.update(folders)
			.set({
				unreadCount: sql`GREATEST(0, ${folders.unreadCount} + ${delta})`,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, id));
	}

	async incrementTotalCount(id: string, delta: number): Promise<void> {
		await this.db
			.update(folders)
			.set({
				totalCount: sql`GREATEST(0, ${folders.totalCount} + ${delta})`,
				updatedAt: new Date(),
			})
			.where(eq(folders.id, id));
	}

	// Sync folders from external provider
	async syncFromProvider(
		accountId: string,
		userId: string,
		providerFolders: Array<{ name: string; path: string; type?: string; externalId?: string }>
	): Promise<Folder[]> {
		const existingFolders = await this.findByAccountId(accountId, userId);
		const existingPaths = new Set(existingFolders.map((f) => f.path));
		const newFolders: Folder[] = [];

		for (const pf of providerFolders) {
			if (!existingPaths.has(pf.path)) {
				// Determine folder type
				let type = pf.type || 'custom';
				const lowerPath = pf.path.toLowerCase();

				if (!pf.type) {
					if (lowerPath === 'inbox') type = 'inbox';
					else if (lowerPath.includes('sent')) type = 'sent';
					else if (lowerPath.includes('draft')) type = 'drafts';
					else if (lowerPath.includes('trash') || lowerPath.includes('deleted')) type = 'trash';
					else if (lowerPath.includes('spam') || lowerPath.includes('junk')) type = 'spam';
					else if (lowerPath.includes('archive')) type = 'archive';
				}

				const folder = await this.create({
					accountId,
					userId,
					name: pf.name,
					path: pf.path,
					type,
					externalId: pf.externalId,
					isSystem: ['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive'].includes(type),
				});
				newFolders.push(folder);
			}
		}

		return newFolders;
	}
}
