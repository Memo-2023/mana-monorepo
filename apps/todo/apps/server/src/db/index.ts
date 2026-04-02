/**
 * Database connection via Drizzle ORM + postgres.js
 *
 * Minimal schema — only tables needed by server-side compute.
 * CRUD tables (tasks, projects, labels) are handled client-side.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
	pgSchema,
	uuid,
	text,
	timestamp,
	varchar,
	integer,
	boolean,
	jsonb,
	index,
} from 'drizzle-orm/pg-core';

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://manacore:devpassword@localhost:5432/mana_platform';

const connection = postgres(DATABASE_URL, {
	max: 5,
	idle_timeout: 20,
});

// ─── Schema ────────────────

export const todoSchema = pgSchema('todo');

// ─── Minimal Schema (only what server needs) ────────────────

export const tasks = todoSchema.table('tasks', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
	projectId: uuid('project_id'),
	title: varchar('title', { length: 500 }).notNull(),
	description: text('description'),
	dueDate: timestamp('due_date', { withTimezone: true }),
	dueTime: varchar('due_time', { length: 5 }),
	startDate: timestamp('start_date', { withTimezone: true }),
	priority: varchar('priority', { length: 20 }).default('medium'),
	status: varchar('status', { length: 20 }).default('pending'),
	isCompleted: boolean('is_completed').default(false),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	order: integer('order').default(0),
	recurrenceRule: varchar('recurrence_rule', { length: 500 }),
	recurrenceEndDate: timestamp('recurrence_end_date', { withTimezone: true }),
	lastOccurrence: timestamp('last_occurrence', { withTimezone: true }),
	parentTaskId: uuid('parent_task_id'),
	subtasks: jsonb('subtasks'),
	metadata: jsonb('metadata'),
	columnId: uuid('column_id'),
	columnOrder: integer('column_order'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const projects = todoSchema.table('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
});

export const reminders = todoSchema.table(
	'reminders',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		taskId: uuid('task_id').notNull(),
		userId: text('user_id').notNull(),
		minutesBefore: integer('minutes_before').notNull(),
		reminderTime: timestamp('reminder_time', { withTimezone: true }).notNull(),
		type: varchar('type', { length: 20 }).default('push'),
		status: varchar('status', { length: 20 }).default('pending'),
		sentAt: timestamp('sent_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		taskIdx: index('reminders_task_idx_hono').on(table.taskId),
		userIdx: index('reminders_user_idx_hono').on(table.userId),
	})
);

export const db = drizzle(connection, {
	schema: { tasks, projects, reminders },
});

export type Database = typeof db;
