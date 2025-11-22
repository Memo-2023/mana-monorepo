import type { ManaUser } from '$lib/types/auth';
import { authService } from '$lib/services/authService';

// Svelte 5 runes-based auth store
let user = $state<ManaUser | null>(null);
let loading = $state(true);

export const authStore = {
	get user() {
		return user;
	},
	get loading() {
		return loading;
	},
	get isAuthenticated() {
		return !!user;
	},

	/**
	 * Initialize auth state from stored tokens
	 */
	async initialize() {
		loading = true;
		try {
			if (authService.isAuthenticated()) {
				user = authService.getCurrentUser();
			}
		} catch (error) {
			console.error('Failed to initialize auth:', error);
			user = null;
		} finally {
			loading = false;
		}
	},

	/**
	 * Set user
	 */
	setUser(newUser: ManaUser | null) {
		user = newUser;
	},

	/**
	 * Sign out
	 */
	async signOut() {
		try {
			await authService.signOut();
			user = null;
		} catch (error) {
			console.error('Sign out failed:', error);
		}
	},

	/**
	 * Check authentication status
	 */
	checkAuth() {
		if (!authService.isAuthenticated()) {
			user = null;
			return false;
		}
		return true;
	}
};
