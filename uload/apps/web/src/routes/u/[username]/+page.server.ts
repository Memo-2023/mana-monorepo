import { error } from '@sveltejs/kit';
import { pb, type User, type Link } from '$lib/pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { username } = params;

	try {
		// Find user by username
		const user = await pb.collection('users').getFirstListItem<User>(`username="${username}"`);
		
		// Get user's public links
		const links = await pb.collection('links').getList<Link>(1, 50, {
			filter: `user_id="${user.id}" && is_active=true`,
			sort: '-created'
		});

		return {
			user: {
				id: user.id,
				username: user.username,
				name: user.name,
				bio: user.bio,
				avatar: user.avatar,
				avatarUrl: user.avatar ? pb.getFileUrl(user, user.avatar) : null,
				created: user.created
			},
			links: links.items.map(link => ({
				id: link.id,
				title: link.title,
				short_code: link.short_code,
				clicks: link.clicks || 0,
				created: link.created
			}))
		};
	} catch (err) {
		error(404, 'User not found');
	}
};