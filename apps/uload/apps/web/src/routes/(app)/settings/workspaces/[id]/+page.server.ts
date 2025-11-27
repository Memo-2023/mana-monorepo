import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Workspace, WorkspaceMember } from '$lib/stores/workspaces';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}

	try {
		// Get workspace details
		const workspace = await locals.pb.collection('workspaces').getOne<Workspace>(params.id);

		// Check if user has access
		const currentMember = await locals.pb
			.collection('workspace_members')
			.getList<WorkspaceMember>(1, 1, {
				filter: `workspace="${params.id}" && user="${locals.user.id}"`,
			});

		if (workspace.owner !== locals.user.id && currentMember.items.length === 0) {
			redirect(303, '/settings');
		}

		// Get all members
		const members = await locals.pb
			.collection('workspace_members')
			.getList<WorkspaceMember>(1, 100, {
				filter: `workspace="${params.id}"`,
				expand: 'user',
				sort: 'role,created',
			});

		return {
			workspace,
			members: members.items,
			currentMember: currentMember.items[0] || null,
			user: locals.user,
		};
	} catch (error) {
		console.error('Error loading workspace:', error);
		redirect(303, '/settings');
	}
};

export const actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const description = data.get('description') as string;
		const slug = data.get('slug') as string;

		try {
			// Check permissions
			const workspace = await locals.pb.collection('workspaces').getOne(params.id);
			const member = await locals.pb.collection('workspace_members').getList(1, 1, {
				filter: `workspace="${params.id}" && user="${locals.user.id}"`,
			});

			const isOwner = workspace.owner === locals.user.id;
			const isAdmin = member.items[0]?.role === 'admin';

			if (!isOwner && !isAdmin) {
				return fail(403, { error: 'You do not have permission to edit this workspace' });
			}

			// Validate slug if provided
			if (slug) {
				const slugPattern = /^[a-z0-9-]+$/;
				if (!slugPattern.test(slug)) {
					return fail(400, {
						error: 'Slug can only contain lowercase letters, numbers, and hyphens',
					});
				}

				// Check if slug is unique (excluding current workspace)
				try {
					const existing = await locals.pb
						.collection('workspaces')
						.getFirstListItem(`slug="${slug}" && id!="${params.id}"`);
					if (existing) {
						return fail(400, { error: 'This slug is already taken' });
					}
				} catch (err) {
					// No existing workspace with this slug, which is good
				}
			}

			// Update workspace
			await locals.pb.collection('workspaces').update(params.id, {
				name: name.trim(),
				description: description?.trim() || '',
				slug: slug?.trim() || null,
			});

			return { success: true, message: 'Workspace settings updated' };
		} catch (error) {
			console.error('Error updating workspace:', error);
			return fail(400, { error: 'Failed to update workspace' });
		}
	},

	invite: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const email = data.get('email') as string;
		const role = data.get('role') as 'admin' | 'member';

		try {
			// Check permissions
			const workspace = await locals.pb.collection('workspaces').getOne(params.id);
			const member = await locals.pb.collection('workspace_members').getList(1, 1, {
				filter: `workspace="${params.id}" && user="${locals.user.id}"`,
			});

			const canInvite = workspace.owner === locals.user.id || member.items[0]?.role === 'admin';

			if (!canInvite) {
				return fail(403, { error: 'You do not have permission to invite members' });
			}

			// Find user by email
			const users = await locals.pb.collection('users').getList(1, 1, {
				filter: `email="${email}"`,
			});

			if (users.items.length === 0) {
				return fail(400, { error: 'User not found' });
			}

			const invitedUser = users.items[0];

			// Check if already a member
			const existingMember = await locals.pb.collection('workspace_members').getList(1, 1, {
				filter: `workspace="${params.id}" && user="${invitedUser.id}"`,
			});

			if (existingMember.items.length > 0) {
				return fail(400, { error: 'User is already a member of this workspace' });
			}

			// Create invitation
			const invitationToken = crypto.randomUUID();
			await locals.pb.collection('workspace_members').create({
				workspace: params.id,
				user: invitedUser.id,
				role: role || 'member',
				invitation_status: 'pending',
				invitation_token: invitationToken,
				invited_at: new Date().toISOString(),
			});

			// TODO: Send invitation email

			return { success: true, message: 'Invitation sent successfully' };
		} catch (error) {
			console.error('Error inviting member:', error);
			return fail(400, { error: 'Failed to send invitation' });
		}
	},

	removeMember: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const memberId = data.get('memberId') as string;

		try {
			// Check permissions
			const workspace = await locals.pb.collection('workspaces').getOne(params.id);
			const isOwner = workspace.owner === locals.user.id;

			if (!isOwner) {
				return fail(403, { error: 'Only workspace owner can remove members' });
			}

			// Delete member
			await locals.pb.collection('workspace_members').delete(memberId);

			return { success: true, message: 'Member removed successfully' };
		} catch (error) {
			console.error('Error removing member:', error);
			return fail(400, { error: 'Failed to remove member' });
		}
	},

	delete: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		try {
			// Check if owner
			const workspace = await locals.pb.collection('workspaces').getOne(params.id);

			if (workspace.owner !== locals.user.id) {
				return fail(403, { error: 'Only workspace owner can delete the workspace' });
			}

			// Don't allow deleting personal workspaces
			if (workspace.type === 'personal') {
				return fail(403, { error: 'Personal workspaces cannot be deleted' });
			}

			// Delete all workspace members first
			const members = await locals.pb.collection('workspace_members').getList(1, 100, {
				filter: `workspace="${params.id}"`,
			});

			for (const member of members.items) {
				await locals.pb.collection('workspace_members').delete(member.id);
			}

			// Delete all links in this workspace
			const links = await locals.pb.collection('links').getList(1, 100, {
				filter: `workspace_id="${params.id}"`,
			});

			for (const link of links.items) {
				await locals.pb.collection('links').delete(link.id);
			}

			// Delete workspace
			await locals.pb.collection('workspaces').delete(params.id);

			// Don't use redirect here, let the client handle it
			return { success: true, deleted: true };
		} catch (error) {
			console.error('Error deleting workspace:', error);
			return fail(400, { error: 'Failed to delete workspace: ' + (error as any)?.message });
		}
	},
} satisfies Actions;
