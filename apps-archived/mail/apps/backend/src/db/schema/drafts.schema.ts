import { pgTable, uuid, timestamp, varchar, text, jsonb } from 'drizzle-orm/pg-core';
import { emailAccounts } from './email-accounts.schema';
import { emails, type EmailAddress } from './emails.schema';

export const drafts = pgTable('drafts', {
	id: uuid('id').primaryKey().defaultRandom(),
	accountId: uuid('account_id')
		.references(() => emailAccounts.id, { onDelete: 'cascade' })
		.notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(),

	// Reply context
	replyToEmailId: uuid('reply_to_email_id').references(() => emails.id, { onDelete: 'set null' }),
	replyType: varchar('reply_type', { length: 20 }), // reply, reply-all, forward

	// Content
	subject: text('subject'),
	toAddresses: jsonb('to_addresses').$type<EmailAddress[]>(),
	ccAddresses: jsonb('cc_addresses').$type<EmailAddress[]>(),
	bccAddresses: jsonb('bcc_addresses').$type<EmailAddress[]>(),
	bodyHtml: text('body_html'),
	bodyPlain: text('body_plain'),
	attachmentIds: jsonb('attachment_ids').$type<string[]>(),

	// Scheduling
	scheduledAt: timestamp('scheduled_at', { withTimezone: true }),

	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Draft = typeof drafts.$inferSelect;
export type NewDraft = typeof drafts.$inferInsert;
