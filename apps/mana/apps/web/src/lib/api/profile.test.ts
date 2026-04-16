import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getValidToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

// Mock config
vi.mock('./config', () => ({
	getManaAuthUrl: vi.fn().mockReturnValue('http://localhost:3001'),
	getManaApiUrl: vi.fn().mockReturnValue('http://localhost:3060'),
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

	describe('changeEmail', () => {
		it('should send email change request', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ success: true, message: 'Verification email sent' }),
			});

			const result = await profileService.changeEmail({ newEmail: 'new@mana.how' });

			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3001/api/v1/auth/change-email',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ newEmail: 'new@mana.how' }),
				})
			);
		});
	});

	describe('uploadAvatar', () => {
		it('should upload avatar to API and update profile', async () => {
			const mockFile = new File(['image-data'], 'avatar.png', { type: 'image/png' });

			global.fetch = vi
				.fn()
				.mockResolvedValueOnce({
					ok: true,
					json: () =>
						Promise.resolve({ url: 'https://media.mana.how/avatar.png', mediaId: 'media-1' }),
				})
				.mockResolvedValueOnce({
					ok: true,
					json: () =>
						Promise.resolve({
							success: true,
							user: { id: 'user-1', name: 'Test', email: 'test@mana.how' },
						}),
				});

			const result = await profileService.uploadAvatar(mockFile);

			expect(result.success).toBe(true);
			expect(global.fetch).toHaveBeenCalledWith(
				'http://localhost:3060/api/v1/storage/avatar/upload',
				expect.objectContaining({ method: 'POST' })
			);
		});
	});
});
