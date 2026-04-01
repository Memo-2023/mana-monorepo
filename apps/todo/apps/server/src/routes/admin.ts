/**
 * Admin route — GDPR compliance + user data aggregation.
 * Called by mana-core-auth, protected by service key.
 */

import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { serviceAuthMiddleware } from '@manacore/shared-hono';
import { db, tasks, projects, reminders } from '../db';

const adminRoutes = new Hono();

adminRoutes.use('/*', serviceAuthMiddleware());

/** Get user data counts. */
adminRoutes.get('/user-data/:userId', async (c) => {
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

/** Delete all user data (GDPR right to be forgotten). */
adminRoutes.delete('/user-data/:userId', async (c) => {
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

export { adminRoutes };
