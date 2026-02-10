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
import type { FigureRarity, FigureUserInput } from '@figgos/shared';

export const figures = pgTable(
	'figures',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: text('user_id').notNull(),
		name: varchar('name', { length: 200 }).notNull(),
		userInput: jsonb('user_input').$type<FigureUserInput>().notNull(),
		imageUrl: text('image_url'),
		rarity: varchar('rarity', { length: 20 }).default('common').notNull().$type<FigureRarity>(),
		isPublic: boolean('is_public').default(false).notNull(),
		isArchived: boolean('is_archived').default(false).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('figures_user_idx').on(table.userId),
		createdAtIdx: index('figures_created_at_idx').on(table.createdAt),
	})
);

export type Figure = typeof figures.$inferSelect;
export type NewFigure = typeof figures.$inferInsert;
