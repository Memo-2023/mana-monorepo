import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { emailAccounts, type EmailAccount, type NewEmailAccount } from '../db/schema';
import * as crypto from 'crypto';

export interface AccountFilters {
	limit?: number;
	offset?: number;
}

@Injectable()
export class AccountService {
	private encryptionKey: Buffer;

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {
		// Get encryption key from environment or use a default for development
		const key = process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-bytes-long';
		this.encryptionKey = crypto.scryptSync(key, 'salt', 32);
	}

	// Encrypt password for storage
	private encryptPassword(password: string): string {
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
		let encrypted = cipher.update(password, 'utf8', 'hex');
		encrypted += cipher.final('hex');
		return iv.toString('hex') + ':' + encrypted;
	}

	// Decrypt password for use
	private decryptPassword(encryptedPassword: string): string {
		const [ivHex, encrypted] = encryptedPassword.split(':');
		const iv = Buffer.from(ivHex, 'hex');
		const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
		let decrypted = decipher.update(encrypted, 'hex', 'utf8');
		decrypted += decipher.final('utf8');
		return decrypted;
	}

	async findByUserId(userId: string, filters: AccountFilters = {}): Promise<EmailAccount[]> {
		const { limit = 50, offset = 0 } = filters;

		return this.db
			.select()
			.from(emailAccounts)
			.where(eq(emailAccounts.userId, userId))
			.orderBy(desc(emailAccounts.isDefault), desc(emailAccounts.createdAt))
			.limit(limit)
			.offset(offset);
	}

	async findById(id: string, userId: string): Promise<EmailAccount | null> {
		const [account] = await this.db
			.select()
			.from(emailAccounts)
			.where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, userId)));
		return account || null;
	}

	async create(data: NewEmailAccount & { password?: string }): Promise<EmailAccount> {
		const { password, ...accountData } = data;

		// Encrypt password if provided
		let encryptedPassword: string | undefined;
		if (password) {
			encryptedPassword = this.encryptPassword(password);
		}

		// If this is set as default, unset other defaults first
		if (accountData.isDefault) {
			await this.db
				.update(emailAccounts)
				.set({ isDefault: false })
				.where(eq(emailAccounts.userId, accountData.userId));
		}

		const [account] = await this.db
			.insert(emailAccounts)
			.values({
				...accountData,
				encryptedPassword,
			})
			.returning();
		return account;
	}

	async update(id: string, userId: string, data: Partial<NewEmailAccount>): Promise<EmailAccount> {
		// If setting as default, unset other defaults first
		if (data.isDefault) {
			await this.db
				.update(emailAccounts)
				.set({ isDefault: false })
				.where(eq(emailAccounts.userId, userId));
		}

		const [account] = await this.db
			.update(emailAccounts)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, userId)))
			.returning();

		if (!account) {
			throw new NotFoundException('Email account not found');
		}

		return account;
	}

	async delete(id: string, userId: string): Promise<void> {
		const account = await this.findById(id, userId);
		if (!account) {
			throw new NotFoundException('Email account not found');
		}

		await this.db
			.delete(emailAccounts)
			.where(and(eq(emailAccounts.id, id), eq(emailAccounts.userId, userId)));
	}

	async setDefault(id: string, userId: string): Promise<EmailAccount> {
		// Unset all defaults first
		await this.db
			.update(emailAccounts)
			.set({ isDefault: false })
			.where(eq(emailAccounts.userId, userId));

		// Set this one as default
		return this.update(id, userId, { isDefault: true });
	}

	async count(userId: string): Promise<number> {
		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(emailAccounts)
			.where(eq(emailAccounts.userId, userId));

		return Number(result[0]?.count || 0);
	}

	// Get decrypted password for IMAP/SMTP connection
	async getDecryptedPassword(id: string, userId: string): Promise<string | null> {
		const account = await this.findById(id, userId);
		if (!account || !account.encryptedPassword) {
			return null;
		}
		return this.decryptPassword(account.encryptedPassword);
	}

	// Update OAuth tokens
	async updateTokens(
		id: string,
		userId: string,
		tokens: { accessToken: string; refreshToken?: string; expiresAt?: Date }
	): Promise<EmailAccount> {
		return this.update(id, userId, {
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiresAt: tokens.expiresAt,
		});
	}

	// Update sync state
	async updateSyncState(id: string, userId: string, syncState: object): Promise<EmailAccount> {
		return this.update(id, userId, {
			syncState,
			lastSyncAt: new Date(),
			lastSyncError: null,
		});
	}

	// Record sync error
	async recordSyncError(id: string, userId: string, error: string): Promise<EmailAccount> {
		return this.update(id, userId, {
			lastSyncError: error,
		});
	}
}
