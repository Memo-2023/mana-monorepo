/**
 * Profile Service for Mana Web App
 * Handles profile updates, password changes, account deletion, and avatar uploads
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaAuthUrl, getManaApiUrl } from './config';

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

export interface AvatarUploadResponse {
	url: string;
	mediaId: string;
}

// Helper function for authenticated requests
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const token = await authStore.getValidToken();

	const response = await fetch(`${getManaAuthUrl()}${endpoint}`, {
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

	/**
	 * Change email address (sends verification to new email)
	 */
	async changeEmail(data: ChangeEmailRequest): Promise<{ success: boolean; message: string }> {
		return fetchWithAuth('/api/v1/auth/change-email', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	},

	/**
	 * Upload avatar file directly, then update profile
	 */
	async uploadAvatar(file: File): Promise<{ success: boolean; user: UserProfile }> {
		const token = await authStore.getValidToken();
		const formData = new FormData();
		formData.append('file', file);

		const uploadResponse = await fetch(`${getManaApiUrl()}/api/v1/storage/avatar/upload`, {
			method: 'POST',
			headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
			body: formData,
		});

		if (!uploadResponse.ok) throw new Error('Avatar-Upload fehlgeschlagen');
		const { url } = (await uploadResponse.json()) as AvatarUploadResponse;
		return this.updateProfile({ image: url });
	},
};
