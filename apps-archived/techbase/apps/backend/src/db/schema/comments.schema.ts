import { pgTable, uuid, varchar, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const comments = pgTable('comments', {
	id: uuid('id').defaultRandom().primaryKey(),
	softwareId: varchar('software_id', { length: 255 }).notNull(),
	userName: varchar('user_name', { length: 100 }).notNull(),
	comment: text('comment').notNull(),
	ipHash: varchar('ip_hash', { length: 255 }).notNull(),
	isApproved: boolean('is_approved').default(false),
	isSpam: boolean('is_spam').default(false),
	moderatedAt: timestamp('moderated_at'),
	moderatedBy: varchar('moderated_by', { length: 255 }),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
