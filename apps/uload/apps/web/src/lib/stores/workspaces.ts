import { writable, derived, get } from 'svelte/store';
import type { User } from '$lib/types/accounts';
import { goto } from '$app/navigation';

export interface Workspace {
	id: string;
	name: string;
	owner: string;
	type: 'personal' | 'team';
	description?: string;
	logo?: string;
	subscription_status?: string;
	settings?: any;
	slug?: string;
	created: string;
	updated: string;
}

export interface WorkspaceMember {
	id: string;
	workspace: string;
	user: string;
	role: 'owner' | 'admin' | 'member';
	permissions?: any;
	invitation_status?: 'pending' | 'accepted' | 'declined';
	invitation_token?: string;
	invited_at?: string;
	accepted_at?: string;
	expand?: {
		workspace?: Workspace;
		user?: User;
	};
}

export interface WorkspacesState {
	currentUser: User | null;
	personalWorkspace: Workspace | null;
	teamWorkspaces: Workspace[];
	currentWorkspace: Workspace | null;
	workspaceMembers: WorkspaceMember[];
	isLoadingWorkspaces: boolean;
}

function createWorkspacesStore() {
	const { subscribe, set, update } = writable<WorkspacesState>({
		currentUser: null,
		personalWorkspace: null,
		teamWorkspaces: [],
		currentWorkspace: null,
		workspaceMembers: [],
		isLoadingWorkspaces: false
	});

	return {
		subscribe,
		
		// Initialize workspaces on auth
		init(user: User | null, personalWorkspace: Workspace | null, teamWorkspaces: Workspace[] = [], currentWorkspaceId?: string) {
			if (!user) {
				set({
					currentUser: null,
					personalWorkspace: null,
					teamWorkspaces: [],
					currentWorkspace: null,
					workspaceMembers: [],
					isLoadingWorkspaces: false
				});
				return;
			}

			// Determine current workspace
			let currentWorkspace = personalWorkspace;
			if (currentWorkspaceId) {
				// Try to find in team workspaces
				const teamWs = teamWorkspaces.find(w => w.id === currentWorkspaceId);
				if (teamWs) {
					currentWorkspace = teamWs;
				}
			}

			set({
				currentUser: user,
				personalWorkspace,
				teamWorkspaces,
				currentWorkspace,
				workspaceMembers: [],
				isLoadingWorkspaces: false
			});
		},

		// Switch workspace context
		async switchWorkspace(workspaceId: string) {
			const state = get(this);
			
			// Check if switching to personal workspace
			if (state.personalWorkspace?.id === workspaceId) {
				update(s => ({ ...s, currentWorkspace: state.personalWorkspace }));
				// Remove workspace param from URL
				const url = new URL(window.location.href);
				url.searchParams.delete('workspace');
				await goto(url.pathname + url.search);
				return;
			}

			// Check if switching to a team workspace
			const teamWorkspace = state.teamWorkspaces.find(w => w.id === workspaceId);
			if (teamWorkspace) {
				update(s => ({ ...s, currentWorkspace: teamWorkspace }));
				// Add workspace param to URL
				const url = new URL(window.location.href);
				url.searchParams.set('workspace', workspaceId);
				await goto(url.pathname + url.search);
			}
		},

		// Get permissions for current workspace
		getPermissions() {
			const state = get(this);
			
			// Personal workspace or owner has full permissions
			if (state.currentWorkspace?.owner === state.currentUser?.id) {
				return {
					view_stats: true,
					create_links: true,
					edit_own: true,
					delete_own: true,
					edit_all: true,
					delete_all: true,
					manage_team: true
				};
			}

			// Find member role for current workspace
			const member = state.workspaceMembers.find(
				m => m.workspace === state.currentWorkspace?.id && m.user === state.currentUser?.id
			);

			if (member?.role === 'admin') {
				return {
					view_stats: true,
					create_links: true,
					edit_own: true,
					delete_own: true,
					edit_all: true,
					delete_all: true,
					manage_team: true
				};
			} else if (member?.role === 'member') {
				return {
					view_stats: true,
					create_links: true,
					edit_own: true,
					delete_own: true,
					edit_all: false,
					delete_all: false,
					manage_team: false
				};
			}

			// No permissions
			return {
				view_stats: false,
				create_links: false,
				edit_own: false,
				delete_own: false,
				edit_all: false,
				delete_all: false,
				manage_team: false
			};
		},

		// Check if viewing personal workspace
		isPersonalWorkspace() {
			const state = get(this);
			return state.currentWorkspace?.id === state.personalWorkspace?.id;
		},

		// Update workspace members
		setWorkspaceMembers(members: WorkspaceMember[]) {
			update(s => ({ ...s, workspaceMembers: members }));
		},

		// Create a new workspace
		async createWorkspace(name: string, description?: string) {
			// This will be implemented with server actions
			console.log('Creating workspace:', name, description);
		},

		// Clear store on logout
		clear() {
			set({
				currentUser: null,
				personalWorkspace: null,
				teamWorkspaces: [],
				currentWorkspace: null,
				workspaceMembers: [],
				isLoadingWorkspaces: false
			});
		}
	};
}

export const workspacesStore = createWorkspacesStore();

// Derived store for whether viewing personal workspace
export const isViewingPersonalWorkspace = derived(
	workspacesStore,
	$workspaces => $workspaces.currentWorkspace?.id === $workspaces.personalWorkspace?.id
);

// Derived store for whether user can switch workspaces
export const canSwitchWorkspaces = derived(
	workspacesStore,
	$workspaces => $workspaces.teamWorkspaces.length > 0
);

// Derived store for current workspace
export const currentWorkspace = derived(
	workspacesStore,
	$workspaces => $workspaces.currentWorkspace
);

// Derived store for all available workspaces
export const allWorkspaces = derived(
	workspacesStore,
	$workspaces => {
		const all: Workspace[] = [];
		if ($workspaces.personalWorkspace) {
			all.push($workspaces.personalWorkspace);
		}
		all.push(...$workspaces.teamWorkspaces);
		return all;
	}
);