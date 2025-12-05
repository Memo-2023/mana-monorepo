import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, asc, ilike, or, sql, inArray } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { emails, type Email, type NewEmail, emailLabels } from '../db/schema';
import { FolderService } from '../folder/folder.service';

export interface EmailFilters {
	accountId?: string;
	folderId?: string;
	threadId?: string;
	search?: string;
	isRead?: boolean;
	isStarred?: boolean;
	hasAttachments?: boolean;
	aiCategory?: string;
	limit?: number;
	offset?: number;
	orderBy?: string;
	order?: 'asc' | 'desc';
}

@Injectable()
export class EmailService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private folderService: FolderService
	) {}

	async findByUserId(userId: string, filters: EmailFilters = {}): Promise<Email[]> {
		const {
			accountId,
			folderId,
			threadId,
			search,
			isRead,
			isStarred,
			hasAttachments,
			aiCategory,
			limit = 50,
			offset = 0,
			orderBy = 'receivedAt',
			order = 'desc',
		} = filters;

		let conditions = [eq(emails.userId, userId), eq(emails.isDeleted, false)];

		if (accountId) {
			conditions.push(eq(emails.accountId, accountId));
		}

		if (folderId) {
			conditions.push(eq(emails.folderId, folderId));
		}

		if (threadId) {
			conditions.push(eq(emails.threadId, threadId));
		}

		if (isRead !== undefined) {
			conditions.push(eq(emails.isRead, isRead));
		}

		if (isStarred !== undefined) {
			conditions.push(eq(emails.isStarred, isStarred));
		}

		if (hasAttachments !== undefined) {
			conditions.push(eq(emails.hasAttachments, hasAttachments));
		}

		if (aiCategory) {
			conditions.push(eq(emails.aiCategory, aiCategory));
		}

		if (search) {
			conditions.push(
				or(
					ilike(emails.subject, `%${search}%`),
					ilike(emails.fromAddress, `%${search}%`),
					ilike(emails.fromName, `%${search}%`),
					ilike(emails.snippet, `%${search}%`)
				)!
			);
		}

		// Determine sort column
		let sortColumn;
		switch (orderBy) {
			case 'sentAt':
				sortColumn = emails.sentAt;
				break;
			case 'subject':
				sortColumn = emails.subject;
				break;
			case 'fromAddress':
				sortColumn = emails.fromAddress;
				break;
			default:
				sortColumn = emails.receivedAt;
		}

		const orderFn = order === 'asc' ? asc : desc;

		return this.db
			.select()
			.from(emails)
			.where(and(...conditions))
			.orderBy(orderFn(sortColumn))
			.limit(limit)
			.offset(offset);
	}

	async findById(id: string, userId: string): Promise<Email | null> {
		const [email] = await this.db
			.select()
			.from(emails)
			.where(and(eq(emails.id, id), eq(emails.userId, userId)));
		return email || null;
	}

	async findByMessageId(messageId: string, userId: string): Promise<Email | null> {
		const [email] = await this.db
			.select()
			.from(emails)
			.where(and(eq(emails.messageId, messageId), eq(emails.userId, userId)));
		return email || null;
	}

	async findByThreadId(threadId: string, userId: string): Promise<Email[]> {
		return this.db
			.select()
			.from(emails)
			.where(and(eq(emails.threadId, threadId), eq(emails.userId, userId)))
			.orderBy(asc(emails.receivedAt));
	}

	async create(data: NewEmail): Promise<Email> {
		const [email] = await this.db.insert(emails).values(data).returning();

		// Update folder counts
		if (email.folderId) {
			await this.folderService.incrementTotalCount(email.folderId, 1);
			if (!email.isRead) {
				await this.folderService.incrementUnreadCount(email.folderId, 1);
			}
		}

		return email;
	}

	async update(id: string, userId: string, data: Partial<NewEmail>): Promise<Email> {
		const existingEmail = await this.findById(id, userId);
		if (!existingEmail) {
			throw new NotFoundException('Email not found');
		}

		const [email] = await this.db
			.update(emails)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(emails.id, id), eq(emails.userId, userId)))
			.returning();

		// Update folder unread counts if read status changed
		if (
			data.isRead !== undefined &&
			existingEmail.isRead !== data.isRead &&
			existingEmail.folderId
		) {
			const delta = data.isRead ? -1 : 1;
			await this.folderService.incrementUnreadCount(existingEmail.folderId, delta);
		}

		return email;
	}

	async markAsRead(id: string, userId: string): Promise<Email> {
		return this.update(id, userId, { isRead: true });
	}

	async markAsUnread(id: string, userId: string): Promise<Email> {
		return this.update(id, userId, { isRead: false });
	}

	async toggleStar(id: string, userId: string): Promise<Email> {
		const email = await this.findById(id, userId);
		if (!email) {
			throw new NotFoundException('Email not found');
		}
		return this.update(id, userId, { isStarred: !email.isStarred });
	}

	async moveToFolder(id: string, userId: string, folderId: string): Promise<Email> {
		const email = await this.findById(id, userId);
		if (!email) {
			throw new NotFoundException('Email not found');
		}

		const folder = await this.folderService.findById(folderId, userId);
		if (!folder) {
			throw new NotFoundException('Folder not found');
		}

		// Update old folder counts
		if (email.folderId) {
			await this.folderService.incrementTotalCount(email.folderId, -1);
			if (!email.isRead) {
				await this.folderService.incrementUnreadCount(email.folderId, -1);
			}
		}

		// Update new folder counts
		await this.folderService.incrementTotalCount(folderId, 1);
		if (!email.isRead) {
			await this.folderService.incrementUnreadCount(folderId, 1);
		}

		return this.update(id, userId, { folderId });
	}

	async moveToTrash(id: string, userId: string): Promise<Email> {
		const email = await this.findById(id, userId);
		if (!email) {
			throw new NotFoundException('Email not found');
		}

		// Find trash folder
		const trashFolder = await this.folderService.findByType(email.accountId, userId, 'trash');
		if (trashFolder) {
			return this.moveToFolder(id, userId, trashFolder.id);
		}

		// If no trash folder, just mark as deleted
		return this.update(id, userId, { isDeleted: true });
	}

	async markAsSpam(id: string, userId: string): Promise<Email> {
		const email = await this.findById(id, userId);
		if (!email) {
			throw new NotFoundException('Email not found');
		}

		// Find spam folder
		const spamFolder = await this.folderService.findByType(email.accountId, userId, 'spam');
		if (spamFolder) {
			await this.moveToFolder(id, userId, spamFolder.id);
		}

		return this.update(id, userId, { isSpam: true });
	}

	async archive(id: string, userId: string): Promise<Email> {
		const email = await this.findById(id, userId);
		if (!email) {
			throw new NotFoundException('Email not found');
		}

		// Find archive folder
		const archiveFolder = await this.folderService.findByType(email.accountId, userId, 'archive');
		if (archiveFolder) {
			return this.moveToFolder(id, userId, archiveFolder.id);
		}

		throw new NotFoundException('Archive folder not found');
	}

	async permanentDelete(id: string, userId: string): Promise<void> {
		const email = await this.findById(id, userId);
		if (!email) {
			throw new NotFoundException('Email not found');
		}

		// Update folder counts
		if (email.folderId) {
			await this.folderService.incrementTotalCount(email.folderId, -1);
			if (!email.isRead) {
				await this.folderService.incrementUnreadCount(email.folderId, -1);
			}
		}

		await this.db.delete(emails).where(and(eq(emails.id, id), eq(emails.userId, userId)));
	}

	// Batch operations
	async batchMarkAsRead(ids: string[], userId: string): Promise<number> {
		const result = await this.db
			.update(emails)
			.set({ isRead: true, updatedAt: new Date() })
			.where(and(inArray(emails.id, ids), eq(emails.userId, userId)));

		return ids.length;
	}

	async batchMarkAsUnread(ids: string[], userId: string): Promise<number> {
		const result = await this.db
			.update(emails)
			.set({ isRead: false, updatedAt: new Date() })
			.where(and(inArray(emails.id, ids), eq(emails.userId, userId)));

		return ids.length;
	}

	async batchStar(ids: string[], userId: string, starred: boolean): Promise<number> {
		await this.db
			.update(emails)
			.set({ isStarred: starred, updatedAt: new Date() })
			.where(and(inArray(emails.id, ids), eq(emails.userId, userId)));

		return ids.length;
	}

	async batchDelete(ids: string[], userId: string): Promise<number> {
		await this.db
			.update(emails)
			.set({ isDeleted: true, updatedAt: new Date() })
			.where(and(inArray(emails.id, ids), eq(emails.userId, userId)));

		return ids.length;
	}

	async count(userId: string, filters: Partial<EmailFilters> = {}): Promise<number> {
		let conditions = [eq(emails.userId, userId), eq(emails.isDeleted, false)];

		if (filters.accountId) {
			conditions.push(eq(emails.accountId, filters.accountId));
		}

		if (filters.folderId) {
			conditions.push(eq(emails.folderId, filters.folderId));
		}

		if (filters.isRead !== undefined) {
			conditions.push(eq(emails.isRead, filters.isRead));
		}

		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(emails)
			.where(and(...conditions));

		return Number(result[0]?.count || 0);
	}

	// Update AI metadata
	async updateAIMetadata(
		id: string,
		userId: string,
		metadata: {
			aiSummary?: string;
			aiCategory?: string;
			aiPriority?: string;
			aiSentiment?: string;
			aiSuggestedReplies?: string[];
		}
	): Promise<Email> {
		return this.update(id, userId, metadata);
	}
}
