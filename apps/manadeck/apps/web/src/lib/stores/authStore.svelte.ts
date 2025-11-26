import type { ManaUser } from '$lib/types/auth';
import { authService, type UserData } from '$lib/auth';

// Svelte 5 runes-based auth store
let user = $state<ManaUser | null>(null);
let loading = $state(true);

/**
 * Convert UserData from shared-auth to ManaUser
 */
function toManaUser(userData: UserData | null): ManaUser | null {
	if (!userData) return null;
	return {
		id: userData.id,
		email: userData.email,
		role: userData.role,
	};
}

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
			const isAuth = await authService.isAuthenticated();
			if (isAuth) {
				const userData = await authService.getUserFromToken();
				user = toManaUser(userData);
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
	async checkAuth() {
		const isAuth = await authService.isAuthenticated();
		if (!isAuth) {
			user = null;
			return false;
		}
		return true;
	},

	/**
	 * Sign in with email and password
	 */
	async signIn(email: string, password: string) {
		const result = await authService.signIn(email, password);
		if (result.success) {
			const userData = await authService.getUserFromToken();
			user = toManaUser(userData);
		}
		return result;
	},

	/**
	 * Sign up with email and password
	 */
	async signUp(email: string, password: string) {
		const result = await authService.signUp(email, password);
		if (result.success && !result.needsVerification) {
			const userData = await authService.getUserFromToken();
			user = toManaUser(userData);
		}
		return result;
	},

	/**
	 * Send password reset email
	 */
	async forgotPassword(email: string) {
		return authService.forgotPassword(email);
	}
};
