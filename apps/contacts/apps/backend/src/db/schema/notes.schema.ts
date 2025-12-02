import { pgTable, uuid, timestamp, varchar, text, boolean } from 'drizzle-orm/pg-core';
import { contacts } from './contacts.schema';

export const contactNotes = pgTable('contact_notes', {
	id: uuid('id').primaryKey().defaultRandom(),
	contactId: uuid('contact_id')
		.references(() => contacts.id, { onDelete: 'cascade' })
		.notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	content: text('content').notNull(),
	isPinned: boolean('is_pinned').default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ContactNote = typeof contactNotes.$inferSelect;
export type NewContactNote = typeof contactNotes.$inferInsert;
