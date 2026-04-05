/**
 * Generic GDPR admin routes for Hono servers.
 *
 * Provides user-data count and deletion endpoints called by
 * mana-auth for GDPR compliance (right to be forgotten).
 *
 * Each app defines which tables contain user data; this module
 * handles the routing and service-key authentication.
 */

import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { serviceAuthMiddleware } from './auth';

interface UserTable {
	/** Drizzle table reference */
	table: PgTable;
	/** Name shown in the response (e.g. "tasks", "favorites") */
	name: string;
	/** The user_id column on this table */
	userIdColumn: ReturnType<typeof sql>;
}

/**
 * Create admin routes for GDPR compliance.
 *
 * Usage:
 * ```ts
 * import { adminRoutes } from '@mana/shared-hono/admin';
 * import { tasks, projects, reminders } from './db';
 *
 * app.route('/api/v1/admin', adminRoutes(db, [
 *   { table: tasks, name: 'tasks', userIdColumn: tasks.userId },
 *   { table: projects, name: 'projects', userIdColumn: projects.userId },
 *   { table: reminders, name: 'reminders', userIdColumn: reminders.userId },
 * ]));
 * ```
 */
export function adminRoutes(db: any, tables: UserTable[]): Hono {
	const route = new Hono();

	route.use('/*', serviceAuthMiddleware());

	/** Get user data counts across all tables. */
	route.get('/user-data/:userId', async (c) => {
		const userId = c.req.param('userId');
		const counts: Record<string, number> = {};

		for (const { table, name, userIdColumn } of tables) {
			const [result] = await db
				.select({ count: sql<number>`count(*)` })
				.from(table)
				.where(eq(userIdColumn, userId));
			counts[name] = Number(result?.count ?? 0);
		}

		return c.json({ userId, counts });
	});

	/** Delete all user data (GDPR right to be forgotten). */
	route.delete('/user-data/:userId', async (c) => {
		const userId = c.req.param('userId');

		// Delete in reverse order (children before parents if there are FKs)
		for (const { table, userIdColumn } of [...tables].reverse()) {
			await db.delete(table).where(eq(userIdColumn, userId));
		}

		return c.json({ userId, deleted: true, message: 'All user data deleted' });
	});

	return route;
}
