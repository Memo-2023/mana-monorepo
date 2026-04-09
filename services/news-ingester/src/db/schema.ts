/**
 * News schema — public pool of curated articles.
 *
 * This is the *shared* article pool that the ingester writes into and the
 * unified mana-api reads from for the News Hub feed. It is intentionally
 * not user-scoped: the same article row is visible to every user. Per-user
 * personalization (interests, blocklist, reactions) lives client-side in
 * the unified Mana app's IndexedDB, not here.
 *
 * Articles older than 30 days are pruned by the ingester. Saving an
 * article into a user's reading list copies the row into their local
 * encrypted `newsArticles` table — the pool is fire-and-forget.
 */

import { pgSchema, uuid, integer, text, timestamp, index } from 'drizzle-orm/pg-core';

export const newsSchema = pgSchema('news');

/**
 * Pool of curated articles ingested from public RSS/JSON feeds.
 *
 * `urlHash` (sha256 of originalUrl) is the dedupe key — if the same URL
 * shows up in two feeds, only the first wins. `topic` is assigned by the
 * ingester from a static source→topic mapping; we do not classify content.
 */
export const curatedArticles = newsSchema.table(
	'curated_articles',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		urlHash: text('url_hash').notNull().unique(),
		originalUrl: text('original_url').notNull(),
		title: text('title').notNull(),
		excerpt: text('excerpt'),
		content: text('content'),
		htmlContent: text('html_content'),
		author: text('author'),
		siteName: text('site_name').notNull(),
		sourceSlug: text('source_slug').notNull(),
		imageUrl: text('image_url'),
		topic: text('topic').notNull(),
		language: text('language').notNull(),
		wordCount: integer('word_count'),
		readingTimeMinutes: integer('reading_time_minutes'),
		publishedAt: timestamp('published_at', { withTimezone: true }),
		ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		topicPublishedIdx: index('curated_topic_published_idx').on(table.topic, table.publishedAt),
		langPublishedIdx: index('curated_lang_published_idx').on(table.language, table.publishedAt),
		sourceIdx: index('curated_source_idx').on(table.sourceSlug),
		ingestedAtIdx: index('curated_ingested_at_idx').on(table.ingestedAt),
	})
);

export type CuratedArticle = typeof curatedArticles.$inferSelect;
export type NewCuratedArticle = typeof curatedArticles.$inferInsert;
