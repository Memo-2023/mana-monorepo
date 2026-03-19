import { pgTable, uuid, timestamp, varchar, text, boolean, index } from 'drizzle-orm/pg-core';
import { contacts } from './contacts.schema';

export const contactNotes = pgTable(
	'contact_notes',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		contactId: uuid('contact_id')
			.references(() => contacts.id, { onDelete: 'cascade' })
			.notNull(),
		userId: varchar('user_id', { length: 255 }).notNull(),
		content: text('content').notNull(),
		isPinned: boolean('is_pinned').default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		contactIdx: index('contact_notes_contact_idx').on(table.contactId),
		userIdx: index('contact_notes_user_idx').on(table.userId),
		createdAtIdx: index('contact_notes_created_at_idx').on(table.createdAt),
	})
);

export type ContactNote = typeof contactNotes.$inferSelect;
export type NewContactNote = typeof contactNotes.$inferInsert;
