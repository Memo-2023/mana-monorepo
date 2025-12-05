// API Client Configuration
const API_URL = import.meta.env.PUBLIC_VOXEL_LAVA_API_URL || 'http://localhost:3010';
const AUTH_URL = import.meta.env.PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// Token storage
const TOKEN_KEY = 'voxel_lava_token';
const REFRESH_TOKEN_KEY = 'voxel_lava_refresh_token';
const USER_KEY = 'voxel_lava_user';

export interface User {
	userId: string;
	email: string;
	role: string;
	name?: string;
}

export interface ApiError {
	message: string;
	statusCode: number;
}

// Token management
export function getToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
	if (typeof window === 'undefined') return null;
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function getStoredUser(): User | null {
	if (typeof window === 'undefined') return null;
	const user = localStorage.getItem(USER_KEY);
	return user ? JSON.parse(user) : null;
}

export function setStoredUser(user: User): void {
	if (typeof window === 'undefined') return;
	localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
	if (typeof window === 'undefined') return;
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
	localStorage.removeItem(USER_KEY);
}

// API request helper
export async function apiRequest<T>(
	endpoint: string,
	options: RequestInit = {},
	useAuthUrl = false
): Promise<T> {
	const baseUrl = useAuthUrl ? AUTH_URL : API_URL;
	const url = `${baseUrl}${endpoint}`;

	const token = getToken();
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...options.headers,
	};

	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}

	const response = await fetch(url, {
		...options,
		headers,
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw {
			message: error.message || 'Request failed',
			statusCode: response.status,
		} as ApiError;
	}

	return response.json();
}

// Auth API
export const authApi = {
	async login(email: string, password: string) {
		const response = await apiRequest<{
			accessToken: string;
			refreshToken: string;
			user: User;
		}>(
			'/api/v1/auth/login',
			{
				method: 'POST',
				body: JSON.stringify({ email, password }),
			},
			true
		);

		setToken(response.accessToken);
		setRefreshToken(response.refreshToken);
		setStoredUser(response.user);

		return response;
	},

	async register(email: string, password: string, name?: string) {
		const response = await apiRequest<{
			accessToken: string;
			refreshToken: string;
			user: User;
		}>(
			'/api/v1/auth/register',
			{
				method: 'POST',
				body: JSON.stringify({ email, password, name }),
			},
			true
		);

		setToken(response.accessToken);
		setRefreshToken(response.refreshToken);
		setStoredUser(response.user);

		return response;
	},

	async logout() {
		try {
			await apiRequest('/api/v1/auth/logout', { method: 'POST' }, true);
		} catch {
			// Ignore errors during logout
		}
		clearAuth();
	},

	async refreshAuth() {
		const refreshToken = getRefreshToken();
		if (!refreshToken) throw new Error('No refresh token');

		const response = await apiRequest<{
			accessToken: string;
			refreshToken: string;
		}>(
			'/api/v1/auth/refresh',
			{
				method: 'POST',
				body: JSON.stringify({ refreshToken }),
			},
			true
		);

		setToken(response.accessToken);
		setRefreshToken(response.refreshToken);

		return response;
	},

	async resetPassword(email: string) {
		return apiRequest(
			'/api/v1/auth/reset-password',
			{
				method: 'POST',
				body: JSON.stringify({ email }),
			},
			true
		);
	},

	async validate() {
		return apiRequest<{ valid: boolean; payload: User }>(
			'/api/v1/auth/validate',
			{
				method: 'POST',
				body: JSON.stringify({ token: getToken() }),
			},
			true
		);
	},
};

// Levels API
export const levelsApi = {
	async getPublicLevels(page = 1, limit = 20) {
		return apiRequest<{
			items: any[];
			total: number;
			page: number;
			limit: number;
			totalPages: number;
		}>(`/api/levels/public?page=${page}&limit=${limit}`);
	},

	async getUserLevels() {
		return apiRequest<any[]>('/api/levels');
	},

	async getLevel(id: string) {
		return apiRequest<any>(`/api/levels/${id}`);
	},

	async createLevel(data: any) {
		return apiRequest<any>('/api/levels', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	async updateLevel(id: string, data: any) {
		return apiRequest<any>(`/api/levels/${id}`, {
			method: 'PUT',
			body: JSON.stringify(data),
		});
	},

	async deleteLevel(id: string) {
		return apiRequest<{ success: boolean }>(`/api/levels/${id}`, {
			method: 'DELETE',
		});
	},

	async toggleLike(id: string) {
		return apiRequest<{ liked: boolean }>(`/api/levels/${id}/like`, {
			method: 'POST',
		});
	},

	async hasLiked(id: string) {
		return apiRequest<{ liked: boolean }>(`/api/levels/${id}/liked`);
	},

	async recordPlay(id: string, completed: boolean, completionTime?: number) {
		return apiRequest<any>(`/api/levels/${id}/play`, {
			method: 'POST',
			body: JSON.stringify({ completed, completionTime }),
		});
	},

	async getLeaderboard(id: string, limit = 10) {
		return apiRequest<any[]>(`/api/levels/${id}/leaderboard?limit=${limit}`);
	},
};

export { API_URL, AUTH_URL };
