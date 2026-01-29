import { pgTable, uuid, text, integer, timestamp, jsonb, real } from 'drizzle-orm/pg-core';
import { researchResults } from './research.schema';

export const sources = pgTable('sources', {
	id: uuid('id').primaryKey().defaultRandom(),
	researchResultId: uuid('research_result_id')
		.notNull()
		.references(() => researchResults.id, { onDelete: 'cascade' }),

	// Source metadata
	url: text('url').notNull(),
	title: text('title').notNull(),
	snippet: text('snippet'),
	domain: text('domain'),

	// Content extraction
	extractedContent: text('extracted_content'),
	contentMarkdown: text('content_markdown'),
	wordCount: integer('word_count'),
	readingTime: integer('reading_time'), // in minutes

	// Quality indicators
	relevanceScore: real('relevance_score'), // 0-1 score from search
	position: integer('position'), // Position in search results
	engine: text('engine'), // Which search engine found this

	// Publication info
	author: text('author'),
	publishedDate: timestamp('published_date', { withTimezone: true }),
	siteName: text('site_name'),

	// Additional metadata
	metadata: jsonb('metadata').default({}),

	// Timestamps
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	extractedAt: timestamp('extracted_at', { withTimezone: true }),
});

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
