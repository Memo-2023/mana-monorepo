/**
 * Todo module — RRULE compute + reminders + admin
 * Ported from apps/todo/apps/server
 *
 * All CRUD is handled client-side via local-first + sync.
 * This module provides compute-only endpoints.
 *
 * NOTE: The standalone server also runs a background reminder worker
 * (startReminderWorker) that polls for due reminders and dispatches
 * them via mana-notify. That worker needs to be started separately
 * or integrated into the unified API's startup lifecycle.
 * See: apps/todo/apps/server/src/lib/reminder-worker.ts
 */

import { Hono } from 'hono';
import { rrulestr } from 'rrule';
import { z } from 'zod';
import { eq, and, asc, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { serviceAuthMiddleware } from '@manacore/shared-hono';
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

// ─── DB Schema (minimal, server-only) ──────────────────────

const DATABASE_URL =
	process.env.DATABASE_URL ?? 'postgresql://manacore:devpassword@localhost:5432/mana_platform';

const todoSchema = pgSchema('todo');

const tasks = todoSchema.table('tasks', {
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

const projects = todoSchema.table('projects', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull(),
});

const reminders = todoSchema.table(
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
		taskIdx: index('reminders_task_idx_api').on(table.taskId),
		userIdx: index('reminders_user_idx_api').on(table.userId),
	})
);

const connection = postgres(DATABASE_URL, { max: 5, idle_timeout: 20 });
const db = drizzle(connection, { schema: { tasks, projects, reminders } });

// ─── Routes ────────────────────────────────────────────────

const routes = new Hono();

// ─── RRULE Compute ─────────────────────────────────────────

const NextOccurrenceSchema = z.object({
	rrule: z.string().min(1, 'Missing rrule parameter').max(500, 'RRULE too long (max 500 chars)'),
	recurrenceEndDate: z.string().datetime({ offset: true }).optional(),
	after: z.string().datetime({ offset: true }).optional(),
});

const ValidateSchema = z.object({
	rrule: z.string().min(1).max(500),
});

routes.post('/compute/next-occurrence', async (c) => {
	const parsed = NextOccurrenceSchema.safeParse(await c.req.json());
	if (!parsed.success) {
		return c.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, 400);
	}

	const { rrule: rruleString, recurrenceEndDate, after } = parsed.data;

	try {
		const rule = rrulestr(rruleString);
		const afterDate = after ? new Date(after) : new Date();

		// Validate: not too many occurrences
		const maxOccurrences = 5000;
		const tenYearsFromNow = new Date();
		tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

		const occurrences = rule.between(new Date(), tenYearsFromNow, true, (_, count) => {
			return count < maxOccurrences;
		});

		if (occurrences.length >= maxOccurrences) {
			return c.json({ error: 'RRULE generates too many occurrences (max 5000)' }, 400);
		}

		// Get next occurrence
		const nextDate = rule.after(afterDate, false);

		// Check recurrence end date
		if (recurrenceEndDate) {
			const endDate = new Date(recurrenceEndDate);
			if (!nextDate || nextDate > endDate) {
				return c.json({ nextDate: null, message: 'No more occurrences (past end date)' });
			}
		}

		return c.json({
			nextDate: nextDate?.toISOString() ?? null,
			valid: true,
			totalOccurrences: occurrences.length,
		});
	} catch (err) {
		return c.json(
			{ error: 'Invalid RRULE: ' + (err instanceof Error ? err.message : 'unknown') },
			400
		);
	}
});

routes.post('/compute/validate', async (c) => {
	const parsed = ValidateSchema.safeParse(await c.req.json());
	if (!parsed.success) {
		return c.json({ valid: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' });
	}

	const { rrule: rruleString } = parsed.data;

	try {
		const rule = rrulestr(rruleString);
		const tenYearsFromNow = new Date();
		tenYearsFromNow.setFullYear(tenYearsFromNow.getFullYear() + 10);

		const count = rule.between(new Date(), tenYearsFromNow, true, (_, c) => c < 5000).length;

		return c.json({
			valid: count < 5000,
			occurrences: count,
			error: count >= 5000 ? 'Too many occurrences' : undefined,
		});
	} catch (err) {
		return c.json({ valid: false, error: err instanceof Error ? err.message : 'Invalid RRULE' });
	}
});

// ─── Reminders ─────────────────────────────────────────────

routes.get('/tasks/:taskId/reminders', async (c) => {
	const userId = c.get('userId');
	const taskId = c.req.param('taskId');

	// Verify task belongs to user
	const task = await db.query.tasks.findFirst({
		where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
	});
	if (!task) {
		return c.json({ error: 'Task not found' }, 404);
	}

	const result = await db.query.reminders.findMany({
		where: and(eq(reminders.taskId, taskId), eq(reminders.userId, userId)),
		orderBy: [asc(reminders.minutesBefore)],
	});

	return c.json({ reminders: result });
});

routes.post('/tasks/:taskId/reminders', async (c) => {
	const userId = c.get('userId');
	const taskId = c.req.param('taskId');
	const body = await c.req.json<{
		minutesBefore: number;
		type?: 'push' | 'email' | 'both';
	}>();

	// Verify task
	const task = await db.query.tasks.findFirst({
		where: and(eq(tasks.id, taskId), eq(tasks.userId, userId)),
	});
	if (!task) {
		return c.json({ error: 'Task not found' }, 404);
	}
	if (!task.dueDate) {
		return c.json({ error: 'Cannot create reminder for task without due date' }, 400);
	}

	const dueDate = new Date(task.dueDate);
	const reminderTime = new Date(dueDate.getTime() - body.minutesBefore * 60 * 1000);

	const [created] = await db
		.insert(reminders)
		.values({
			taskId,
			userId,
			minutesBefore: body.minutesBefore,
			reminderTime,
			type: body.type ?? 'push',
		})
		.returning();

	return c.json({ reminder: created }, 201);
});

routes.delete('/reminders/:id', async (c) => {
	const userId = c.get('userId');
	const id = c.req.param('id');

	const existing = await db.query.reminders.findFirst({
		where: and(eq(reminders.id, id), eq(reminders.userId, userId)),
	});
	if (!existing) {
		return c.json({ error: 'Reminder not found' }, 404);
	}

	await db.delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
	return c.json({ success: true });
});

// ─── Admin (GDPR) ──────────────────────────────────────────

const adminSub = new Hono();
adminSub.use('/*', serviceAuthMiddleware());

adminSub.get('/user-data/:userId', async (c) => {
	const userId = c.req.param('userId');

	const [taskCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(tasks)
		.where(eq(tasks.userId, userId));
	const [projectCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(projects)
		.where(eq(projects.userId, userId));
	const [reminderCount] = await db
		.select({ count: sql<number>`count(*)` })
		.from(reminders)
		.where(eq(reminders.userId, userId));

	return c.json({
		userId,
		counts: {
			tasks: Number(taskCount?.count ?? 0),
			projects: Number(projectCount?.count ?? 0),
			reminders: Number(reminderCount?.count ?? 0),
		},
	});
});

adminSub.delete('/user-data/:userId', async (c) => {
	const userId = c.req.param('userId');

	await db.delete(reminders).where(eq(reminders.userId, userId));
	await db.delete(tasks).where(eq(tasks.userId, userId));
	await db.delete(projects).where(eq(projects.userId, userId));

	return c.json({
		userId,
		deleted: true,
		message: 'All user data deleted',
	});
});

routes.route('/admin', adminSub);

export { routes as todoRoutes };
