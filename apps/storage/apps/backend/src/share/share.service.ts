import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { shares } from '../db/schema';
import type { Share, NewShare } from '../db/schema';

@Injectable()
export class ShareService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Share[]> {
		return this.db
			.select()
			.from(shares)
			.where(and(eq(shares.userId, userId), eq(shares.isActive, true)));
	}

	async findByToken(token: string): Promise<Share> {
		const result = await this.db
			.select()
			.from(shares)
			.where(and(eq(shares.shareToken, token), eq(shares.isActive, true)));

		if (result.length === 0) {
			throw new NotFoundException('Share not found');
		}

		const share = result[0];

		// Check expiration
		if (share.expiresAt && new Date() > share.expiresAt) {
			throw new NotFoundException('Share link has expired');
		}

		// Check download limit
		if (share.maxDownloads && share.downloadCount >= share.maxDownloads) {
			throw new NotFoundException('Share link download limit reached');
		}

		return share;
	}

	async create(
		userId: string,
		data: {
			fileId?: string;
			folderId?: string;
			accessLevel?: 'view' | 'edit' | 'download';
			password?: string;
			maxDownloads?: number;
			expiresAt?: Date;
		}
	): Promise<Share> {
		const shareToken = randomBytes(32).toString('hex');
		const shareType = data.fileId ? 'file' : 'folder';

		const newShare: NewShare = {
			userId,
			fileId: data.fileId,
			folderId: data.folderId,
			shareType,
			shareToken,
			accessLevel: data.accessLevel || 'view',
			password: data.password, // Should be hashed in production
			maxDownloads: data.maxDownloads,
			expiresAt: data.expiresAt,
		};

		const result = await this.db.insert(shares).values(newShare).returning();
		return result[0];
	}

	async delete(userId: string, id: string): Promise<void> {
		await this.db
			.update(shares)
			.set({ isActive: false })
			.where(and(eq(shares.id, id), eq(shares.userId, userId)));
	}

	async incrementDownloadCount(id: string): Promise<void> {
		const share = await this.db.select().from(shares).where(eq(shares.id, id));
		if (share.length > 0) {
			await this.db
				.update(shares)
				.set({
					downloadCount: share[0].downloadCount + 1,
					lastAccessedAt: new Date(),
				})
				.where(eq(shares.id, id));
		}
	}
}
