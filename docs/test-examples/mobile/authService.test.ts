/**
 * Example React Native Service Test
 *
 * This demonstrates best practices for testing services:
 * - Mock fetch/API calls
 * - Test async operations
 * - Test error handling
 * - Test storage operations
 * - Use MSW for API mocking (optional)
 */

import { authService } from '../authService';
import { tokenManager } from '../tokenManager';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('expo-secure-store');
jest.mock('../tokenManager');

// Mock data
const mockTokens = {
	appToken: 'mock-app-token-12345',
	refreshToken: 'mock-refresh-token-12345',
	manaToken: 'mock-mana-token-12345',
};

const mockUser = {
	id: 'user-123',
	email: 'test@example.com',
};

describe('authService', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		global.fetch = jest.fn();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('signIn', () => {
		it('should sign in successfully with valid credentials', async () => {
			// Arrange
			const mockResponse = {
				ok: true,
				status: 200,
				json: async () => ({
					success: true,
					...mockTokens,
					user: mockUser,
				}),
			};

			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);
			(SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

			// Act
			const result = await authService.signIn('test@example.com', 'password123');

			// Assert
			expect(result.success).toBe(true);
			expect(result.user).toEqual(mockUser);
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/auth/signin'),
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: expect.stringContaining('test@example.com'),
				})
			);

			// Verify tokens were stored
			expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@auth/appToken', mockTokens.appToken);
			expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@auth/refreshToken', mockTokens.refreshToken);
		});

		it('should handle invalid credentials error', async () => {
			// Arrange
			const mockResponse = {
				ok: false,
				status: 401,
				json: async () => ({
					success: false,
					error: 'INVALID_CREDENTIALS',
				}),
			};

			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			// Act
			const result = await authService.signIn('test@example.com', 'wrongpassword');

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toBe('INVALID_CREDENTIALS');
			expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
		});

		it('should handle network errors', async () => {
			// Arrange
			(global.fetch as jest.Mock).mockRejectedValue(new Error('Network request failed'));

			// Act
			const result = await authService.signIn('test@example.com', 'password123');

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain('Network');
		});

		it('should handle storage errors', async () => {
			// Arrange
			const mockResponse = {
				ok: true,
				json: async () => ({
					success: true,
					...mockTokens,
					user: mockUser,
				}),
			};

			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);
			(SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('Storage unavailable'));

			// Act
			const result = await authService.signIn('test@example.com', 'password123');

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain('Storage');
		});

		it('should validate email format', async () => {
			// Act
			const result = await authService.signIn('invalid-email', 'password123');

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain('email');
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('should validate password is not empty', async () => {
			// Act
			const result = await authService.signIn('test@example.com', '');

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain('password');
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('should handle timeout errors', async () => {
			jest.useFakeTimers();

			// Arrange
			(global.fetch as jest.Mock).mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 60000);
					})
			);

			// Act
			const resultPromise = authService.signIn('test@example.com', 'password123');

			jest.advanceTimersByTime(30000); // Advance 30s (timeout threshold)
			const result = await resultPromise;

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain('timeout');

			jest.useRealTimers();
		});
	});

	describe('signOut', () => {
		it('should sign out successfully', async () => {
			// Arrange
			(SecureStore.deleteItemAsync as jest.Mock).mockResolvedValue(undefined);
			(tokenManager.clearTokens as jest.Mock).mockResolvedValue(undefined);

			// Act
			const result = await authService.signOut();

			// Assert
			expect(result.success).toBe(true);
			expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('@auth/appToken');
			expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('@auth/refreshToken');
			expect(tokenManager.clearTokens).toHaveBeenCalled();
		});

		it('should handle storage errors during sign out', async () => {
			// Arrange
			(SecureStore.deleteItemAsync as jest.Mock).mockRejectedValue(new Error('Storage error'));

			// Act
			const result = await authService.signOut();

			// Assert
			// Should succeed even if storage fails (user intent matters)
			expect(result.success).toBe(true);
		});
	});

	describe('refreshToken', () => {
		it('should refresh token successfully', async () => {
			// Arrange
			const oldRefreshToken = 'old-refresh-token';
			const newTokens = {
				appToken: 'new-app-token',
				refreshToken: 'new-refresh-token',
			};

			(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(oldRefreshToken);

			const mockResponse = {
				ok: true,
				json: async () => ({
					success: true,
					...newTokens,
				}),
			};

			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);
			(SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);

			// Act
			const result = await authService.refreshToken();

			// Assert
			expect(result.success).toBe(true);
			expect(result.appToken).toBe(newTokens.appToken);
			expect(SecureStore.setItemAsync).toHaveBeenCalledWith('@auth/appToken', newTokens.appToken);
		});

		it('should handle missing refresh token', async () => {
			// Arrange
			(SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

			// Act
			const result = await authService.refreshToken();

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toContain('No refresh token');
			expect(global.fetch).not.toHaveBeenCalled();
		});

		it('should handle expired refresh token', async () => {
			// Arrange
			(SecureStore.getItemAsync as jest.Mock).mockResolvedValue('expired-refresh-token');

			const mockResponse = {
				ok: false,
				status: 401,
				json: async () => ({
					success: false,
					error: 'REFRESH_TOKEN_EXPIRED',
				}),
			};

			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);

			// Act
			const result = await authService.refreshToken();

			// Assert
			expect(result.success).toBe(false);
			expect(result.error).toBe('REFRESH_TOKEN_EXPIRED');
		});
	});

	describe('checkAuthStatus', () => {
		it('should return true when valid token exists', async () => {
			// Arrange
			(tokenManager.getValidToken as jest.Mock).mockResolvedValue('valid-token');

			// Act
			const result = await authService.checkAuthStatus();

			// Assert
			expect(result).toBe(true);
		});

		it('should return false when no token exists', async () => {
			// Arrange
			(tokenManager.getValidToken as jest.Mock).mockResolvedValue(null);

			// Act
			const result = await authService.checkAuthStatus();

			// Assert
			expect(result).toBe(false);
		});

		it('should refresh expired token automatically', async () => {
			// Arrange
			(tokenManager.getValidToken as jest.Mock)
				.mockResolvedValueOnce(null) // First call: no valid token
				.mockResolvedValueOnce('new-valid-token'); // After refresh

			(authService.refreshToken as jest.Mock) = jest.fn().mockResolvedValue({
				success: true,
				appToken: 'new-valid-token',
			});

			// Act
			const result = await authService.checkAuthStatus();

			// Assert
			expect(result).toBe(true);
			expect(authService.refreshToken).toHaveBeenCalled();
		});
	});

	describe('Integration with TokenManager', () => {
		it('should notify TokenManager of new tokens', async () => {
			// Arrange
			const mockResponse = {
				ok: true,
				json: async () => ({
					success: true,
					...mockTokens,
					user: mockUser,
				}),
			};

			(global.fetch as jest.Mock).mockResolvedValue(mockResponse);
			(SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
			(tokenManager.setTokens as jest.Mock).mockResolvedValue(undefined);

			// Act
			await authService.signIn('test@example.com', 'password123');

			// Assert
			expect(tokenManager.setTokens).toHaveBeenCalledWith(mockTokens);
		});
	});
});
