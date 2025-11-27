import type { LayoutServerLoad } from './$types';
import type { Workspace, WorkspaceMember } from '$lib/stores/workspaces';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		return {
			user: null,
			personalWorkspace: null,
			teamWorkspaces: [],
			currentWorkspaceId: null,
			// Keep old fields for backwards compatibility during migration
			sharedAccounts: [],
			viewingAs: null,
		};
	}

	try {
		// Get or create personal workspace
		let personalWorkspace: Workspace | null = null;
		try {
			const personalWorkspaces = await locals.pb.collection('workspaces').getList<Workspace>(1, 1, {
				filter: `owner="${locals.user.id}" && type="personal"`,
				sort: 'created',
			});

			if (personalWorkspaces.items.length > 0) {
				personalWorkspace = personalWorkspaces.items[0];
			} else {
				// Create personal workspace if it doesn't exist
				personalWorkspace = await locals.pb.collection('workspaces').create<Workspace>({
					name: `${locals.user.name || locals.user.email}'s Workspace`,
					owner: locals.user.id,
					type: 'personal',
					subscription_status: locals.user.subscription_status || 'free',
				});
			}
		} catch (error) {
			console.error('Error managing personal workspace:', error);
		}

		// Get team workspaces where user is a member
		let teamWorkspaces: Workspace[] = [];
		try {
			const memberships = await locals.pb
				.collection('workspace_members')
				.getList<WorkspaceMember>(1, 50, {
					filter: `user="${locals.user.id}" && invitation_status="accepted"`,
					expand: 'workspace',
					sort: 'created',
				});

			teamWorkspaces = memberships.items
				.filter((m) => m.expand?.workspace)
				.map((m) => m.expand!.workspace as Workspace);
		} catch (error) {
			console.error('Error loading team workspaces:', error);
		}

		// Get current workspace from URL or default to personal
		const currentWorkspaceId = url.searchParams.get('workspace') || personalWorkspace?.id || null;

		// Keep backwards compatibility with old shared_access system
		const sharedAccounts = await locals.pb
			.collection('shared_access')
			.getList(1, 50, {
				filter: `user="${locals.user.id}" && invitation_status="accepted"`,
				expand: 'owner',
				sort: 'created',
			})
			.catch(() => ({ items: [] }));

		const viewingAs = url.searchParams.get('viewing_as') || locals.user.id;

		return {
			user: locals.user,
			personalWorkspace,
			teamWorkspaces,
			currentWorkspaceId,
			// Keep old fields for backwards compatibility
			sharedAccounts: sharedAccounts.items,
			viewingAs,
		};
	} catch (error) {
		console.error('Error loading workspaces:', error);
		return {
			user: locals.user,
			personalWorkspace: null,
			teamWorkspaces: [],
			currentWorkspaceId: null,
			sharedAccounts: [],
			viewingAs: locals.user.id,
		};
	}
};
