import { pgTable, uuid, timestamp, boolean, real, integer, index, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { articles } from './articles';

export const userArticleInteractions = pgTable('user_article_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),

  // Interaction states
  isRead: boolean('is_read').default(false).notNull(),
  isSaved: boolean('is_saved').default(false).notNull(),
  readProgress: real('read_progress').default(0), // 0.0 to 1.0
  rating: integer('rating'), // 1-5
  shareCount: integer('share_count').default(0).notNull(),

  // Timestamps
  openedAt: timestamp('opened_at'),
  readAt: timestamp('read_at'),
  savedAt: timestamp('saved_at'),
  ratedAt: timestamp('rated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique('user_article_unique').on(table.userId, table.articleId),
  index('interactions_user_idx').on(table.userId),
  index('interactions_article_idx').on(table.articleId),
]);

export type UserArticleInteraction = typeof userArticleInteractions.$inferSelect;
export type NewUserArticleInteraction = typeof userArticleInteractions.$inferInsert;
