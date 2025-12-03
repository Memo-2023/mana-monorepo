import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, isNull } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import {
	emailAccounts,
	emails,
	folders,
	type EmailAccount,
	type NewEmail,
	type NewFolder,
} from '../db/schema';
import { AccountService } from '../account/account.service';
import { AttachmentService } from '../attachment/attachment.service';
import { ImapProvider } from './providers/imap.provider';
import { GmailProvider } from './providers/gmail.provider';
import { OutlookProvider } from './providers/outlook.provider';
import {
	type EmailProvider,
	type SyncState,
	type SyncResult,
	type FetchedEmail,
	type FetchedFolder,
} from './interfaces/email-provider.interface';

@Injectable()
export class SyncService {
	private readonly logger = new Logger(SyncService.name);
	private syncInProgress = new Set<string>();

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private accountService: AccountService,
		private attachmentService: AttachmentService,
		private imapProvider: ImapProvider,
		private gmailProvider: GmailProvider,
		private outlookProvider: OutlookProvider
	) {}

	// Run sync every 5 minutes
	@Cron(CronExpression.EVERY_5_MINUTES)
	async scheduledSync() {
		this.logger.log('Starting scheduled sync');

		const accounts = await this.db
			.select()
			.from(emailAccounts)
			.where(eq(emailAccounts.syncEnabled, true));

		for (const account of accounts) {
			try {
				await this.syncAccount(account.id, account.userId);
			} catch (error) {
				this.logger.error(`Scheduled sync failed for account ${account.id}:`, error);
			}
		}
	}

	async syncAccount(accountId: string, userId: string): Promise<SyncResult> {
		// Prevent concurrent syncs for the same account
		if (this.syncInProgress.has(accountId)) {
			return {
				success: false,
				newEmails: 0,
				updatedEmails: 0,
				deletedEmails: 0,
				newFolders: 0,
				error: 'Sync already in progress',
				newSyncState: {},
			};
		}

		this.syncInProgress.add(accountId);

		try {
			const account = await this.accountService.findById(accountId, userId);
			if (!account) {
				throw new Error('Account not found');
			}

			const provider = this.getProvider(account.provider);
			const password =
				account.provider === 'imap'
					? await this.accountService.getDecryptedPassword(accountId, userId)
					: undefined;

			await provider.connect(account, password || undefined);

			try {
				// Sync folders first
				const fetchedFolders = await provider.syncFolders(account);
				await this.saveFolders(account, fetchedFolders);

				// Sync emails
				const syncState: SyncState = (account.syncState as SyncState) || {};
				const result = await provider.sync(account, syncState);

				// Update account sync state
				await this.db
					.update(emailAccounts)
					.set({
						syncState: result.newSyncState,
						lastSyncAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(emailAccounts.id, accountId));

				return result;
			} finally {
				await provider.disconnect();
			}
		} catch (error) {
			this.logger.error(`Sync failed for account ${accountId}:`, error);
			return {
				success: false,
				newEmails: 0,
				updatedEmails: 0,
				deletedEmails: 0,
				newFolders: 0,
				error: error instanceof Error ? error.message : 'Sync failed',
				newSyncState: {},
			};
		} finally {
			this.syncInProgress.delete(accountId);
		}
	}

	async syncFolder(
		accountId: string,
		userId: string,
		folderId: string
	): Promise<{ emails: number }> {
		const account = await this.accountService.findById(accountId, userId);
		if (!account) {
			throw new Error('Account not found');
		}

		const [folder] = await this.db
			.select()
			.from(folders)
			.where(and(eq(folders.id, folderId), eq(folders.userId, userId)));

		if (!folder) {
			throw new Error('Folder not found');
		}

		const provider = this.getProvider(account.provider);
		const password =
			account.provider === 'imap'
				? await this.accountService.getDecryptedPassword(accountId, userId)
				: undefined;

		await provider.connect(account, password || undefined);

		try {
			const fetchedEmails = await provider.fetchEmails(account, folder.path, { limit: 50 });
			await this.saveEmails(account, folder.id, fetchedEmails);

			return { emails: fetchedEmails.length };
		} finally {
			await provider.disconnect();
		}
	}

	async fetchFullEmail(accountId: string, userId: string, emailId: string): Promise<void> {
		const account = await this.accountService.findById(accountId, userId);
		if (!account) {
			throw new Error('Account not found');
		}

		const [email] = await this.db
			.select()
			.from(emails)
			.where(and(eq(emails.id, emailId), eq(emails.userId, userId)));

		if (!email || !email.externalId) {
			throw new Error('Email not found');
		}

		const provider = this.getProvider(account.provider);
		const password =
			account.provider === 'imap'
				? await this.accountService.getDecryptedPassword(accountId, userId)
				: undefined;

		await provider.connect(account, password || undefined);

		try {
			const fullEmail = await provider.fetchEmail(account, email.externalId);
			if (fullEmail) {
				// Update email with full body
				await this.db
					.update(emails)
					.set({
						bodyPlain: fullEmail.bodyPlain,
						bodyHtml: fullEmail.bodyHtml,
						updatedAt: new Date(),
					})
					.where(eq(emails.id, emailId));

				// Save attachments
				if (fullEmail.attachments) {
					for (const att of fullEmail.attachments) {
						if (att.content) {
							await this.attachmentService.uploadDirect(userId, emailId, {
								filename: att.filename,
								mimeType: att.mimeType,
								content: att.content,
							});
						}
					}
				}
			}
		} finally {
			await provider.disconnect();
		}
	}

	async updateEmailFlags(
		accountId: string,
		userId: string,
		emailId: string,
		flags: { isRead?: boolean; isStarred?: boolean }
	): Promise<void> {
		const account = await this.accountService.findById(accountId, userId);
		if (!account) {
			throw new Error('Account not found');
		}

		const [email] = await this.db
			.select()
			.from(emails)
			.where(and(eq(emails.id, emailId), eq(emails.userId, userId)));

		if (!email || !email.externalId) {
			throw new Error('Email not found');
		}

		const provider = this.getProvider(account.provider);
		const password =
			account.provider === 'imap'
				? await this.accountService.getDecryptedPassword(accountId, userId)
				: undefined;

		await provider.connect(account, password || undefined);

		try {
			await provider.updateFlags(account, email.externalId, flags);
		} finally {
			await provider.disconnect();
		}
	}

	async moveEmail(
		accountId: string,
		userId: string,
		emailId: string,
		targetFolderId: string
	): Promise<void> {
		const account = await this.accountService.findById(accountId, userId);
		if (!account) {
			throw new Error('Account not found');
		}

		const [email] = await this.db
			.select()
			.from(emails)
			.where(and(eq(emails.id, emailId), eq(emails.userId, userId)));

		if (!email || !email.externalId) {
			throw new Error('Email not found');
		}

		const [targetFolder] = await this.db
			.select()
			.from(folders)
			.where(and(eq(folders.id, targetFolderId), eq(folders.userId, userId)));

		if (!targetFolder) {
			throw new Error('Target folder not found');
		}

		const provider = this.getProvider(account.provider);
		const password =
			account.provider === 'imap'
				? await this.accountService.getDecryptedPassword(accountId, userId)
				: undefined;

		await provider.connect(account, password || undefined);

		try {
			await provider.moveEmail(account, email.externalId, targetFolder.path);
		} finally {
			await provider.disconnect();
		}
	}

	async deleteEmail(accountId: string, userId: string, emailId: string): Promise<void> {
		const account = await this.accountService.findById(accountId, userId);
		if (!account) {
			throw new Error('Account not found');
		}

		const [email] = await this.db
			.select()
			.from(emails)
			.where(and(eq(emails.id, emailId), eq(emails.userId, userId)));

		if (!email || !email.externalId) {
			throw new Error('Email not found');
		}

		const provider = this.getProvider(account.provider);
		const password =
			account.provider === 'imap'
				? await this.accountService.getDecryptedPassword(accountId, userId)
				: undefined;

		await provider.connect(account, password || undefined);

		try {
			await provider.deleteEmail(account, email.externalId);
		} finally {
			await provider.disconnect();
		}
	}

	private getProvider(providerType: string): EmailProvider {
		switch (providerType) {
			case 'imap':
				return this.imapProvider;
			case 'gmail':
				return this.gmailProvider;
			case 'outlook':
				return this.outlookProvider;
			default:
				throw new Error(`Unknown provider type: ${providerType}`);
		}
	}

	private async saveFolders(account: EmailAccount, fetchedFolders: FetchedFolder[]): Promise<void> {
		for (const fetched of fetchedFolders) {
			// Check if folder exists
			const [existing] = await this.db
				.select()
				.from(folders)
				.where(and(eq(folders.accountId, account.id), eq(folders.path, fetched.path)));

			if (!existing) {
				await this.db.insert(folders).values({
					accountId: account.id,
					userId: account.userId,
					name: fetched.name,
					type: fetched.type,
					path: fetched.path,
					isSystem: ['inbox', 'sent', 'drafts', 'trash', 'spam'].includes(fetched.type),
				});
			}
		}
	}

	private async saveEmails(
		account: EmailAccount,
		folderId: string,
		fetchedEmails: FetchedEmail[]
	): Promise<void> {
		for (const fetched of fetchedEmails) {
			// Check if email exists by messageId
			const [existing] = await this.db
				.select()
				.from(emails)
				.where(and(eq(emails.accountId, account.id), eq(emails.messageId, fetched.messageId)));

			if (!existing) {
				await this.db.insert(emails).values({
					accountId: account.id,
					folderId,
					userId: account.userId,
					messageId: fetched.messageId,
					externalId: fetched.externalId,
					threadId: fetched.threadId
						? await this.getOrCreateThreadId(account.id, fetched.threadId)
						: null,
					subject: fetched.subject,
					fromAddress: fetched.fromAddress,
					fromName: fetched.fromName,
					toAddresses: fetched.toAddresses,
					ccAddresses: fetched.ccAddresses,
					snippet: fetched.snippet,
					bodyPlain: fetched.bodyPlain,
					bodyHtml: fetched.bodyHtml,
					sentAt: fetched.sentAt,
					receivedAt: fetched.receivedAt,
					isRead: fetched.isRead,
					isStarred: fetched.isStarred,
					hasAttachments: fetched.hasAttachments,
				});
			} else {
				// Update existing email flags
				await this.db
					.update(emails)
					.set({
						isRead: fetched.isRead,
						isStarred: fetched.isStarred,
						updatedAt: new Date(),
					})
					.where(eq(emails.id, existing.id));
			}
		}
	}

	private async getOrCreateThreadId(accountId: string, externalThreadId: string): Promise<string> {
		// Find existing email with same external thread ID
		const [existingEmail] = await this.db
			.select()
			.from(emails)
			.where(eq(emails.accountId, accountId))
			.limit(1);

		// For simplicity, we generate a new UUID for each thread
		// In a real implementation, you'd want to track thread IDs properly
		return externalThreadId;
	}
}
