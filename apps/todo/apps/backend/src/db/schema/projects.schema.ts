import {
	pgTable,
	uuid,
	timestamp,
	varchar,
	text,
	boolean,
	integer,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';

export interface ProjectSettings {
	defaultView?: 'list' | 'board';
	showCompletedTasks?: boolean;
	sortBy?: 'dueDate' | 'priority' | 'createdAt' | 'order';
	sortOrder?: 'asc' | 'desc';
}

export const projects = pgTable(
	'projects',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id').notNull(),
		name: varchar('name', { length: 255 }).notNull(),
		description: text('description'),
		color: varchar('color', { length: 7 }).default('#3B82F6'),
		icon: varchar('icon', { length: 50 }),
		order: integer('order').default(0),
		isArchived: boolean('is_archived').default(false),
		isDefault: boolean('is_default').default(false),
		settings: jsonb('settings').$type<ProjectSettings>(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		userIdx: index('projects_user_idx').on(table.userId),
		orderIdx: index('projects_order_idx').on(table.userId, table.order),
	})
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
