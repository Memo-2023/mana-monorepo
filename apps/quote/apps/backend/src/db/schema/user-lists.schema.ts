import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const userLists = pgTable('user_lists', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  quoteIds: jsonb('quote_ids').$type<string[]>().default([]), // References static quote IDs from shared package
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type UserList = typeof userLists.$inferSelect;
export type NewUserList = typeof userLists.$inferInsert;
