import { Injectable, Logger } from '@nestjs/common';
import { ImapFlow, type MailboxObject, type FetchMessageObject, type ListResponse } from 'imapflow';
import { simpleParser, type ParsedMail, type AddressObject, type Attachment } from 'mailparser';
import {
	type EmailProvider,
	type SyncState,
	type SyncResult,
	type FetchedEmail,
	type FetchedFolder,
} from '../interfaces/email-provider.interface';
import { type EmailAccount } from '../../db/schema';

@Injectable()
export class ImapProvider implements EmailProvider {
	private readonly logger = new Logger(ImapProvider.name);
	private client: ImapFlow | null = null;

	async connect(account: EmailAccount, password?: string): Promise<void> {
		if (!account.imapHost || !account.imapPort) {
			throw new Error('IMAP settings not configured');
		}

		this.client = new ImapFlow({
			host: account.imapHost,
			port: account.imapPort,
			secure: account.imapSecurity === 'ssl',
			auth: {
				user: account.email,
				pass: password || '',
			},
			logger: false,
		});

		await this.client.connect();
	}

	async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.logout();
			this.client = null;
		}
	}

	async syncFolders(account: EmailAccount): Promise<FetchedFolder[]> {
		if (!this.client) throw new Error('Not connected');

		const folders: FetchedFolder[] = [];
		const mailboxes = await this.client.list();

		for (const mailbox of mailboxes) {
			folders.push({
				name: mailbox.name,
				path: mailbox.path,
				type: this.mapFolderType(mailbox),
				delimiter: mailbox.delimiter,
				flags: mailbox.flags ? Array.from(mailbox.flags) : [],
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
			// Open INBOX
			const mailbox = await this.client.mailboxOpen('INBOX');

			// Use UIDVALIDITY and HIGHESTMODSEQ for incremental sync
			const currentUidValidity = Number(mailbox.uidValidity);
			const currentModSeq = mailbox.highestModseq?.toString();

			// If UIDVALIDITY changed, we need full resync
			if (state.uidValidity && state.uidValidity !== currentUidValidity) {
				this.logger.warn('UIDVALIDITY changed, full resync required');
				// Full resync would be handled separately
			}

			// Fetch new messages since last sync
			const since = state.lastSyncAt || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days

			const messages = await this.fetchEmailsInternal('INBOX', { since, limit: 100 });
			result.newEmails = messages.length;

			result.newSyncState = {
				lastSyncAt: new Date(),
				uidValidity: currentUidValidity,
				highestModSeq: currentModSeq,
			};
		} catch (error) {
			result.success = false;
			result.error = error instanceof Error ? error.message : 'Sync failed';
		}

		return result;
	}

	async fetchEmail(account: EmailAccount, externalId: string): Promise<FetchedEmail | null> {
		if (!this.client) throw new Error('Not connected');

		try {
			const mailbox = await this.client.mailboxOpen('INBOX');
			const uid = parseInt(externalId, 10);

			for await (const message of this.client.fetch(uid, { source: true }, { uid: true })) {
				if (!message.source) {
					this.logger.warn(`Email ${externalId} has no source`);
					continue;
				}
				const parsed = await simpleParser(message.source);
				return this.parseEmail(message, parsed);
			}
		} catch (error) {
			this.logger.error(`Failed to fetch email ${externalId}:`, error);
		}

		return null;
	}

	async fetchEmails(
		account: EmailAccount,
		folderPath: string,
		options?: { limit?: number; since?: Date }
	): Promise<FetchedEmail[]> {
		if (!this.client) throw new Error('Not connected');

		return this.fetchEmailsInternal(folderPath, options);
	}

	private async fetchEmailsInternal(
		folderPath: string,
		options?: { limit?: number; since?: Date }
	): Promise<FetchedEmail[]> {
		if (!this.client) throw new Error('Not connected');

		const emails: FetchedEmail[] = [];
		const limit = options?.limit || 50;

		await this.client.mailboxOpen(folderPath);

		// Build search criteria
		const searchCriteria: any = {};
		if (options?.since) {
			searchCriteria.since = options.since;
		}

		const searchResults = await this.client.search(searchCriteria, { uid: true });
		if (!searchResults || searchResults.length === 0) return emails;

		const uidsToFetch = searchResults.slice(-limit); // Get most recent

		for await (const message of this.client.fetch(
			uidsToFetch,
			{ source: true, flags: true },
			{ uid: true }
		)) {
			try {
				if (!message.source) {
					this.logger.warn(`Email UID ${message.uid} has no source`);
					continue;
				}
				const parsed = await simpleParser(message.source);
				const email = this.parseEmail(message, parsed);
				emails.push(email);
			} catch (error) {
				this.logger.error(`Failed to parse email UID ${message.uid}:`, error);
			}
		}

		return emails;
	}

	async updateFlags(
		account: EmailAccount,
		externalId: string,
		flags: { isRead?: boolean; isStarred?: boolean }
	): Promise<void> {
		if (!this.client) throw new Error('Not connected');

		const uid = parseInt(externalId, 10);
		await this.client.mailboxOpen('INBOX');

		if (flags.isRead !== undefined) {
			if (flags.isRead) {
				await this.client.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
			} else {
				await this.client.messageFlagsRemove(uid, ['\\Seen'], { uid: true });
			}
		}

		if (flags.isStarred !== undefined) {
			if (flags.isStarred) {
				await this.client.messageFlagsAdd(uid, ['\\Flagged'], { uid: true });
			} else {
				await this.client.messageFlagsRemove(uid, ['\\Flagged'], { uid: true });
			}
		}
	}

	async moveEmail(
		account: EmailAccount,
		externalId: string,
		targetFolderPath: string
	): Promise<void> {
		if (!this.client) throw new Error('Not connected');

		const uid = parseInt(externalId, 10);
		await this.client.mailboxOpen('INBOX');
		await this.client.messageMove(uid, targetFolderPath, { uid: true });
	}

	async deleteEmail(account: EmailAccount, externalId: string): Promise<void> {
		if (!this.client) throw new Error('Not connected');

		const uid = parseInt(externalId, 10);
		await this.client.mailboxOpen('INBOX');
		await this.client.messageDelete(uid, { uid: true });
	}

	private mapFolderType(mailbox: ListResponse): FetchedFolder['type'] {
		const specialUse = mailbox.specialUse;
		const nameLower = mailbox.path.toLowerCase();

		if (specialUse === '\\Inbox' || nameLower === 'inbox') return 'inbox';
		if (specialUse === '\\Sent' || nameLower.includes('sent')) return 'sent';
		if (specialUse === '\\Drafts' || nameLower.includes('draft')) return 'drafts';
		if (specialUse === '\\Trash' || nameLower.includes('trash') || nameLower.includes('deleted'))
			return 'trash';
		if (specialUse === '\\Junk' || nameLower.includes('spam') || nameLower.includes('junk'))
			return 'spam';
		if (specialUse === '\\Archive' || nameLower.includes('archive')) return 'archive';

		return 'custom';
	}

	private parseEmail(message: FetchMessageObject, parsed: ParsedMail): FetchedEmail {
		const flags = message.flags || new Set();

		return {
			messageId: parsed.messageId || `${message.uid}`,
			externalId: message.uid?.toString(),
			subject: parsed.subject,
			fromAddress: this.extractEmail(parsed.from),
			fromName: this.extractName(parsed.from),
			toAddresses: this.extractAddresses(parsed.to),
			ccAddresses: this.extractAddresses(parsed.cc),
			snippet: parsed.text?.substring(0, 200),
			bodyPlain: parsed.text,
			bodyHtml: parsed.html || undefined,
			sentAt: parsed.date,
			receivedAt: parsed.date,
			isRead: flags.has('\\Seen'),
			isStarred: flags.has('\\Flagged'),
			hasAttachments: (parsed.attachments?.length || 0) > 0,
			inReplyTo: parsed.inReplyTo,
			references: parsed.references
				? Array.isArray(parsed.references)
					? parsed.references
					: [parsed.references]
				: [],
			attachments: parsed.attachments?.map((att: Attachment) => ({
				filename: att.filename || 'attachment',
				mimeType: att.contentType,
				size: att.size,
				contentId: att.contentId,
				content: att.content,
			})),
		};
	}

	private extractEmail(address: AddressObject | undefined): string | undefined {
		if (!address?.value?.[0]) return undefined;
		return address.value[0].address;
	}

	private extractName(address: AddressObject | undefined): string | undefined {
		if (!address?.value?.[0]) return undefined;
		return address.value[0].name;
	}

	private extractAddresses(
		address: AddressObject | AddressObject[] | undefined
	): { email: string; name?: string }[] {
		if (!address) return [];

		const addresses = Array.isArray(address) ? address : [address];
		const result: { email: string; name?: string }[] = [];

		for (const addr of addresses) {
			for (const val of addr.value || []) {
				if (val.address) {
					result.push({
						email: val.address,
						name: val.name,
					});
				}
			}
		}

		return result;
	}
}
