/**
 * Reminders route — server-side reminder management.
 *
 * Reminders need to be server-side because push/email notifications
 * are sent by the server at the scheduled time.
 */

import { Hono } from 'hono';
import { eq, and, asc } from 'drizzle-orm';
import { authMiddleware } from '../lib/auth';
import { db, reminders, tasks } from '../db';

const reminderRoutes = new Hono();

reminderRoutes.use('/*', authMiddleware());

/** List reminders for a task. */
reminderRoutes.get('/tasks/:taskId/reminders', async (c) => {
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

/** Create a reminder. */
reminderRoutes.post('/tasks/:taskId/reminders', async (c) => {
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

/** Delete a reminder. */
reminderRoutes.delete('/reminders/:id', async (c) => {
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

export { reminderRoutes };
