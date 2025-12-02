import { pgTable, uuid, timestamp, varchar, text, jsonb } from 'drizzle-orm/pg-core';
import { contacts } from './contacts.schema';

export const contactActivities = pgTable('contact_activities', {
	id: uuid('id').primaryKey().defaultRandom(),
	contactId: uuid('contact_id')
		.references(() => contacts.id, { onDelete: 'cascade' })
		.notNull(),
	userId: varchar('user_id', { length: 255 }).notNull(),
	activityType: varchar('activity_type', { length: 50 }).notNull(),
	// Types: 'created' | 'updated' | 'called' | 'emailed' | 'met' | 'note_added'
	description: text('description'),
	metadata: jsonb('metadata').$type<Record<string, unknown>>(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type ContactActivity = typeof contactActivities.$inferSelect;
export type NewContactActivity = typeof contactActivities.$inferInsert;
