/**
 * Broadcast orchestrator — takes a campaign payload + recipient list,
 * produces per-recipient HTML with substituted tracking URLs, submits
 * each email via Stalwart (reusing the user's mailbox), and writes
 * progress to broadcast.sends / broadcast.campaigns.
 *
 * MVP note: this is a synchronous loop. For 100 recipients it takes
 * ~15s (JMAP submit latency-dominated) and the API call simply blocks
 * until done. Phase 2 wraps this in an async job queue with SSE
 * progress updates; the loop logic stays the same.
 *
 * Recipient resolution is NOT done here — the webapp ships a pre-
 * resolved recipient list in the bulk-send payload because contacts
 * live in Dexie (local-first) and the server never sees them decrypted.
 */

import juice from 'juice';
import type { Database } from '../db/connection';
import { campaigns, sends, type NewBroadcastSend } from '../db/schema';
import type { AccountService } from './account-service';
import type { JmapClient } from './jmap-client';
import { generateNonce, signToken } from './tracking-token';

export interface BulkRecipient {
	email: string;
	name?: string;
	/** Stable back-link to the user's contact, if resolvable. Opaque to us. */
	contactId?: string;
}

export interface BulkSendInput {
	userId: string;
	campaignId: string;
	subject: string;
	fromName: string;
	fromEmail: string;
	replyTo?: string;
	htmlBody: string;
	textBody: string;
	recipients: BulkRecipient[];
	/** Max recipients the campaign allows — hard-capped by the route
	 *  against the server's MAX_RECIPIENTS_PER_CAMPAIGN config. */
	maxRecipients: number;
}

export interface BulkSendResult {
	campaignId: string;
	accepted: number;
	delivered: number;
	failed: number;
	/** Fine-grained error per recipient — useful for the UI to show a
	 *  "3 bounces" badge without waiting on bounce-webhook propagation. */
	errors: Array<{ email: string; reason: string }>;
}

export class BroadcastOrchestrator {
	constructor(
		private db: Database,
		private jmap: JmapClient,
		private accountService: AccountService,
		private trackingSecret: string,
		private baseUrl: string
	) {}

	/**
	 * Inline CSS once for the whole campaign so every recipient gets the
	 * same final HTML structure — only the per-recipient URLs change.
	 *
	 * juice walks `<style>` blocks + external stylesheets and splatters
	 * matching rules into inline style="". Our client-side render is
	 * already inline-heavy so this pass mostly normalises edge cases.
	 */
	private inlineOnce(html: string): string {
		try {
			return juice(html, {
				preserveMediaQueries: true,
				removeStyleTags: false,
				webResources: {
					// We never fetch external resources (images are already
					// absolute URLs to mana-media). Blocking the resolver
					// prevents juice from trying to load anything over HTTP
					// and slowing the send loop.
					images: false,
				},
			});
		} catch {
			// If juice chokes, fall back to the input HTML — a mail with
			// un-inlined styles is still better than no mail.
			return html;
		}
	}

	/**
	 * Replace `{{unsubscribe_url}}` and `{{web_view_url}}` placeholders
	 * with signed per-recipient URLs. Client-side renderer puts the
	 * placeholders in; this is the only place they're resolved.
	 */
	private substituteUrls(
		inlinedHtml: string,
		campaignId: string,
		sendId: string,
		nonce: string
	): { html: string; text: string; unsubscribeUrl: string; webViewUrl: string } {
		const token = signToken({ campaignId, sendId, nonce }, this.trackingSecret);
		// Track endpoints live outside /api/v1/mail/* because the JWT
		// middleware guards that whole subtree — recipients aren't logged in.
		const unsubscribeUrl = `${this.baseUrl}/api/v1/track/unsubscribe/${token}`;
		const webViewUrl = `${this.baseUrl}/api/v1/track/view/${campaignId}`;
		const openPixelUrl = `${this.baseUrl}/api/v1/track/open/${token}`;

		// Two replace passes — placeholders in both text and html bodies.
		const replaceAll = (s: string) =>
			s
				.replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
				.replaceAll('#unsubscribe-preview', unsubscribeUrl)
				.replaceAll('{{web_view_url}}', webViewUrl)
				.replaceAll('#web-view-preview', webViewUrl);

		let html = replaceAll(inlinedHtml);

		// Inject the open pixel just before </body>. No-op for malformed
		// HTML — we still send.
		const pixel = `<img src="${openPixelUrl}" width="1" height="1" alt="" style="display:block;border:0;width:1px;height:1px;">`;
		if (html.includes('</body>')) {
			html = html.replace('</body>', `${pixel}</body>`);
		} else {
			html = `${html}\n${pixel}`;
		}

		return { html, text: '', unsubscribeUrl, webViewUrl };
	}

	/**
	 * Run the bulk send. Returns aggregate stats. Blocks for the duration
	 * of the send (MVP — see module header).
	 */
	async run(input: BulkSendInput): Promise<BulkSendResult> {
		if (input.recipients.length === 0) {
			throw new Error('No recipients provided');
		}
		if (input.recipients.length > input.maxRecipients) {
			throw new Error(
				`Recipient count ${input.recipients.length} exceeds cap ${input.maxRecipients}`
			);
		}

		const account = await this.accountService.getDefaultAccount(input.userId);
		if (!account?.stalwartAccountId) {
			throw new Error('No mail account configured for this user');
		}

		const now = new Date();

		// 1. Persist campaign row (mirror of the webapp's campaign for
		//    server-side tracking joins).
		await this.db
			.insert(campaigns)
			.values({
				id: input.campaignId,
				userId: input.userId,
				subject: input.subject,
				fromEmail: input.fromEmail,
				fromName: input.fromName,
				sentAt: now,
				totalRecipients: input.recipients.length,
			})
			.onConflictDoNothing();

		const inlinedHtml = this.inlineOnce(input.htmlBody);
		const result: BulkSendResult = {
			campaignId: input.campaignId,
			accepted: input.recipients.length,
			delivered: 0,
			failed: 0,
			errors: [],
		};

		// 2. Loop. One send row per recipient, written first (status=queued)
		//    so a crash mid-loop leaves the DB truthful about who got a
		//    mail attempt.
		for (const recipient of input.recipients) {
			const sendId = crypto.randomUUID();
			const nonce = generateNonce();
			const sendRow: NewBroadcastSend = {
				id: sendId,
				campaignId: input.campaignId,
				recipientEmail: recipient.email,
				recipientName: recipient.name ?? null,
				recipientContactId: recipient.contactId ?? null,
				trackingNonce: nonce,
				status: 'queued',
			};
			await this.db.insert(sends).values(sendRow);

			const { html } = this.substituteUrls(inlinedHtml, input.campaignId, sendId, nonce);
			// Text body: also substitute URL placeholders so plain-text
			// clients get working links. Sign once per recipient.
			const textToken = signToken(
				{ campaignId: input.campaignId, sendId, nonce },
				this.trackingSecret
			);
			const textUnsubUrl = `${this.baseUrl}/api/v1/track/unsubscribe/${textToken}`;
			const text = input.textBody
				.replaceAll('{{unsubscribe_url}}', textUnsubUrl)
				.replaceAll('[Abmelde-Link wird beim Versand eingefügt]', textUnsubUrl);

			try {
				await this.jmap.submitEmail(account.stalwartAccountId, {
					from: { name: input.fromName, email: input.fromEmail },
					to: [{ name: recipient.name ?? null, email: recipient.email }],
					subject: input.subject,
					textBody: text,
					htmlBody: html,
				});
				await this.db
					.update(sends)
					.set({ status: 'sent', sentAt: new Date() })
					.where(eqSendId(sendId));
				result.delivered++;
			} catch (err) {
				const reason = err instanceof Error ? err.message : String(err);
				await this.db
					.update(sends)
					.set({
						status: 'failed',
						bounceReason: reason,
					})
					.where(eqSendId(sendId));
				result.failed++;
				result.errors.push({ email: recipient.email, reason });
			}
		}

		return result;
	}
}

// Small local helper so we don't depend on drizzle-orm's exported `eq`
// right here — keeps this file free of orm-plumbing imports beyond what
// it actually needs.
import { eq } from 'drizzle-orm';
function eqSendId(id: string) {
	return eq(sends.id, id);
}
