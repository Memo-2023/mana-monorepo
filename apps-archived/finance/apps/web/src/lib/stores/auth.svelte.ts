import { apiClient } from '$lib/api';

interface User {
	id: string;
	email: string;
	name?: string;
}

let user = $state<User | null>(null);
let token = $state<string | null>(null);
let isLoading = $state(true);

export const authStore = {
	get user() {
		return user;
	},
	get token() {
		return token;
	},
	get isLoading() {
		return isLoading;
	},
	get isAuthenticated() {
		return !!user && !!token;
	},

	setToken(newToken: string | null) {
		token = newToken;
		apiClient.setToken(newToken);

		if (newToken && typeof window !== 'undefined') {
			localStorage.setItem('finance_token', newToken);
		} else if (typeof window !== 'undefined') {
			localStorage.removeItem('finance_token');
		}
	},

	setUser(newUser: User | null) {
		user = newUser;
	},

	async init() {
		if (typeof window === 'undefined') {
			isLoading = false;
			return;
		}

		const savedToken = localStorage.getItem('finance_token');
		if (savedToken) {
			this.setToken(savedToken);
			// TODO: Validate token with backend
		}

		isLoading = false;
	},

	logout() {
		this.setToken(null);
		this.setUser(null);
	},
};
