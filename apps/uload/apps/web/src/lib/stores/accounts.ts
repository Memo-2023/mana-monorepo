import { writable, derived, get } from 'svelte/store';
import type { User, SharedAccess } from '$lib/types/accounts';
import { goto } from '$app/navigation';

export interface AccountsState {
	currentUser: User | null;
	sharedAccounts: SharedAccess[];
	viewingAs: string | null; // User ID of the account we're viewing as
	isLoadingAccounts: boolean;
}

function createAccountsStore() {
	const { subscribe, set, update } = writable<AccountsState>({
		currentUser: null,
		sharedAccounts: [],
		viewingAs: null,
		isLoadingAccounts: false
	});

	return {
		subscribe,
		
		// Initialize accounts on auth
		init(user: User | null, sharedAccounts: SharedAccess[] = [], viewingAs: string | null = null) {
			if (!user) {
				set({
					currentUser: null,
					sharedAccounts: [],
					viewingAs: null,
					isLoadingAccounts: false
				});
				return;
			}

			set({
				currentUser: user,
				sharedAccounts,
				viewingAs: viewingAs || user.id,
				isLoadingAccounts: false
			});
		},

		// Switch viewing context
		async switchViewingContext(accountId: string) {
			const state = get(this);
			
			// Check if switching to own account
			if (state.currentUser?.id === accountId) {
				update(s => ({ ...s, viewingAs: accountId }));
				// Remove viewing_as param from URL
				const url = new URL(window.location.href);
				url.searchParams.delete('viewing_as');
				await goto(url.pathname + url.search);
				return;
			}

			// Check if switching to a shared account
			const sharedAccount = state.sharedAccounts.find(s => s.owner === accountId);
			if (sharedAccount) {
				update(s => ({ ...s, viewingAs: accountId }));
				// Add viewing_as param to URL
				const url = new URL(window.location.href);
				url.searchParams.set('viewing_as', accountId);
				await goto(url.pathname + url.search);
			}
		},

		// Get permissions for current viewing context
		getPermissions() {
			const state = get(this);
			
			// Own account has full permissions
			if (state.viewingAs === state.currentUser?.id) {
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

			// Find shared account permissions
			const sharedAccount = state.sharedAccounts.find(s => s.owner === state.viewingAs);
			if (sharedAccount?.permissions) {
				return {
					...sharedAccount.permissions,
					edit_all: false,
					delete_all: false
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

		// Check if viewing own account
		isOwnAccount() {
			const state = get(this);
			return state.viewingAs === state.currentUser?.id;
		},

		// Clear store on logout
		clear() {
			set({
				currentUser: null,
				sharedAccounts: [],
				viewingAs: null,
				isLoadingAccounts: false
			});
		}
	};
}

export const accountsStore = createAccountsStore();

// Derived store for whether viewing own account
export const isViewingOwnAccount = derived(
	accountsStore,
	$accounts => $accounts.viewingAs === $accounts.currentUser?.id
);

// Derived store for whether user can switch accounts
export const canSwitchAccounts = derived(
	accountsStore,
	$accounts => $accounts.sharedAccounts.length > 0
);

// Derived store for current viewing context
export const currentViewingAccount = derived(
	accountsStore,
	$accounts => {
		if ($accounts.viewingAs === $accounts.currentUser?.id) {
			return $accounts.currentUser;
		}
		const shared = $accounts.sharedAccounts.find(s => s.owner === $accounts.viewingAs);
		return shared?.expand?.owner || null;
	}
);