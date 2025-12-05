import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	boolean,
	integer,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { emailAccounts } from './email-accounts.schema';
import { folders } from './folders.schema';

export interface EmailAddress {
	email: string;
	name?: string;
}

export const emails = pgTable(
	'emails',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		accountId: uuid('account_id')
			.references(() => emailAccounts.id, { onDelete: 'cascade' })
			.notNull(),
		folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
		userId: varchar('user_id', { length: 255 }).notNull(),
		threadId: uuid('thread_id'), // For conversation threading

		// Message identifiers
		messageId: varchar('message_id', { length: 500 }).notNull(), // RFC 2822 Message-ID
		externalId: varchar('external_id', { length: 255 }), // Provider-specific ID

		// Headers
		subject: text('subject'),
		fromAddress: varchar('from_address', { length: 255 }),
		fromName: varchar('from_name', { length: 255 }),
		toAddresses: jsonb('to_addresses').$type<EmailAddress[]>(),
		ccAddresses: jsonb('cc_addresses').$type<EmailAddress[]>(),
		bccAddresses: jsonb('bcc_addresses').$type<EmailAddress[]>(),
		replyTo: varchar('reply_to', { length: 255 }),
		inReplyTo: varchar('in_reply_to', { length: 500 }), // Parent message ID
		references: jsonb('references').$type<string[]>(), // Thread references

		// Content
		snippet: text('snippet'), // Preview text (first ~200 chars)
		bodyPlain: text('body_plain'),
		bodyHtml: text('body_html'),

		// Dates
		sentAt: timestamp('sent_at', { withTimezone: true }),
		receivedAt: timestamp('received_at', { withTimezone: true }),

		// Flags
		isRead: boolean('is_read').default(false),
		isStarred: boolean('is_starred').default(false),
		isDraft: boolean('is_draft').default(false),
		isDeleted: boolean('is_deleted').default(false),
		isSpam: boolean('is_spam').default(false),
		hasAttachments: boolean('has_attachments').default(false),

		// AI-generated metadata
		aiSummary: text('ai_summary'),
		aiCategory: varchar('ai_category', { length: 50 }), // work, personal, newsletter, etc.
		aiPriority: varchar('ai_priority', { length: 20 }), // high, medium, low
		aiSentiment: varchar('ai_sentiment', { length: 20 }), // positive, neutral, negative
		aiSuggestedReplies: jsonb('ai_suggested_replies').$type<string[]>(),

		// Size and metadata
		size: integer('size'), // bytes
		headers: jsonb('headers').$type<Record<string, string>>(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('emails_account_id_idx').on(table.accountId),
		index('emails_folder_id_idx').on(table.folderId),
		index('emails_thread_id_idx').on(table.threadId),
		index('emails_message_id_idx').on(table.messageId),
		index('emails_received_at_idx').on(table.receivedAt),
		index('emails_user_id_idx').on(table.userId),
	]
);

export type Email = typeof emails.$inferSelect;
export type NewEmail = typeof emails.$inferInsert;
