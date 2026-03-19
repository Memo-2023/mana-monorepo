import {
	pgTable,
	uuid,
	text,
	timestamp,
	varchar,
	boolean,
	jsonb,
	integer,
	index,
} from 'drizzle-orm/pg-core';

export interface SpaceSettings {
	defaultDocType?: 'text' | 'context' | 'prompt';
	[key: string]: unknown;
}

export const spaces = pgTable(
	'spaces',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		settings: jsonb('settings').$type<SpaceSettings>(),
		pinned: boolean('pinned').default(true),
		prefix: varchar('prefix', { length: 10 }),
		textDocCounter: integer('text_doc_counter').default(0),
		contextDocCounter: integer('context_doc_counter').default(0),
		promptDocCounter: integer('prompt_doc_counter').default(0),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('spaces_user_id_idx').on(table.userId)]
);

export type Space = typeof spaces.$inferSelect;
export type NewSpace = typeof spaces.$inferInsert;
