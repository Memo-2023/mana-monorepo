import { browser } from '$app/environment';
import { authApi } from '$lib/api/client';

interface User {
	id: string;
	email: string;
}

function createAuthStore() {
	let isAuthenticated = $state(false);
	let user = $state<User | null>(null);
	let isLoading = $state(true);

	function init() {
		if (!browser) {
			isLoading = false;
			return;
		}

		const token = localStorage.getItem('accessToken');
		if (token) {
			// Decode JWT to get user info
			try {
				const payload = JSON.parse(atob(token.split('.')[1]));
				user = { id: payload.sub, email: payload.email };
				isAuthenticated = true;
			} catch (e) {
				console.error('Failed to decode token:', e);
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
			}
		}
		isLoading = false;
	}

	async function login(email: string, password: string) {
		const data = await authApi.login(email, password);
		const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
		user = { id: payload.sub, email: payload.email };
		isAuthenticated = true;
		return data;
	}

	async function register(email: string, password: string) {
		const data = await authApi.register(email, password);
		const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
		user = { id: payload.sub, email: payload.email };
		isAuthenticated = true;
		return data;
	}

	function logout() {
		authApi.logout();
		user = null;
		isAuthenticated = false;
	}

	return {
		get isAuthenticated() {
			return isAuthenticated;
		},
		get user() {
			return user;
		},
		get isLoading() {
			return isLoading;
		},
		init,
		login,
		register,
		logout,
	};
}

export const auth = createAuthStore();
