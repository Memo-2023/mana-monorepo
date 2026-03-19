import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	real,
	jsonb,
	pgEnum,
	index,
} from 'drizzle-orm/pg-core';
import { boards } from './boards.schema';
import { images } from './images.schema';

export const itemTypeEnum = pgEnum('item_type', ['image', 'text']);

export interface TextProperties {
	fontFamily?: string;
	fontWeight?: 'normal' | 'bold';
	fontStyle?: 'normal' | 'italic';
	textAlign?: 'left' | 'center' | 'right';
	lineHeight?: number;
}

export const boardItems = pgTable(
	'board_items',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		boardId: uuid('board_id')
			.notNull()
			.references(() => boards.id, { onDelete: 'cascade' }),
		imageId: uuid('image_id').references(() => images.id, { onDelete: 'cascade' }),

		itemType: itemTypeEnum('item_type').default('image').notNull(),

		positionX: real('position_x').default(0).notNull(),
		positionY: real('position_y').default(0).notNull(),
		scaleX: real('scale_x').default(1).notNull(),
		scaleY: real('scale_y').default(1).notNull(),
		rotation: real('rotation').default(0).notNull(),
		zIndex: integer('z_index').default(0).notNull(),
		opacity: real('opacity').default(1).notNull(),
		width: integer('width'),
		height: integer('height'),

		textContent: text('text_content'),
		fontSize: integer('font_size'),
		color: text('color'),
		properties: jsonb('properties').$type<TextProperties>(),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		boardIdIdx: index('board_items_board_id_idx').on(table.boardId),
		imageIdIdx: index('board_items_image_id_idx').on(table.imageId),
	})
);

export type BoardItem = typeof boardItems.$inferSelect;
export type NewBoardItem = typeof boardItems.$inferInsert;
