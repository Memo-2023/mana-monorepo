import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Workspace, WorkspaceMember } from '$lib/stores/workspaces';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}

	try {
		// Get personal workspace
		const personalWorkspaces = await locals.pb.collection('workspaces').getList<Workspace>(1, 1, {
			filter: `owner="${locals.user.id}" && type="personal"`,
			sort: 'created',
		});

		// Get team workspaces (owned and member)
		const ownedWorkspaces = await locals.pb.collection('workspaces').getList<Workspace>(1, 50, {
			filter: `owner="${locals.user.id}" && type="team"`,
			sort: '-created',
		});

		// Get workspaces where user is a member
		const memberships = await locals.pb
			.collection('workspace_members')
			.getList<WorkspaceMember>(1, 50, {
				filter: `user="${locals.user.id}" && invitation_status="accepted"`,
				expand: 'workspace',
				sort: '-created',
			});

		const memberWorkspaces = memberships.items
			.filter((m) => m.expand?.workspace && m.expand.workspace.owner !== locals.user.id)
			.map((m) => m.expand!.workspace as Workspace);

		// Get pending invitations
		const invitations = await locals.pb
			.collection('workspace_members')
			.getList<WorkspaceMember>(1, 50, {
				filter: `user="${locals.user.id}" && invitation_status="pending"`,
				expand: 'workspace',
				sort: '-invited_at',
			});

		// Get stats for personal workspace
		let personalStats = { links: 0, clicks: 0 };
		if (personalWorkspaces.items[0]) {
			try {
				const links = await locals.pb.collection('links').getList(1, 1, {
					filter: `workspace_id="${personalWorkspaces.items[0].id}"`,
				});
				personalStats.links = links.totalItems;

				// Note: Would need to aggregate clicks through links
				// For now, keeping it simple
			} catch (error) {
				console.error('Error fetching stats:', error);
			}
		}

		// Add member counts to team workspaces
		const teamWorkspacesWithCounts = await Promise.all(
			[...ownedWorkspaces.items, ...memberWorkspaces].map(async (workspace) => {
				try {
					const members = await locals.pb.collection('workspace_members').getList(1, 1, {
						filter: `workspace="${workspace.id}"`,
					});
					return {
						...workspace,
						memberCount: members.totalItems,
					};
				} catch {
					return {
						...workspace,
						memberCount: 0,
					};
				}
			})
		);

		return {
			user: locals.user,
			personalWorkspace: personalWorkspaces.items[0] || null,
			teamWorkspaces: teamWorkspacesWithCounts,
			invitations: invitations.items,
			personalStats,
		};
	} catch (error) {
		console.error('Error loading workspaces:', error);
		return {
			user: locals.user,
			personalWorkspace: null,
			teamWorkspaces: [],
			invitations: [],
			personalStats: { links: 0, clicks: 0 },
		};
	}
};
