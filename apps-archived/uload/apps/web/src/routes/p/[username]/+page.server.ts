import { error } from '@sveltejs/kit';
import { RESERVED_USERNAMES } from '$lib/username';
import type { PageServerLoad } from './$types';
import { users, links, clicks } from '$lib/db/schema';
import { eq, and, desc, count, gt } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { username } = params;

	// Check if it's a reserved username (route to 404)
	if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
		error(404, 'Page not found');
	}

	try {
		// Find user by username
		const [user] = await locals.db
			.select()
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		if (!user) {
			error(404, 'User not found');
		}

		// Get all active links for this user with click counts
		const userLinks = await locals.db
			.select({
				id: links.id,
				shortCode: links.shortCode,
				customCode: links.customCode,
				originalUrl: links.originalUrl,
				title: links.title,
				description: links.description,
				isActive: links.isActive,
				expiresAt: links.expiresAt,
				clickCount: links.clickCount,
				qrCodeUrl: links.qrCodeUrl,
				tags: links.tags,
				createdAt: links.createdAt,
			})
			.from(links)
			.where(and(eq(links.userId, user.id), eq(links.isActive, true)))
			.orderBy(desc(links.createdAt))
			.limit(100);

		// Get actual click counts from clicks table for more accuracy
		const linksWithStats = await Promise.all(
			userLinks.map(async (link) => {
				const [clickResult] = await locals.db
					.select({ count: count() })
					.from(clicks)
					.where(eq(clicks.linkId, link.id));

				return {
					...link,
					clicks: clickResult?.count || 0,
				};
			})
		);

		// Filter out expired links
		const now = new Date();
		const activeLinks = linksWithStats.filter((link) => {
			if (link.expiresAt && new Date(link.expiresAt) < now) {
				return false;
			}
			return true;
		});

		// All links go to the main list (no folders)
		const linksByFolder = new Map<string | null, typeof activeLinks>();
		linksByFolder.set(null, activeLinks);

		// TODO: Load cards when cards table is added to schema
		// For now, return empty cards array
		const cards: any[] = [];

		return {
			profileUser: {
				id: user.id,
				username: user.username,
				name: user.name,
				avatar: null, // File handling will be added with R2
				avatarUrl: user.avatarUrl,
				bio: user.bio,
				location: user.location,
				website: user.website,
				github: user.github,
				twitter: user.twitter,
				linkedin: user.linkedin,
				instagram: user.instagram,
				showClickStats: user.showClickStats,
				profileBackground: user.profileBackground || '#f9fafb',
				created: user.createdAt,
			},
			folders: [],
			linksByFolder,
			links: activeLinks,
			totalClicks: activeLinks.reduce((sum, link) => sum + link.clicks, 0),
			cards: cards,
		};
	} catch (err) {
		console.error('[PROFILE] Error loading profile:', err);
		error(404, 'User not found');
	}
};
