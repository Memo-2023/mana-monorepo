import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { drafts, type Draft, type NewDraft, emailAccounts, type EmailAddress } from '../db/schema';
import { AccountService } from '../account/account.service';
import { EmailService } from '../email/email.service';
import * as nodemailer from 'nodemailer';

export interface DraftFilters {
	accountId?: string;
	limit?: number;
	offset?: number;
}

@Injectable()
export class ComposeService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private accountService: AccountService,
		private emailService: EmailService
	) {}

	// ==================== Draft Management ====================

	async findDraftsByUserId(userId: string, filters: DraftFilters = {}): Promise<Draft[]> {
		const { accountId, limit = 50, offset = 0 } = filters;

		let conditions = [eq(drafts.userId, userId)];

		if (accountId) {
			conditions.push(eq(drafts.accountId, accountId));
		}

		return this.db
			.select()
			.from(drafts)
			.where(and(...conditions))
			.orderBy(desc(drafts.updatedAt))
			.limit(limit)
			.offset(offset);
	}

	async findDraftById(id: string, userId: string): Promise<Draft | null> {
		const [draft] = await this.db
			.select()
			.from(drafts)
			.where(and(eq(drafts.id, id), eq(drafts.userId, userId)));
		return draft || null;
	}

	async createDraft(data: NewDraft): Promise<Draft> {
		const [draft] = await this.db.insert(drafts).values(data).returning();
		return draft;
	}

	async updateDraft(id: string, userId: string, data: Partial<NewDraft>): Promise<Draft> {
		const [draft] = await this.db
			.update(drafts)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(drafts.id, id), eq(drafts.userId, userId)))
			.returning();

		if (!draft) {
			throw new NotFoundException('Draft not found');
		}

		return draft;
	}

	async deleteDraft(id: string, userId: string): Promise<void> {
		const draft = await this.findDraftById(id, userId);
		if (!draft) {
			throw new NotFoundException('Draft not found');
		}

		await this.db.delete(drafts).where(and(eq(drafts.id, id), eq(drafts.userId, userId)));
	}

	async countDrafts(userId: string, accountId?: string): Promise<number> {
		let conditions = [eq(drafts.userId, userId)];

		if (accountId) {
			conditions.push(eq(drafts.accountId, accountId));
		}

		const result = await this.db
			.select({ count: sql<number>`count(*)` })
			.from(drafts)
			.where(and(...conditions));

		return Number(result[0]?.count || 0);
	}

	// ==================== Send Email ====================

	async sendEmail(
		userId: string,
		data: {
			accountId: string;
			subject?: string;
			toAddresses: EmailAddress[];
			ccAddresses?: EmailAddress[];
			bccAddresses?: EmailAddress[];
			bodyHtml?: string;
			bodyPlain?: string;
			replyToEmailId?: string;
			replyType?: string;
		}
	): Promise<{ success: boolean; messageId?: string }> {
		// Get the account
		const account = await this.accountService.findById(data.accountId, userId);
		if (!account) {
			throw new NotFoundException('Email account not found');
		}

		// Build the email
		const mailOptions: nodemailer.SendMailOptions = {
			from: {
				name: account.name,
				address: account.email,
			},
			to: data.toAddresses.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)),
			cc: data.ccAddresses?.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)),
			bcc: data.bccAddresses?.map((a) => (a.name ? `"${a.name}" <${a.email}>` : a.email)),
			subject: data.subject || '(No Subject)',
			html: data.bodyHtml,
			text: data.bodyPlain,
		};

		// Add reply headers if replying
		if (data.replyToEmailId) {
			const originalEmail = await this.emailService.findById(data.replyToEmailId, userId);
			if (originalEmail) {
				mailOptions.inReplyTo = originalEmail.messageId;
				mailOptions.references = originalEmail.messageId;
			}
		}

		// Send based on provider
		switch (account.provider) {
			case 'imap':
				return this.sendViaSMTP(account, mailOptions);
			case 'gmail':
				return this.sendViaGmail(account, mailOptions);
			case 'outlook':
				return this.sendViaOutlook(account, mailOptions);
			default:
				throw new BadRequestException(`Unknown provider: ${account.provider}`);
		}
	}

	async sendDraft(
		draftId: string,
		userId: string
	): Promise<{ success: boolean; messageId?: string }> {
		const draft = await this.findDraftById(draftId, userId);
		if (!draft) {
			throw new NotFoundException('Draft not found');
		}

		if (!draft.toAddresses || draft.toAddresses.length === 0) {
			throw new BadRequestException('Draft must have at least one recipient');
		}

		const result = await this.sendEmail(userId, {
			accountId: draft.accountId,
			subject: draft.subject || undefined,
			toAddresses: draft.toAddresses,
			ccAddresses: draft.ccAddresses || undefined,
			bccAddresses: draft.bccAddresses || undefined,
			bodyHtml: draft.bodyHtml || undefined,
			bodyPlain: draft.bodyPlain || undefined,
			replyToEmailId: draft.replyToEmailId || undefined,
			replyType: draft.replyType || undefined,
		});

		// Delete draft after successful send
		if (result.success) {
			await this.deleteDraft(draftId, userId);
		}

		return result;
	}

	// ==================== Provider-specific send methods ====================

	private async sendViaSMTP(
		account: typeof emailAccounts.$inferSelect,
		mailOptions: nodemailer.SendMailOptions
	): Promise<{ success: boolean; messageId?: string }> {
		if (!account.smtpHost || !account.smtpPort) {
			throw new BadRequestException('SMTP settings not configured for this account');
		}

		// Get decrypted password
		const password = await this.accountService.getDecryptedPassword(account.id, account.userId);
		if (!password) {
			throw new BadRequestException('Account password not found');
		}

		// Create transporter
		const transporter = nodemailer.createTransport({
			host: account.smtpHost,
			port: account.smtpPort,
			secure: account.smtpSecurity === 'ssl',
			auth: {
				user: account.email,
				pass: password,
			},
			tls: {
				rejectUnauthorized: false, // Allow self-signed certs in dev
			},
		});

		try {
			const info = await transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to send email';
			throw new BadRequestException(`SMTP send failed: ${message}`);
		}
	}

	private async sendViaGmail(
		account: typeof emailAccounts.$inferSelect,
		mailOptions: nodemailer.SendMailOptions
	): Promise<{ success: boolean; messageId?: string }> {
		if (!account.accessToken) {
			throw new BadRequestException('Gmail access token not found');
		}

		// Use OAuth2 with Gmail
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				type: 'OAuth2',
				user: account.email,
				accessToken: account.accessToken,
			},
		});

		try {
			const info = await transporter.sendMail(mailOptions);
			return { success: true, messageId: info.messageId };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to send email';
			throw new BadRequestException(`Gmail send failed: ${message}`);
		}
	}

	private async sendViaOutlook(
		account: typeof emailAccounts.$inferSelect,
		mailOptions: nodemailer.SendMailOptions
	): Promise<{ success: boolean; messageId?: string }> {
		if (!account.accessToken) {
			throw new BadRequestException('Outlook access token not found');
		}

		// Use Microsoft Graph API to send
		const { Client } = await import('@microsoft/microsoft-graph-client');

		const client = Client.init({
			authProvider: (done) => {
				done(null, account.accessToken!);
			},
		});

		// Convert to Graph API format
		const message = {
			subject: mailOptions.subject,
			body: {
				contentType: mailOptions.html ? 'HTML' : 'Text',
				content: mailOptions.html || mailOptions.text || '',
			},
			toRecipients: (mailOptions.to as string[])?.map((email) => ({
				emailAddress: { address: email.replace(/.*<(.+)>/, '$1') },
			})),
			ccRecipients: (mailOptions.cc as string[])?.map((email) => ({
				emailAddress: { address: email.replace(/.*<(.+)>/, '$1') },
			})),
			bccRecipients: (mailOptions.bcc as string[])?.map((email) => ({
				emailAddress: { address: email.replace(/.*<(.+)>/, '$1') },
			})),
		};

		try {
			await client.api('/me/sendMail').post({ message, saveToSentItems: true });
			return { success: true };
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to send email';
			throw new BadRequestException(`Outlook send failed: ${message}`);
		}
	}

	// ==================== Reply/Forward Helpers ====================

	async createReplyDraft(
		userId: string,
		emailId: string,
		replyType: 'reply' | 'reply-all' | 'forward'
	): Promise<Draft> {
		const originalEmail = await this.emailService.findById(emailId, userId);
		if (!originalEmail) {
			throw new NotFoundException('Original email not found');
		}

		let toAddresses: EmailAddress[] = [];
		let ccAddresses: EmailAddress[] = [];
		let subject = originalEmail.subject || '';
		let bodyHtml = '';

		switch (replyType) {
			case 'reply':
				toAddresses = [
					{ email: originalEmail.fromAddress || '', name: originalEmail.fromName || undefined },
				];
				subject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
				break;

			case 'reply-all':
				toAddresses = [
					{ email: originalEmail.fromAddress || '', name: originalEmail.fromName || undefined },
				];
				ccAddresses =
					originalEmail.toAddresses?.filter((a) => a.email !== originalEmail.fromAddress) || [];
				if (originalEmail.ccAddresses) {
					ccAddresses = [...ccAddresses, ...originalEmail.ccAddresses];
				}
				subject = subject.startsWith('Re:') ? subject : `Re: ${subject}`;
				break;

			case 'forward':
				subject = subject.startsWith('Fwd:') ? subject : `Fwd: ${subject}`;
				break;
		}

		// Build quoted content
		const date = originalEmail.sentAt?.toLocaleString() || 'Unknown date';
		const from = originalEmail.fromName
			? `${originalEmail.fromName} <${originalEmail.fromAddress}>`
			: originalEmail.fromAddress;

		bodyHtml = `
			<br><br>
			<div style="border-left: 2px solid #ccc; padding-left: 10px; margin-left: 10px;">
				<p><strong>On ${date}, ${from} wrote:</strong></p>
				${originalEmail.bodyHtml || `<pre>${originalEmail.bodyPlain || ''}</pre>`}
			</div>
		`;

		return this.createDraft({
			userId,
			accountId: originalEmail.accountId,
			replyToEmailId: emailId,
			replyType,
			subject,
			toAddresses,
			ccAddresses,
			bodyHtml,
		});
	}
}
