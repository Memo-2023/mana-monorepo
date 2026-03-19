import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	boolean,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';
import { spaces } from './spaces.schema';

export interface DocumentMetadata {
	tags?: string[];
	word_count?: number;
	token_count?: number;
	parent_document?: string;
	version?: number;
	generation_type?: 'summary' | 'continuation' | 'rewrite' | 'ideas';
	model_used?: string;
	prompt_used?: string;
	original_title?: string;
	version_history?: Array<{
		id: string;
		title: string;
		type: string;
		created_at: string;
		is_original: boolean;
	}>;
	[key: string]: unknown;
}

export const documents = pgTable(
	'documents',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		spaceId: uuid('space_id').references(() => spaces.id, { onDelete: 'cascade' }),
		title: varchar('title', { length: 500 }).notNull(),
		content: text('content'),
		type: varchar('type', { length: 20 }).notNull().default('text'),
		shortId: varchar('short_id', { length: 20 }),
		pinned: boolean('pinned').default(false),
		metadata: jsonb('metadata').$type<DocumentMetadata>(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('documents_user_id_idx').on(table.userId),
		index('documents_space_id_idx').on(table.spaceId),
		index('documents_type_idx').on(table.type),
	]
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
