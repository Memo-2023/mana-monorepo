import { Injectable, Logger } from '@nestjs/common';
import { google, gmail_v1 } from 'googleapis';
import {
	type EmailProvider,
	type SyncState,
	type SyncResult,
	type FetchedEmail,
	type FetchedFolder,
} from '../interfaces/email-provider.interface';
import { type EmailAccount } from '../../db/schema';

@Injectable()
export class GmailProvider implements EmailProvider {
	private readonly logger = new Logger(GmailProvider.name);
	private gmail: gmail_v1.Gmail | null = null;

	async connect(account: EmailAccount): Promise<void> {
		if (!account.accessToken) {
			throw new Error('Gmail access token not configured');
		}

		const auth = new google.auth.OAuth2();
		auth.setCredentials({ access_token: account.accessToken });

		this.gmail = google.gmail({ version: 'v1', auth });
	}

	async disconnect(): Promise<void> {
		this.gmail = null;
	}

	async syncFolders(account: EmailAccount): Promise<FetchedFolder[]> {
		if (!this.gmail) throw new Error('Not connected');

		const folders: FetchedFolder[] = [];
		const response = await this.gmail.users.labels.list({ userId: 'me' });

		for (const label of response.data.labels || []) {
			folders.push({
				name: label.name || '',
				path: label.id || '',
				type: this.mapLabelType(label.id || ''),
			});
		}

		return folders;
	}

	async sync(account: EmailAccount, state: SyncState): Promise<SyncResult> {
		if (!this.gmail) throw new Error('Not connected');

		const result: SyncResult = {
			success: true,
			newEmails: 0,
			updatedEmails: 0,
			deletedEmails: 0,
			newFolders: 0,
			newSyncState: { ...state },
		};

		try {
			// Use Gmail History API for incremental sync
			if (state.historyId) {
				const historyResponse = await this.gmail.users.history.list({
					userId: 'me',
					startHistoryId: state.historyId,
				});

				const history = historyResponse.data.history || [];
				for (const record of history) {
					result.newEmails += record.messagesAdded?.length || 0;
					result.deletedEmails += record.messagesDeleted?.length || 0;
				}

				result.newSyncState.historyId = historyResponse.data.historyId || state.historyId;
			} else {
				// Initial sync - fetch recent messages
				const messagesResponse = await this.gmail.users.messages.list({
					userId: 'me',
					maxResults: 100,
					q: 'in:inbox',
				});

				result.newEmails = messagesResponse.data.messages?.length || 0;

				// Get current history ID for future syncs
				const profile = await this.gmail.users.getProfile({ userId: 'me' });
				result.newSyncState.historyId = profile.data.historyId || undefined;
			}

			result.newSyncState.lastSyncAt = new Date();
		} catch (error) {
			result.success = false;
			result.error = error instanceof Error ? error.message : 'Sync failed';
		}

		return result;
	}

	async fetchEmail(account: EmailAccount, externalId: string): Promise<FetchedEmail | null> {
		if (!this.gmail) throw new Error('Not connected');

		try {
			const response = await this.gmail.users.messages.get({
				userId: 'me',
				id: externalId,
				format: 'full',
			});

			return this.parseGmailMessage(response.data);
		} catch (error) {
			this.logger.error(`Failed to fetch email ${externalId}:`, error);
			return null;
		}
	}

	async fetchEmails(
		account: EmailAccount,
		folderPath: string,
		options?: { limit?: number; since?: Date }
	): Promise<FetchedEmail[]> {
		if (!this.gmail) throw new Error('Not connected');

		const emails: FetchedEmail[] = [];
		const limit = options?.limit || 50;

		// Build query
		let query = `in:${folderPath === 'INBOX' ? 'inbox' : folderPath}`;
		if (options?.since) {
			const dateStr = options.since.toISOString().split('T')[0];
			query += ` after:${dateStr}`;
		}

		const listResponse = await this.gmail.users.messages.list({
			userId: 'me',
			maxResults: limit,
			q: query,
		});

		for (const message of listResponse.data.messages || []) {
			if (message.id) {
				const email = await this.fetchEmail(account, message.id);
				if (email) emails.push(email);
			}
		}

		return emails;
	}

	async updateFlags(
		account: EmailAccount,
		externalId: string,
		flags: { isRead?: boolean; isStarred?: boolean }
	): Promise<void> {
		if (!this.gmail) throw new Error('Not connected');

		const addLabels: string[] = [];
		const removeLabels: string[] = [];

		if (flags.isRead !== undefined) {
			if (flags.isRead) {
				removeLabels.push('UNREAD');
			} else {
				addLabels.push('UNREAD');
			}
		}

		if (flags.isStarred !== undefined) {
			if (flags.isStarred) {
				addLabels.push('STARRED');
			} else {
				removeLabels.push('STARRED');
			}
		}

		if (addLabels.length > 0 || removeLabels.length > 0) {
			await this.gmail.users.messages.modify({
				userId: 'me',
				id: externalId,
				requestBody: {
					addLabelIds: addLabels.length > 0 ? addLabels : undefined,
					removeLabelIds: removeLabels.length > 0 ? removeLabels : undefined,
				},
			});
		}
	}

	async moveEmail(
		account: EmailAccount,
		externalId: string,
		targetFolderPath: string
	): Promise<void> {
		if (!this.gmail) throw new Error('Not connected');

		// In Gmail, moving is done by modifying labels
		const targetLabel = this.pathToLabelId(targetFolderPath);

		await this.gmail.users.messages.modify({
			userId: 'me',
			id: externalId,
			requestBody: {
				addLabelIds: [targetLabel],
				removeLabelIds: ['INBOX'],
			},
		});
	}

	async deleteEmail(account: EmailAccount, externalId: string): Promise<void> {
		if (!this.gmail) throw new Error('Not connected');

		// Move to trash (or permanently delete)
		await this.gmail.users.messages.trash({
			userId: 'me',
			id: externalId,
		});
	}

	private mapLabelType(labelId: string): FetchedFolder['type'] {
		const labelMap: Record<string, FetchedFolder['type']> = {
			INBOX: 'inbox',
			SENT: 'sent',
			DRAFT: 'drafts',
			TRASH: 'trash',
			SPAM: 'spam',
		};
		return labelMap[labelId] || 'custom';
	}

	private pathToLabelId(path: string): string {
		const pathMap: Record<string, string> = {
			inbox: 'INBOX',
			sent: 'SENT',
			drafts: 'DRAFT',
			trash: 'TRASH',
			spam: 'SPAM',
		};
		return pathMap[path.toLowerCase()] || path;
	}

	private parseGmailMessage(message: gmail_v1.Schema$Message): FetchedEmail {
		const headers = message.payload?.headers || [];
		const getHeader = (name: string) =>
			headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value;

		const labels = message.labelIds || [];

		// Extract body
		let bodyPlain = '';
		let bodyHtml = '';

		const extractBody = (part: gmail_v1.Schema$MessagePart) => {
			if (part.mimeType === 'text/plain' && part.body?.data) {
				bodyPlain = Buffer.from(part.body.data, 'base64').toString('utf-8');
			}
			if (part.mimeType === 'text/html' && part.body?.data) {
				bodyHtml = Buffer.from(part.body.data, 'base64').toString('utf-8');
			}
			for (const subPart of part.parts || []) {
				extractBody(subPart);
			}
		};

		if (message.payload) {
			extractBody(message.payload);
		}

		// Parse from header
		const fromHeader = getHeader('From') || '';
		const fromMatch = fromHeader.match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
		const fromName = fromMatch?.[1]?.trim();
		const fromAddress = fromMatch?.[2] || fromHeader;

		// Parse to/cc addresses
		const parseAddresses = (header: string | undefined): { email: string; name?: string }[] => {
			if (!header) return [];
			return header.split(',').map((addr) => {
				const match = addr.trim().match(/^(?:"?([^"<]*)"?\s*)?<?([^>]+)>?$/);
				return {
					email: match?.[2] || addr.trim(),
					name: match?.[1]?.trim(),
				};
			});
		};

		return {
			messageId: getHeader('Message-ID') || message.id || '',
			externalId: message.id ?? undefined,
			threadId: message.threadId ?? undefined,
			subject: getHeader('Subject') ?? undefined,
			fromAddress,
			fromName,
			toAddresses: parseAddresses(getHeader('To') ?? undefined),
			ccAddresses: parseAddresses(getHeader('Cc') ?? undefined),
			snippet: message.snippet ?? undefined,
			bodyPlain: bodyPlain ?? undefined,
			bodyHtml: bodyHtml ?? undefined,
			sentAt: getHeader('Date') ? new Date(getHeader('Date')!) : undefined,
			receivedAt: message.internalDate ? new Date(parseInt(message.internalDate, 10)) : undefined,
			isRead: !labels.includes('UNREAD'),
			isStarred: labels.includes('STARRED'),
			hasAttachments:
				message.payload?.parts?.some((p) => p.filename && p.filename.length > 0) || false,
			inReplyTo: getHeader('In-Reply-To') ?? undefined,
			references: getHeader('References')?.split(/\s+/),
		};
	}
}
