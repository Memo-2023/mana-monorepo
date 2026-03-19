import { pgTable, uuid, varchar, real, integer, index } from 'drizzle-orm/pg-core';
import { beats } from './beats.schema';

export const markers = pgTable(
	'markers',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		beatId: uuid('beat_id')
			.references(() => beats.id, { onDelete: 'cascade' })
			.notNull(),
		type: varchar('type', { length: 50 }).notNull(),
		label: varchar('label', { length: 100 }),
		startTime: real('start_time').notNull(),
		endTime: real('end_time'),
		color: varchar('color', { length: 7 }),
		sortOrder: integer('sort_order'),
	},
	(table) => [index('markers_beat_id_idx').on(table.beatId)]
);

export type Marker = typeof markers.$inferSelect;
export type NewMarker = typeof markers.$inferInsert;
