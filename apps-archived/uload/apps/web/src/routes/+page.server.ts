import { fail } from '@sveltejs/kit';
import { pb, generateShortCode, type Link, type Click, type User } from '$lib/pocketbase';
import { getCollection } from '$lib/content';
import type { BlogPostWithMeta } from '../content/config';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	try {
		const filter = locals.user ? `user_id="${locals.user.id}"` : '';
		const links = await locals.pb.collection('links').getList<Link>(1, locals.user ? 50 : 10, {
			filter,
			sort: '-created',
			expand: 'user',
		});

		const linksWithClicks = await Promise.all(
			links.items.map(async (link) => {
				const clicks = await locals.pb.collection('clicks').getList(1, 1, {
					filter: `link_id="${link.id}"`,
				});
				return {
					...link,
					clicks: clicks.totalItems,
				};
			})
		);

		// Fetch global statistics
		const [usersStats, linksStats, foldersStats, clicksStats] = await Promise.all([
			locals.pb.collection('users').getList<User>(1, 1),
			locals.pb.collection('links').getList<Link>(1, 1),
			locals.pb.collection('folders').getList(1, 1),
			locals.pb.collection('clicks').getList<Click>(1, 1),
		]).catch(() => [{ totalItems: 0 }, { totalItems: 0 }, { totalItems: 0 }, { totalItems: 0 }]);

		// Fetch latest blog posts
		const blogPosts = await getCollection<BlogPostWithMeta>('blog').catch(() => []);

		return {
			links: linksWithClicks,
			globalStats: {
				totalUsers: usersStats.totalItems || 0,
				totalLinks: linksStats.totalItems || 0,
				totalFolders: foldersStats.totalItems || 0,
				totalClicks: clicksStats.totalItems || 0,
			},
			blogPosts: blogPosts.slice(0, 3),
		};
	} catch (err) {
		return {
			links: [],
			globalStats: {
				totalUsers: 0,
				totalLinks: 0,
				totalFolders: 0,
				totalClicks: 0,
			},
		};
	}
};

export const actions = {
	create: async ({ request, url, locals }) => {
		console.log('🎯 Home page: Create action called');
		console.log('User:', locals.user?.id || 'Anonymous');

		const data = await request.formData();
		const urlToShorten = data.get('url') as string;
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const expiresIn = data.get('expires_in') as string;
		const maxClicks = data.get('max_clicks') as string;
		const password = data.get('password') as string;

		console.log('📦 Form data:', {
			url: urlToShorten,
			title,
			expiresIn,
			maxClicks,
			hasPassword: !!password,
		});

		if (!urlToShorten) {
			console.error('❌ No URL provided');
			return fail(400, { error: 'URL is required' });
		}

		// Get user's personal workspace if logged in
		let workspaceId = null;
		if (locals.user?.id) {
			try {
				const workspaces = await locals.pb.collection('workspaces').getList(1, 1, {
					filter: `owner="${locals.user.id}" && type="personal"`,
				});
				if (workspaces.items.length > 0) {
					workspaceId = workspaces.items[0].id;
				}
			} catch (err) {
				console.error('Error fetching workspace:', err);
			}
		}

		let shortCode = generateShortCode();
		let attempts = 0;
		const maxAttempts = 10;

		while (attempts < maxAttempts) {
			try {
				let expiresAt = null;
				if (expiresIn) {
					const days = parseInt(expiresIn);
					if (!isNaN(days) && days > 0) {
						const date = new Date();
						date.setDate(date.getDate() + days);
						expiresAt = date.toISOString();
					}
				}

				console.log('🔄 Attempting to create link with code:', shortCode);
				const link = await locals.pb.collection('links').create({
					workspace_id: workspaceId,
					user_id: locals.user?.id || null,
					original_url: urlToShorten,
					short_code: shortCode,
					title: title || '',
					description: description || '',
					is_active: true,
					expires_at: expiresAt,
					max_clicks: maxClicks ? parseInt(maxClicks) : null,
					password: password || null,
				});

				console.log('✅ Link created successfully:', link);
				return {
					success: true,
					shortUrl: `${url.origin}/${link.short_code}`,
					link,
				};
			} catch (err: any) {
				console.error('❌ Error creating link:', err);
				console.error('Error details:', {
					message: err?.message,
					data: err?.data,
					response: err?.response,
				});

				if (err?.data?.data?.short_code?.code === 'validation_not_unique') {
					shortCode = generateShortCode();
					attempts++;
					console.log('🔄 Code collision, retrying with:', shortCode);
				} else {
					console.error('🔥 Fatal error, returning failure');
					return fail(400, { error: err?.message || 'Failed to create short link' });
				}
			}
		}

		return fail(400, { error: 'Could not generate unique short code' });
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		try {
			await locals.pb.collection('links').delete(id);
			return { deleted: true };
		} catch (err) {
			return fail(400, { error: 'Failed to delete link' });
		}
	},
} satisfies Actions;
