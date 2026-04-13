/**
 * Mail Service — Business logic for reading and sending mail.
 *
 * Wraps the JMAP client with user-scoped operations.
 */

import type { Database } from '../db/connection';
import type { JmapClient, JmapEmail, JmapMailbox } from './jmap-client';
import type { AccountService } from './account-service';
import { NotFoundError } from '../lib/errors';

// ─── Response Types ─────────────────────────────────────────

export interface ThreadSummary {
	id: string;
	subject: string;
	snippet: string;
	from: { name: string | null; email: string }[];
	lastMessageAt: string;
	messageCount: number;
	isRead: boolean;
	isFlagged: boolean;
	hasAttachment: boolean;
}

export interface ThreadDetail {
	id: string;
	subject: string;
	messages: MessageDetail[];
}

export interface MessageDetail {
	id: string;
	from: { name: string | null; email: string }[] | null;
	to: { name: string | null; email: string }[] | null;
	cc: { name: string | null; email: string }[] | null;
	subject: string;
	date: string;
	preview: string;
	bodyText?: string;
	bodyHtml?: string;
	isRead: boolean;
	isFlagged: boolean;
	hasAttachment: boolean;
}

export interface MailboxInfo {
	id: string;
	name: string;
	role: string | null;
	totalEmails: number;
	unreadEmails: number;
}

// ─── Service ────────────────────────────────────────────────

export class MailService {
	constructor(
		private db: Database,
		private jmap: JmapClient,
		private accountService: AccountService
	) {}

	/** Resolve the Stalwart accountId for a user (their @mana.how address). */
	private async resolveAccountId(userId: string): Promise<string> {
		const account = await this.accountService.getDefaultAccount(userId);
		if (!account?.stalwartAccountId) {
			throw new NotFoundError('No mail account configured');
		}
		return account.stalwartAccountId;
	}

	/** Get mailboxes (labels/folders) for the user. */
	async getMailboxes(userId: string): Promise<MailboxInfo[]> {
		const accountId = await this.resolveAccountId(userId);
		const mailboxes = await this.jmap.getMailboxes(accountId);
		return mailboxes.map((mb) => ({
			id: mb.id,
			name: mb.name,
			role: mb.role,
			totalEmails: mb.totalEmails,
			unreadEmails: mb.unreadEmails,
		}));
	}

	/** Get paginated thread list for a mailbox. */
	async getThreads(
		userId: string,
		opts: { mailboxId?: string; limit?: number; offset?: number } = {}
	): Promise<{ threads: ThreadSummary[]; total: number }> {
		const accountId = await this.resolveAccountId(userId);

		// Query email IDs
		const { ids: emailIds, total } = await this.jmap.queryEmails(accountId, {
			mailboxId: opts.mailboxId,
			limit: opts.limit ?? 50,
			position: opts.offset ?? 0,
		});

		if (emailIds.length === 0) return { threads: [], total };

		// Fetch email details
		const emails = await this.jmap.getEmails(accountId, emailIds);

		// Group by threadId
		const threadMap = new Map<string, JmapEmail[]>();
		for (const email of emails) {
			const existing = threadMap.get(email.threadId) || [];
			existing.push(email);
			threadMap.set(email.threadId, existing);
		}

		// Build thread summaries
		const threads: ThreadSummary[] = [];
		for (const [threadId, threadEmails] of threadMap) {
			const sorted = threadEmails.sort(
				(a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
			);
			const latest = sorted[0];
			const allRead = sorted.every((e) => e.keywords?.['$seen']);
			const anyFlagged = sorted.some((e) => e.keywords?.['$flagged']);
			const anyAttachment = sorted.some((e) => e.hasAttachment);

			threads.push({
				id: threadId,
				subject: latest.subject,
				snippet: latest.preview,
				from: latest.from?.map((f) => ({ name: f.name, email: f.email })) ?? [],
				lastMessageAt: latest.receivedAt,
				messageCount: sorted.length,
				isRead: allRead,
				isFlagged: anyFlagged,
				hasAttachment: anyAttachment,
			});
		}

		// Sort by most recent message
		threads.sort(
			(a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
		);

		return { threads, total };
	}

	/** Get full thread with all messages and body content. */
	async getThread(userId: string, threadId: string): Promise<ThreadDetail> {
		const accountId = await this.resolveAccountId(userId);

		// Get thread to find all email IDs
		const threads = await this.jmap.getThreads(accountId, [threadId]);
		if (threads.length === 0) throw new NotFoundError('Thread not found');

		const emailIds = threads[0].emailIds;

		// Fetch full email content
		const emails = await Promise.all(
			emailIds.map((id) => this.jmap.getEmailWithBody(accountId, id))
		);

		const messages: MessageDetail[] = emails
			.filter((e): e is JmapEmail => e !== null)
			.sort((a, b) => new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime())
			.map((email) => {
				const textPartId = email.textBody?.[0]?.partId;
				const htmlPartId = email.htmlBody?.[0]?.partId;

				return {
					id: email.id,
					from: email.from,
					to: email.to,
					cc: email.cc,
					subject: email.subject,
					date: email.receivedAt,
					preview: email.preview,
					bodyText: textPartId ? email.bodyValues?.[textPartId]?.value : undefined,
					bodyHtml: htmlPartId ? email.bodyValues?.[htmlPartId]?.value : undefined,
					isRead: !!email.keywords?.['$seen'],
					isFlagged: !!email.keywords?.['$flagged'],
					hasAttachment: email.hasAttachment,
				};
			});

		return {
			id: threadId,
			subject: messages[0]?.subject ?? '(kein Betreff)',
			messages,
		};
	}

	/** Update email flags (read, starred) or move between mailboxes. */
	async updateMessage(
		userId: string,
		emailId: string,
		update: { isRead?: boolean; isFlagged?: boolean; mailboxIds?: Record<string, boolean> }
	): Promise<void> {
		const accountId = await this.resolveAccountId(userId);
		await this.jmap.updateEmail(accountId, emailId, update);
	}

	/** Send an email. */
	async sendEmail(
		userId: string,
		email: {
			to: { email: string; name?: string }[];
			cc?: { email: string; name?: string }[];
			bcc?: { email: string; name?: string }[];
			subject: string;
			body: string;
			htmlBody?: string;
			inReplyTo?: string;
			references?: string[];
		}
	): Promise<{ emailId: string }> {
		const account = await this.accountService.getDefaultAccount(userId);
		if (!account?.stalwartAccountId) {
			throw new NotFoundError('No mail account configured');
		}

		const emailId = await this.jmap.submitEmail(account.stalwartAccountId, {
			from: { name: account.displayName, email: account.email },
			to: email.to.map((t) => ({ name: t.name ?? null, email: t.email })),
			cc: email.cc?.map((c) => ({ name: c.name ?? null, email: c.email })),
			bcc: email.bcc?.map((b) => ({ name: b.name ?? null, email: b.email })),
			subject: email.subject,
			textBody: email.body,
			htmlBody: email.htmlBody,
			inReplyTo: email.inReplyTo,
			references: email.references,
		});

		return { emailId };
	}
}
