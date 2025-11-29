import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { validateWorkspaceSlug, isSlugReserved } from '$lib/utils/reserved-slugs';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}

	// Count existing team workspaces for this user
	const teamWorkspaces = await locals.pb.collection('workspaces').getList(1, 100, {
		filter: `owner="${locals.user.id}" && type="team"`,
	});

	return {
		workspaceCount: teamWorkspaces.totalItems,
		workspaceLimit:
			locals.user?.subscription_tier === 'pro'
				? 10
				: locals.user?.subscription_tier === 'business'
					? 999
					: 1,
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const type = data.get('type') as 'team' | 'personal';
		const slug = data.get('slug') as string;

		if (!name) {
			return fail(400, { error: 'Workspace name is required' });
		}

		// Check workspace limits for team workspaces
		if (type === 'team') {
			const teamWorkspaces = await locals.pb.collection('workspaces').getList(1, 100, {
				filter: `owner="${locals.user.id}" && type="team"`,
			});

			const limit =
				locals.user?.subscription_tier === 'pro'
					? 10
					: locals.user?.subscription_tier === 'business'
						? 999
						: 1;

			if (teamWorkspaces.totalItems >= limit) {
				return fail(403, {
					error: `Workspace limit reached. You can have maximum ${limit} team workspace(s) with your current plan.`,
				});
			}
		}

		// Validate slug format
		if (slug) {
			const slugError = validateWorkspaceSlug(slug);
			if (slugError) {
				return fail(400, { error: slugError });
			}
		}

		try {
			// Check for slug conflicts across collections
			if (slug) {
				// Check if username exists with this slug (but allow if it's the current user)
				try {
					const existingUser = await locals.pb
						.collection('users')
						.getFirstListItem(`username="${slug}"`);
					if (existingUser && existingUser.id !== locals.user.id) {
						return fail(400, {
							error: 'This workspace URL conflicts with an existing user profile',
						});
					}
				} catch (e) {
					// No user found, which is good
				}

				// Check if workspace slug already exists
				try {
					const existingWorkspace = await locals.pb
						.collection('workspaces')
						.getFirstListItem(`slug="${slug}"`);
					if (existingWorkspace) {
						return fail(400, { error: 'This workspace URL is already taken' });
					}
				} catch (e) {
					// No workspace found, which is good
				}
			}
			// Create the workspace
			const workspace = await locals.pb.collection('workspaces').create({
				name: name.trim(),
				owner: locals.user.id,
				type: type || 'team',
				description: description?.trim() || '',
				slug: slug?.trim() || null,
				subscription_status: locals.user.subscription_status || 'free',
			});

			// Add the owner as a member with owner role
			await locals.pb.collection('workspace_members').create({
				workspace: workspace.id,
				user: locals.user.id,
				role: 'owner',
				invitation_status: 'accepted',
				accepted_at: new Date().toISOString(),
			});

			// Redirect to the new workspace
			redirect(303, `/settings/workspaces/${workspace.id}`);
		} catch (error: any) {
			console.error('Error creating workspace:', error);

			if (error?.data?.data?.slug?.code === 'validation_not_unique') {
				return fail(400, { error: 'This workspace URL is already taken' });
			}

			return fail(400, { error: 'Failed to create workspace' });
		}
	},
} satisfies Actions;
