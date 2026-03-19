import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

// Mock config
vi.mock('./config', () => ({
	getManaAuthUrl: vi.fn().mockReturnValue('http://localhost:3001'),
}));

import { profileService, type UserProfile } from './profile';

describe('profileService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getProfile', () => {
		it('should fetch user profile', async () => {
			const mockProfile: UserProfile = {
				id: 'user-1',
				name: 'Test User',
				email: 'test@mana.how',
				emailVerified: true,
				role: 'user',
				createdAt: '2026-01-01',
			};
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockProfile),
			});

			const result = await profileService.getProfile();

			expect(result).toEqual(mockProfile);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/auth/profile',
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				})
			);
		});

		it('should throw on failed request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				json: () => Promise.resolve({ message: 'Unauthorized' }),
			});

			await expect(profileService.getProfile()).rejects.toThrow('Unauthorized');
		});
	});

	describe('updateProfile', () => {
		it('should send POST request with profile data', async () => {
			const mockResponse = {
				success: true,
				user: { id: 'user-1', name: 'Updated Name', email: 'test@mana.how' },
			};
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await profileService.updateProfile({ name: 'Updated Name' });

			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/auth/profile',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ name: 'Updated Name' }),
				})
			);
		});
	});

	describe('changePassword', () => {
		it('should send password change request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true, message: 'Password changed' }),
			});

			const result = await profileService.changePassword({
				currentPassword: 'old-pass',
				newPassword: 'new-pass',
			});

			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/auth/change-password',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ currentPassword: 'old-pass', newPassword: 'new-pass' }),
				})
			);
		});
	});

	describe('deleteAccount', () => {
		it('should send DELETE request with password', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true, message: 'Account deleted' }),
			});

			const result = await profileService.deleteAccount({
				password: 'my-password',
				reason: 'testing',
			});

			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/auth/account',
				expect.objectContaining({
					method: 'DELETE',
					body: JSON.stringify({ password: 'my-password', reason: 'testing' }),
				})
			);
		});
	});

	describe('getAvatarUploadUrl', () => {
		it('should request presigned URL for avatar upload', async () => {
			const mockResponse = {
				uploadUrl: 'https://s3.example.com/upload',
				fileUrl: 'https://s3.example.com/avatar.png',
				key: 'avatars/user-1/avatar.png',
				expiresIn: 3600,
			};
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve(mockResponse),
			});

			const result = await profileService.getAvatarUploadUrl('avatar.png');

			expect(result.uploadUrl).toBe('https://s3.example.com/upload');
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/storage/avatar/upload-url',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ filename: 'avatar.png' }),
				})
			);
		});
	});
});
