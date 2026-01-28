import { pgTable, text, timestamp, uuid, integer } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	matrixUserId: text('matrix_user_id').notNull(),
	name: text('name').notNull(),
	status: text('status').notNull().default('active'), // active, archived
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projectItems = pgTable('project_items', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	type: text('type').notNull(), // photo, voice, text
	content: text('content'), // text content or transcription
	mediaUrl: text('media_url'), // S3 URL for media
	mediaMxcUrl: text('media_mxc_url'), // Matrix MXC URL
	duration: integer('duration'), // Voice duration in seconds
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const generations = pgTable('generations', {
	id: uuid('id').primaryKey().defaultRandom(),
	projectId: uuid('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	style: text('style').notNull(),
	content: text('content').notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});
