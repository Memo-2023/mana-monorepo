import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { files } from './files.schema';
import { tags } from './tags.schema';

export const fileTags = pgTable(
	'file_tags',
	{
		fileId: uuid('file_id')
			.references(() => files.id, { onDelete: 'cascade' })
			.notNull(),
		tagId: uuid('tag_id')
			.references(() => tags.id, { onDelete: 'cascade' })
			.notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.fileId, table.tagId] }),
	})
);

export const fileTagsRelations = relations(fileTags, ({ one }) => ({
	file: one(files, {
		fields: [fileTags.fileId],
		references: [files.id],
	}),
	tag: one(tags, {
		fields: [fileTags.tagId],
		references: [tags.id],
	}),
}));

export type FileTag = typeof fileTags.$inferSelect;
export type NewFileTag = typeof fileTags.$inferInsert;
