/**
 * JMAP Client — Communicates with Stalwart mail server.
 *
 * Stalwart supports JMAP (RFC 8620) natively on port 8080.
 * This client uses HTTP Basic Auth with admin credentials,
 * scoped to individual user accounts via JMAP accountId.
 */

import type { Config } from '../config';

// ─── JMAP Types ─────────────────────────────────────────────

export interface JmapMailbox {
	id: string;
	name: string;
	role: string | null;
	totalEmails: number;
	unreadEmails: number;
	sortOrder: number;
}

export interface JmapEmailAddress {
	name: string | null;
	email: string;
}

export interface JmapEmail {
	id: string;
	threadId: string;
	mailboxIds: Record<string, boolean>;
	from: JmapEmailAddress[] | null;
	to: JmapEmailAddress[] | null;
	cc: JmapEmailAddress[] | null;
	subject: string;
	receivedAt: string;
	preview: string;
	size: number;
	keywords: Record<string, boolean>;
	hasAttachment: boolean;
	bodyValues?: Record<string, { value: string; isEncodingProblem: boolean }>;
	htmlBody?: Array<{ partId: string; type: string }>;
	textBody?: Array<{ partId: string; type: string }>;
}

export interface JmapThread {
	id: string;
	emailIds: string[];
}

// ─── Client ─────────────────────────────────────────────────

export class JmapClient {
	private baseUrl: string;
	private authHeader: string;

	constructor(config: Config['stalwart']) {
		this.baseUrl = config.jmapUrl;
		this.authHeader =
			'Basic ' + Buffer.from(`${config.adminUser}:${config.adminPassword}`).toString('base64');
	}

	private async call(methodCalls: unknown[][], accountId: string): Promise<unknown[][]> {
		const response = await fetch(`${this.baseUrl}/jmap`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: this.authHeader,
			},
			body: JSON.stringify({
				using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
				methodCalls: methodCalls.map((call) => {
					// Inject accountId into each method call's arguments
					if (call[1] && typeof call[1] === 'object') {
						(call[1] as Record<string, unknown>).accountId = accountId;
					}
					return call;
				}),
			}),
		});

		if (!response.ok) {
			const text = await response.text();
			throw new Error(`JMAP call failed (${response.status}): ${text}`);
		}

		const result = (await response.json()) as { methodResponses: unknown[][] };
		return result.methodResponses;
	}

	/** Get all mailboxes (folders/labels) for an account. */
	async getMailboxes(accountId: string): Promise<JmapMailbox[]> {
		const responses = await this.call(
			[
				[
					'Mailbox/get',
					{ properties: ['id', 'name', 'role', 'totalEmails', 'unreadEmails', 'sortOrder'] },
					'mb-0',
				],
			],
			accountId
		);
		const [, result] = responses[0];
		return ((result as Record<string, unknown>).list as JmapMailbox[]) || [];
	}

	/** Query email IDs in a mailbox, sorted by date descending. */
	async queryEmails(
		accountId: string,
		opts: {
			mailboxId?: string;
			limit?: number;
			position?: number;
			filter?: Record<string, unknown>;
		} = {}
	): Promise<{ ids: string[]; total: number }> {
		const filter: Record<string, unknown> = { ...opts.filter };
		if (opts.mailboxId) filter.inMailbox = opts.mailboxId;

		const responses = await this.call(
			[
				[
					'Email/query',
					{
						filter: Object.keys(filter).length > 0 ? filter : undefined,
						sort: [{ property: 'receivedAt', isAscending: false }],
						limit: opts.limit ?? 50,
						position: opts.position ?? 0,
					},
					'eq-0',
				],
			],
			accountId
		);
		const [, result] = responses[0];
		const r = result as Record<string, unknown>;
		return {
			ids: (r.ids as string[]) || [],
			total: (r.total as number) || 0,
		};
	}

	/** Get full email objects by ID. */
	async getEmails(
		accountId: string,
		emailIds: string[],
		properties?: string[]
	): Promise<JmapEmail[]> {
		if (emailIds.length === 0) return [];

		const responses = await this.call(
			[
				[
					'Email/get',
					{
						ids: emailIds,
						properties: properties ?? [
							'id',
							'threadId',
							'mailboxIds',
							'from',
							'to',
							'cc',
							'subject',
							'receivedAt',
							'preview',
							'size',
							'keywords',
							'hasAttachment',
						],
						fetchHTMLBodyValues: true,
						fetchTextBodyValues: true,
					},
					'eg-0',
				],
			],
			accountId
		);
		const [, result] = responses[0];
		return ((result as Record<string, unknown>).list as JmapEmail[]) || [];
	}

	/** Get full email with body content. */
	async getEmailWithBody(accountId: string, emailId: string): Promise<JmapEmail | null> {
		const emails = await this.getEmails(
			accountId,
			[emailId],
			[
				'id',
				'threadId',
				'mailboxIds',
				'from',
				'to',
				'cc',
				'subject',
				'receivedAt',
				'preview',
				'size',
				'keywords',
				'hasAttachment',
				'bodyValues',
				'htmlBody',
				'textBody',
			]
		);
		return emails[0] ?? null;
	}

	/** Get threads by ID. */
	async getThreads(accountId: string, threadIds: string[]): Promise<JmapThread[]> {
		if (threadIds.length === 0) return [];

		const responses = await this.call([['Thread/get', { ids: threadIds }, 'tg-0']], accountId);
		const [, result] = responses[0];
		return ((result as Record<string, unknown>).list as JmapThread[]) || [];
	}

	/** Update email keywords (read, flagged) or mailbox membership. */
	async updateEmail(
		accountId: string,
		emailId: string,
		update: {
			isRead?: boolean;
			isFlagged?: boolean;
			mailboxIds?: Record<string, boolean>;
		}
	): Promise<void> {
		const patch: Record<string, unknown> = {};

		if (update.isRead !== undefined) {
			patch['keywords/$seen'] = update.isRead || null;
		}
		if (update.isFlagged !== undefined) {
			patch['keywords/$flagged'] = update.isFlagged || null;
		}
		if (update.mailboxIds) {
			patch.mailboxIds = update.mailboxIds;
		}

		await this.call([['Email/set', { update: { [emailId]: patch } }, 'eu-0']], accountId);
	}

	/** Submit an email for delivery via JMAP. */
	async submitEmail(
		accountId: string,
		email: {
			from: JmapEmailAddress;
			to: JmapEmailAddress[];
			cc?: JmapEmailAddress[];
			bcc?: JmapEmailAddress[];
			subject: string;
			textBody: string;
			htmlBody?: string;
			inReplyTo?: string;
			references?: string[];
		}
	): Promise<string> {
		const emailId = `draft-${Date.now()}`;
		const identityId = accountId;

		// Create + send in a single JMAP batch
		const bodyParts: unknown[] = [];

		if (email.htmlBody) {
			bodyParts.push({ partId: 'html', type: 'text/html' });
		}
		bodyParts.push({ partId: 'text', type: 'text/plain' });

		const bodyValues: Record<string, unknown> = {
			text: { value: email.textBody, charset: 'utf-8' },
		};
		if (email.htmlBody) {
			bodyValues.html = { value: email.htmlBody, charset: 'utf-8' };
		}

		const emailCreate: Record<string, unknown> = {
			from: [email.from],
			to: email.to,
			subject: email.subject,
			bodyValues,
			textBody: [{ partId: 'text', type: 'text/plain' }],
			htmlBody: email.htmlBody ? [{ partId: 'html', type: 'text/html' }] : undefined,
			keywords: { $draft: true },
		};

		if (email.cc) emailCreate.cc = email.cc;
		if (email.bcc) emailCreate.bcc = email.bcc;
		if (email.inReplyTo) emailCreate.inReplyTo = email.inReplyTo;
		if (email.references) emailCreate.references = email.references;

		const responses = await this.call(
			[
				['Email/set', { create: { [emailId]: emailCreate } }, 'ec-0'],
				[
					'EmailSubmission/set',
					{
						create: {
							sub0: {
								emailId: `#${emailId}`,
								identityId,
							},
						},
						onSuccessUpdateEmail: {
							'#sub0': {
								'keywords/$draft': null,
								'keywords/$sent': true,
							},
						},
					},
					'es-0',
				],
			],
			accountId
		);

		const [, createResult] = responses[0];
		const created = (createResult as Record<string, unknown>).created as Record<
			string,
			{ id: string }
		>;
		return created?.[emailId]?.id ?? '';
	}
}
