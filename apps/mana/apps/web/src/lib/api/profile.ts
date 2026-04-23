/**
 * Profile Service for Mana Web App
 * Handles profile updates, password changes, account deletion, and avatar uploads
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl } from './config';

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

export interface ChangeEmailRequest {
	newEmail: string;
}

// Helper function for authenticated requests
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const token = await authStore.getValidToken();

	const response = await fetch(`${getManaAuthUrl()}${endpoint}`, {
		...options,
		// Better-Auth's /profile handler calls auth.api.updateUser, which
		// identifies the user via the session cookie (not the JWT bearer).
		// In dev the request is cross-origin (5173 → 3001); without
		// `credentials: 'include'` the browser drops the cookie and the
		// server throws "Internal server error" instead of updating.
		// Matches the pattern used throughout packages/shared-auth.
		credentials: 'include',
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

	/**
	 * Change email address (sends verification to new email)
	 */
	async changeEmail(data: ChangeEmailRequest): Promise<{ success: boolean; message: string }> {
		return fetchWithAuth('/api/v1/auth/change-email', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},
};
