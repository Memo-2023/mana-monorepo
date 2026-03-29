import { Hono } from 'hono';
import { eq, and, desc } from 'drizzle-orm';
import { links, users } from '@manacore/uload-database';
import type { Database } from '../db/connection';

export function createPublicRoutes(db: Database) {
	return new Hono().get('/u/:username', async (c) => {
		const username = c.req.param('username');

		const [user] = await db
			.select({ id: users.id, username: users.username, name: users.name, bio: users.bio })
			.from(users)
			.where(and(eq(users.username, username), eq(users.publicProfile, true)))
			.limit(1);

		if (!user) {
			return c.json({ error: 'User not found' }, 404);
		}

		const userLinks = await db
			.select({
				shortCode: links.shortCode,
				title: links.title,
				description: links.description,
				clickCount: links.clickCount,
				createdAt: links.createdAt,
			})
			.from(links)
			.where(and(eq(links.userId, user.id), eq(links.isActive, true)))
			.orderBy(desc(links.createdAt))
			.limit(50);

		return c.json({ user, links: userLinks });
	});
}
