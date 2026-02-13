/**
 * Profile Service for ManaCore Web App
 * Handles profile updates, password changes, and account deletion
 */

import { authStore } from '$lib/stores/auth.svelte';

const MANA_AUTH_URL = 'http://localhost:3001';

// Types
export interface UserProfile {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string;
	role: string;
	createdAt: string;
}

export interface UpdateProfileRequest {
	name?: string;
	image?: string;
}

export interface ChangePasswordRequest {
	currentPassword: string;
	newPassword: string;
}

export interface DeleteAccountRequest {
	password: string;
	reason?: string;
}

// Helper function for authenticated requests
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const token = await authStore.getAccessToken();

	const response = await fetch(`${MANA_AUTH_URL}${endpoint}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...options.headers,
		},
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({ message: 'Request failed' }));
		throw new Error(error.message || `HTTP ${response.status}`);
	}

	return response.json();
}

// Profile Service
export const profileService = {
	/**
	 * Get current user profile
	 */
	async getProfile(): Promise<UserProfile> {
		return fetchWithAuth<UserProfile>('/api/v1/auth/profile');
	},

	/**
	 * Update user profile
	 */
	async updateProfile(
		data: UpdateProfileRequest
	): Promise<{ success: boolean; user: UserProfile }> {
		return fetchWithAuth('/api/v1/auth/profile', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Change password
	 */
	async changePassword(
		data: ChangePasswordRequest
	): Promise<{ success: boolean; message: string }> {
		return fetchWithAuth('/api/v1/auth/change-password', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Delete account (soft-delete)
	 */
	async deleteAccount(data: DeleteAccountRequest): Promise<{ success: boolean; message: string }> {
		return fetchWithAuth('/api/v1/auth/account', {
			method: 'DELETE',
			body: JSON.stringify(data),
		});
	},
};
