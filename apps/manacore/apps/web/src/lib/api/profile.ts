/**
 * Profile Service for ManaCore Web App
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

export interface AvatarUploadUrlResponse {
	uploadUrl: string;
	fileUrl: string;
	key: string;
	expiresIn: number;
}

// Helper function for authenticated requests
async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
	const token = await authStore.getAccessToken();

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
	 * Get presigned URL for avatar upload
	 */
	async getAvatarUploadUrl(filename: string): Promise<AvatarUploadUrlResponse> {
		return fetchWithAuth('/api/v1/storage/avatar/upload-url', {
			method: 'POST',
			body: JSON.stringify({ filename }),
		});
	},

	/**
	 * Upload avatar file using presigned URL, then update profile
	 */
	async uploadAvatar(file: File): Promise<{ success: boolean; user: UserProfile }> {
		// 1. Get presigned upload URL
		const { uploadUrl, fileUrl } = await this.getAvatarUploadUrl(file.name);

		// 2. Upload file directly to S3/MinIO
		const uploadResponse = await fetch(uploadUrl, {
			method: 'PUT',
			body: file,
			headers: {
				'Content-Type': file.type,
			},
		});

		if (!uploadResponse.ok) {
			throw new Error('Avatar-Upload fehlgeschlagen');
		}

		// 3. Update profile with new image URL
		return this.updateProfile({ image: fileUrl });
	},
};
