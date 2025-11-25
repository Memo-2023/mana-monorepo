import { pgTable, uuid, text, timestamp, boolean, integer, real, pgEnum, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { categories } from './categories';

export const articleTypeEnum = pgEnum('article_type', ['feed', 'summary', 'in_depth', 'saved']);
export const articleSourceEnum = pgEnum('article_source', ['ai', 'user_saved']);
export const summaryPeriodEnum = pgEnum('summary_period', ['morning', 'noon', 'evening', 'night']);

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Core fields
  type: articleTypeEnum('type').notNull(),
  sourceOrigin: articleSourceEnum('source_origin').default('ai').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  summary: text('summary'),

  // For user-saved articles
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  originalUrl: text('original_url'),
  parsedContent: text('parsed_content'),
  isArchived: boolean('is_archived').default(false),

  // Metadata
  categoryId: uuid('category_id').references(() => categories.id),
  sourceUrl: text('source_url'),
  sourceName: text('source_name'),
  sourceDomain: text('source_domain'),
  author: text('author'),
  imageUrl: text('image_url'),

  // AI-generated metadata
  aiTags: text('ai_tags').array(),
  sentimentScore: real('sentiment_score'),

  // Reading metrics
  readingTimeMinutes: integer('reading_time_minutes'),
  wordCount: integer('word_count'),

  // Summary-specific fields
  summaryDate: timestamp('summary_date'),
  summaryPeriod: summaryPeriodEnum('summary_period'),
  includedArticleIds: uuid('included_article_ids').array(),

  // In-depth specific fields
  keyInsights: text('key_insights'), // JSON string
  dataVisualizations: text('data_visualizations'), // JSON string
  relatedArticleIds: uuid('related_article_ids').array(),

  // Timestamps
  publishedAt: timestamp('published_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('articles_type_idx').on(table.type),
  index('articles_user_idx').on(table.userId),
  index('articles_source_origin_idx').on(table.sourceOrigin),
  index('articles_published_at_idx').on(table.publishedAt),
  index('articles_category_idx').on(table.categoryId),
]);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
