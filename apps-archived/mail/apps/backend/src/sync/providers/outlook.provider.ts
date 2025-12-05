import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@microsoft/microsoft-graph-client';
import {
	type EmailProvider,
	type SyncState,
	type SyncResult,
	type FetchedEmail,
	type FetchedFolder,
} from '../interfaces/email-provider.interface';
import { type EmailAccount } from '../../db/schema';

interface GraphMessage {
	id: string;
	conversationId?: string;
	subject?: string;
	from?: { emailAddress: { address: string; name?: string } };
	toRecipients?: { emailAddress: { address: string; name?: string } }[];
	ccRecipients?: { emailAddress: { address: string; name?: string } }[];
	bodyPreview?: string;
	body?: { content: string; contentType: string };
	sentDateTime?: string;
	receivedDateTime?: string;
	isRead?: boolean;
	flag?: { flagStatus: string };
	hasAttachments?: boolean;
	internetMessageId?: string;
	parentFolderId?: string;
}

interface GraphMailFolder {
	id: string;
	displayName: string;
	parentFolderId?: string;
	wellKnownName?: string;
}

@Injectable()
export class OutlookProvider implements EmailProvider {
	private readonly logger = new Logger(OutlookProvider.name);
	private client: Client | null = null;

	async connect(account: EmailAccount): Promise<void> {
		if (!account.accessToken) {
			throw new Error('Outlook access token not configured');
		}

		this.client = Client.init({
			authProvider: (done) => {
				done(null, account.accessToken!);
			},
		});
	}

	async disconnect(): Promise<void> {
		this.client = null;
	}

	async syncFolders(account: EmailAccount): Promise<FetchedFolder[]> {
		if (!this.client) throw new Error('Not connected');

		const folders: FetchedFolder[] = [];
		const response = await this.client.api('/me/mailFolders').get();

		for (const folder of response.value as GraphMailFolder[]) {
			folders.push({
				name: folder.displayName,
				path: folder.id,
				type: this.mapFolderType(folder.wellKnownName),
			});
		}

		return folders;
	}

	async sync(account: EmailAccount, state: SyncState): Promise<SyncResult> {
		if (!this.client) throw new Error('Not connected');

		const result: SyncResult = {
			success: true,
			newEmails: 0,
			updatedEmails: 0,
			deletedEmails: 0,
			newFolders: 0,
			newSyncState: { ...state },
		};

		try {
			// Use delta query for incremental sync
			let deltaUrl = state.deltaLink || '/me/mailFolders/inbox/messages/delta';

			const response = await this.client.api(deltaUrl).get();

			result.newEmails = (response.value as GraphMessage[]).length;

			// Save delta link for next sync
			if (response['@odata.deltaLink']) {
				result.newSyncState.deltaLink = response['@odata.deltaLink'];
			}

			result.newSyncState.lastSyncAt = new Date();
		} catch (error) {
			result.success = false;
			result.error = error instanceof Error ? error.message : 'Sync failed';
		}

		return result;
	}

	async fetchEmail(account: EmailAccount, externalId: string): Promise<FetchedEmail | null> {
		if (!this.client) throw new Error('Not connected');

		try {
			const response = await this.client
				.api(`/me/messages/${externalId}`)
				.select(
					'id,conversationId,subject,from,toRecipients,ccRecipients,bodyPreview,body,sentDateTime,receivedDateTime,isRead,flag,hasAttachments,internetMessageId'
				)
				.get();

			return this.parseOutlookMessage(response);
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
		if (!this.client) throw new Error('Not connected');

		const emails: FetchedEmail[] = [];
		const limit = options?.limit || 50;

		let request = this.client
			.api(`/me/mailFolders/${folderPath}/messages`)
			.top(limit)
			.select(
				'id,conversationId,subject,from,toRecipients,ccRecipients,bodyPreview,body,sentDateTime,receivedDateTime,isRead,flag,hasAttachments,internetMessageId'
			);

		if (options?.since) {
			request = request.filter(`receivedDateTime ge ${options.since.toISOString()}`);
		}

		const response = await request.get();

		for (const message of response.value as GraphMessage[]) {
			emails.push(this.parseOutlookMessage(message));
		}

		return emails;
	}

	async updateFlags(
		account: EmailAccount,
		externalId: string,
		flags: { isRead?: boolean; isStarred?: boolean }
	): Promise<void> {
		if (!this.client) throw new Error('Not connected');

		const update: Record<string, any> = {};

		if (flags.isRead !== undefined) {
			update.isRead = flags.isRead;
		}

		if (flags.isStarred !== undefined) {
			update.flag = {
				flagStatus: flags.isStarred ? 'flagged' : 'notFlagged',
			};
		}

		if (Object.keys(update).length > 0) {
			await this.client.api(`/me/messages/${externalId}`).patch(update);
		}
	}

	async moveEmail(
		account: EmailAccount,
		externalId: string,
		targetFolderPath: string
	): Promise<void> {
		if (!this.client) throw new Error('Not connected');

		await this.client.api(`/me/messages/${externalId}/move`).post({
			destinationId: targetFolderPath,
		});
	}

	async deleteEmail(account: EmailAccount, externalId: string): Promise<void> {
		if (!this.client) throw new Error('Not connected');

		// Move to deleted items
		await this.client.api(`/me/messages/${externalId}/move`).post({
			destinationId: 'deleteditems',
		});
	}

	private mapFolderType(wellKnownName?: string): FetchedFolder['type'] {
		const folderMap: Record<string, FetchedFolder['type']> = {
			inbox: 'inbox',
			sentitems: 'sent',
			drafts: 'drafts',
			deleteditems: 'trash',
			junkemail: 'spam',
			archive: 'archive',
		};
		return folderMap[wellKnownName?.toLowerCase() || ''] || 'custom';
	}

	private parseOutlookMessage(message: GraphMessage): FetchedEmail {
		return {
			messageId: message.internetMessageId || message.id,
			externalId: message.id,
			threadId: message.conversationId,
			subject: message.subject,
			fromAddress: message.from?.emailAddress.address,
			fromName: message.from?.emailAddress.name,
			toAddresses:
				message.toRecipients?.map((r) => ({
					email: r.emailAddress.address,
					name: r.emailAddress.name,
				})) || [],
			ccAddresses:
				message.ccRecipients?.map((r) => ({
					email: r.emailAddress.address,
					name: r.emailAddress.name,
				})) || [],
			snippet: message.bodyPreview,
			bodyPlain: message.body?.contentType === 'text' ? message.body.content : undefined,
			bodyHtml: message.body?.contentType === 'html' ? message.body.content : undefined,
			sentAt: message.sentDateTime ? new Date(message.sentDateTime) : undefined,
			receivedAt: message.receivedDateTime ? new Date(message.receivedDateTime) : undefined,
			isRead: message.isRead ?? false,
			isStarred: message.flag?.flagStatus === 'flagged',
			hasAttachments: message.hasAttachments ?? false,
		};
	}
}
