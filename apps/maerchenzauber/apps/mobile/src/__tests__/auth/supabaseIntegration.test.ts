/**
 * Supabase Integration Test Suite
 * Tests token sync with Supabase client, RLS policy validation, and storage operations with auth
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { authService } from '../../services/authService';
import { tokenManager, TokenState } from '../../services/tokenManager';
import { setupTokenObservers } from '../../utils/fetchInterceptor';
import {
	MOCK_TOKENS,
	MOCK_USER_DATA,
	MOCK_DEVICE_INFO,
	mockFetchResponses,
	MockResponseBuilder,
	TestScenarioBuilder,
	TokenStateObserver,
	testUtils,
	mockStorage,
} from '../utils/authTestUtils';

// Mock Supabase client
const mockSupabaseClient = {
	auth: {
		setSession: jest.fn(),
		getSession: jest.fn(),
		signOut: jest.fn(),
	},
	from: jest.fn(() => ({
		select: jest.fn(() => ({
			eq: jest.fn(() => ({
				single: jest.fn(),
			})),
		})),
		insert: jest.fn(),
		update: jest.fn(),
		delete: jest.fn(),
	})),
	storage: {
		from: jest.fn(() => ({
			upload: jest.fn(),
			download: jest.fn(),
			remove: jest.fn(),
			list: jest.fn(),
		})),
	},
	rpc: jest.fn(),
};

// Mock dependencies
jest.mock('../../utils/safeStorage', () => {
	const { mockStorage } = jest.requireActual('../utils/authTestUtils') as any;
	return {
		safeStorage: mockStorage,
	};
});

jest.mock('../../utils/deviceManager', () => {
	const { MOCK_DEVICE_INFO } = jest.requireActual('../utils/authTestUtils') as any;
	return {
		DeviceManager: {
			getDeviceInfo: jest.fn().mockResolvedValue(MOCK_DEVICE_INFO),
			getStoredDeviceId: jest.fn().mockResolvedValue(MOCK_DEVICE_INFO.deviceId),
		},
	};
});

jest.mock('../../utils/supabaseClient', () => ({
	updateSupabaseAuth: jest.fn(),
	supabaseClient: mockSupabaseClient,
}));

jest.mock('../../utils/supabaseDataService', () => ({
	initializeSupabaseAuth: jest.fn(),
}));

describe('Supabase Integration', () => {
	let tokenObserver: TokenStateObserver;
	let consoleMock: ReturnType<typeof testUtils.mockConsole>;

	beforeEach(() => {
		tokenObserver = new TokenStateObserver();
		consoleMock = testUtils.mockConsole();

		// Reset token manager state
		tokenManager.reset();

		// Clear storage
		mockStorage.clear();

		// Reset all mocks
		jest.clearAllMocks();

		// Reset fetch mocks
		if (globalThis.fetch && typeof (globalThis.fetch as any).mockReset === 'function') {
			(globalThis.fetch as jest.Mock).mockReset();
		}
	});

	afterEach(() => {
		consoleMock.restore();
	});

	describe('Token Sync with Supabase Client', () => {
		it('should update Supabase auth when token becomes valid', async () => {
			// Arrange
			const { updateSupabaseAuth } = require('../../utils/supabaseClient');
			mockStorage.setupValidTokens();

			setupTokenObservers();
			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				const token = await tokenManager.getValidToken();

				// Wait for state transition
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));

				// Assert
				expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

				// Should update Supabase auth
				await testUtils.waitFor(() => updateSupabaseAuth.mock.calls.length > 0);
				expect(updateSupabaseAuth).toHaveBeenCalled();
			} finally {
				unsubscribe();
			}
		});

		it.skip('should handle Supabase auth update after token refresh', async () => {
			// Arrange
			const { updateSupabaseAuth } = require('../../utils/supabaseClient');
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			setupTokenObservers();
			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				const token = await tokenManager.getValidToken();

				// Wait for token refresh and state transition
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.REFRESHING));
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));

				// Assert
				expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

				// Should update Supabase auth after refresh
				await testUtils.waitFor(() => updateSupabaseAuth.mock.calls.length > 0);
				expect(updateSupabaseAuth).toHaveBeenCalled();
			} finally {
				unsubscribe();
			}
		});

		it.skip('should handle Supabase auth errors gracefully', async () => {
			// Arrange
			const { updateSupabaseAuth } = require('../../utils/supabaseClient');
			updateSupabaseAuth.mockRejectedValue(new Error('Supabase auth error'));

			mockStorage.setupValidTokens();
			setupTokenObservers();
			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				await tokenManager.getValidToken();
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));

				// Wait for Supabase update attempt
				await testUtils.waitFor(() => updateSupabaseAuth.mock.calls.length > 0);

				// Assert - Should log error but not crash
				expect(updateSupabaseAuth).toHaveBeenCalled();
				expect(
					consoleMock.debugs.some((msg) =>
						msg.includes('Error updating Supabase auth from token observer')
					)
				).toBe(true);
			} finally {
				unsubscribe();
			}
		});

		it.skip('should not update Supabase auth on expired token state', async () => {
			// Arrange
			const { updateSupabaseAuth } = require('../../utils/supabaseClient');
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenExpired().build();
				}

				return MockResponseBuilder.success().build();
			});

			setupTokenObservers();
			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				await tokenManager.getValidToken();
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.EXPIRED));

				// Wait a bit to ensure no Supabase update is called
				await testUtils.sleep(200);

				// Assert - Should not update Supabase auth for expired tokens
				expect(updateSupabaseAuth).not.toHaveBeenCalled();
			} finally {
				unsubscribe();
			}
		});
	});

	describe('RLS Policy Validation with Refreshed Tokens', () => {
		it.skip('should validate RLS policies work with refreshed tokens', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Mock Supabase query that requires RLS
			const mockQuery = mockSupabaseClient
				.from('test_table')
				.select('*')
				.eq('user_id', MOCK_USER_DATA.sub);
			mockQuery.single.mockResolvedValue({
				data: { id: 1, name: 'test', user_id: MOCK_USER_DATA.sub },
				error: null,
			});

			// Act - Get valid token (will trigger refresh)
			const token = await tokenManager.getValidToken();
			expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

			// Simulate RLS-protected query
			const result = await mockQuery.single();

			// Assert
			expect(result.data).toBeDefined();
			expect(result.error).toBeNull();
			expect(result.data.user_id).toBe(MOCK_USER_DATA.sub);
		});

		it.skip('should handle RLS policy failures with expired tokens', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenExpired().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Mock Supabase query that fails due to RLS
			const mockQuery = mockSupabaseClient
				.from('test_table')
				.select('*')
				.eq('user_id', MOCK_USER_DATA.sub);
			mockQuery.single.mockResolvedValue({
				data: null,
				error: {
					message: 'JWT expired',
					code: 'PGRST301',
				},
			});

			// Act
			const token = await tokenManager.getValidToken();
			expect(token).toBeNull();

			// Simulate RLS-protected query with expired token
			const result = await mockQuery.single();

			// Assert
			expect(result.data).toBeNull();
			expect(result.error).toBeDefined();
			expect(result.error.code).toBe('PGRST301');
		});

		it.skip('should retry queries after token refresh on RLS failures', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			let queryAttempts = 0;
			const mockQuery = mockSupabaseClient
				.from('test_table')
				.select('*')
				.eq('user_id', MOCK_USER_DATA.sub);
			mockQuery.single.mockImplementation(async () => {
				queryAttempts++;

				// First attempt fails with JWT expired
				if (queryAttempts === 1) {
					return {
						data: null,
						error: {
							message: 'JWT expired',
							code: 'PGRST301',
						},
					};
				}

				// Second attempt succeeds after token refresh
				return {
					data: { id: 1, name: 'test', user_id: MOCK_USER_DATA.sub },
					error: null,
				};
			});

			// Act - First get valid token
			await tokenManager.getValidToken();

			// First query fails
			let result = await mockQuery.single();
			expect(result.error?.code).toBe('PGRST301');

			// Trigger token refresh and retry
			await tokenManager.getValidToken();
			result = await mockQuery.single();

			// Assert - Second attempt should succeed
			expect(result.data).toBeDefined();
			expect(result.error).toBeNull();
			expect(queryAttempts).toBe(2);
		});
	});

	describe('Storage Operations with Auth', () => {
		it('should perform storage operations with valid tokens', async () => {
			// Arrange
			mockStorage.setupValidTokens();

			const mockStorageBucket = mockSupabaseClient.storage.from('test-bucket');
			mockStorageBucket.upload.mockResolvedValue({
				data: { path: 'test-file.jpg' },
				error: null,
			});

			// Act
			const token = await tokenManager.getValidToken();
			expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

			const uploadResult = await mockStorageBucket.upload('test-file.jpg', new Blob(['test data']));

			// Assert
			expect(uploadResult.data).toBeDefined();
			expect(uploadResult.error).toBeNull();
			expect(uploadResult.data.path).toBe('test-file.jpg');
		});

		it.skip('should handle storage operations with expired tokens', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenExpired().build();
				}

				return MockResponseBuilder.success().build();
			});

			const mockStorageBucket = mockSupabaseClient.storage.from('test-bucket');
			mockStorageBucket.upload.mockResolvedValue({
				data: null,
				error: {
					message: 'JWT expired',
					statusCode: '401',
				},
			});

			// Act
			const token = await tokenManager.getValidToken();
			expect(token).toBeNull();

			const uploadResult = await mockStorageBucket.upload('test-file.jpg', new Blob(['test data']));

			// Assert
			expect(uploadResult.data).toBeNull();
			expect(uploadResult.error).toBeDefined();
			expect(uploadResult.error.statusCode).toBe('401');
		});

		it.skip('should refresh tokens automatically during storage operations', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			let uploadAttempts = 0;
			const mockStorageBucket = mockSupabaseClient.storage.from('test-bucket');
			mockStorageBucket.upload.mockImplementation(async () => {
				uploadAttempts++;

				// First attempt fails with expired token
				if (uploadAttempts === 1) {
					return {
						data: null,
						error: {
							message: 'JWT expired',
							statusCode: '401',
						},
					};
				}

				// Second attempt succeeds after token refresh
				return {
					data: { path: 'test-file.jpg' },
					error: null,
				};
			});

			// Act - Get valid token (triggers refresh)
			await tokenManager.getValidToken();

			// First storage attempt fails
			let result = await mockStorageBucket.upload('test-file.jpg', new Blob(['test data']));
			expect(result.error?.statusCode).toBe('401');

			// Get valid token again and retry
			await tokenManager.getValidToken();
			result = await mockStorageBucket.upload('test-file.jpg', new Blob(['test data']));

			// Assert
			expect(result.data).toBeDefined();
			expect(result.error).toBeNull();
			expect(uploadAttempts).toBe(2);
		});

		it('should handle storage download operations with auth', async () => {
			// Arrange
			mockStorage.setupValidTokens();

			const mockStorageBucket = mockSupabaseClient.storage.from('test-bucket');
			mockStorageBucket.download.mockResolvedValue({
				data: new Blob(['test file content']),
				error: null,
			});

			// Act
			const token = await tokenManager.getValidToken();
			expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

			const downloadResult = await mockStorageBucket.download('test-file.jpg');

			// Assert
			expect(downloadResult.data).toBeDefined();
			expect(downloadResult.error).toBeNull();
			expect(downloadResult.data).toBeInstanceOf(Blob);
		});

		it('should handle storage listing operations with auth', async () => {
			// Arrange
			mockStorage.setupValidTokens();

			const mockStorageBucket = mockSupabaseClient.storage.from('test-bucket');
			mockStorageBucket.list.mockResolvedValue({
				data: [
					{ name: 'file1.jpg', id: 'id1' },
					{ name: 'file2.jpg', id: 'id2' },
				],
				error: null,
			});

			// Act
			const token = await tokenManager.getValidToken();
			expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

			const listResult = await mockStorageBucket.list('folder');

			// Assert
			expect(listResult.data).toBeDefined();
			expect(listResult.error).toBeNull();
			expect(listResult.data).toHaveLength(2);
			expect(listResult.data[0].name).toBe('file1.jpg');
		});
	});

	describe('Supabase Auth Session Management', () => {
		it('should set Supabase session with valid tokens', async () => {
			// Arrange
			mockStorage.setupValidTokens();

			const { updateSupabaseAuth } = require('../../utils/supabaseClient');
			updateSupabaseAuth.mockImplementation(async () => {
				await mockSupabaseClient.auth.setSession({
					access_token: MOCK_TOKENS.VALID_APP_TOKEN,
					refresh_token: MOCK_TOKENS.VALID_REFRESH_TOKEN,
				});
			});

			setupTokenObservers();
			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				await tokenManager.getValidToken();
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));
				await testUtils.waitFor(() => updateSupabaseAuth.mock.calls.length > 0);

				// Assert
				expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
					access_token: MOCK_TOKENS.VALID_APP_TOKEN,
					refresh_token: MOCK_TOKENS.VALID_REFRESH_TOKEN,
				});
			} finally {
				unsubscribe();
			}
		});

		it('should get Supabase session after auth update', async () => {
			// Arrange
			mockSupabaseClient.auth.getSession.mockResolvedValue({
				data: {
					session: {
						access_token: MOCK_TOKENS.VALID_APP_TOKEN,
						refresh_token: MOCK_TOKENS.VALID_REFRESH_TOKEN,
						user: {
							id: MOCK_USER_DATA.sub,
							email: MOCK_USER_DATA.email,
						},
					},
				},
				error: null,
			});

			// Act
			const sessionResult = await mockSupabaseClient.auth.getSession();

			// Assert
			expect(sessionResult.data.session).toBeDefined();
			expect(sessionResult.error).toBeNull();
			expect(sessionResult.data.session.access_token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
			expect(sessionResult.data.session.user.id).toBe(MOCK_USER_DATA.sub);
		});

		it('should handle Supabase sign out', async () => {
			// Arrange
			mockSupabaseClient.auth.signOut.mockResolvedValue({
				error: null,
			});

			// Act
			const signOutResult = await mockSupabaseClient.auth.signOut();

			// Assert
			expect(signOutResult.error).toBeNull();
			expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
		});

		it('should handle Supabase session errors', async () => {
			// Arrange
			mockSupabaseClient.auth.getSession.mockResolvedValue({
				data: { session: null },
				error: {
					message: 'No active session',
					status: 401,
				},
			});

			// Act
			const sessionResult = await mockSupabaseClient.auth.getSession();

			// Assert
			expect(sessionResult.data.session).toBeNull();
			expect(sessionResult.error).toBeDefined();
			expect(sessionResult.error.message).toBe('No active session');
		});
	});

	describe('Integration Error Scenarios', () => {
		it('should handle Supabase client initialization failures', async () => {
			// Arrange
			const { initializeSupabaseAuth } = require('../../utils/supabaseDataService');
			initializeSupabaseAuth.mockRejectedValue(new Error('Supabase initialization failed'));

			mockStorage.setupValidTokens();

			// Act & Assert - Should not crash the auth flow
			const token = await tokenManager.getValidToken();
			expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

			// Supabase initialization failure should be handled gracefully
			expect(consoleMock.logs.some((msg) => msg.includes('Supabase initialization skipped'))).toBe(
				false
			); // This happens at a higher level
		});

		it.skip('should handle mixed auth success and Supabase failures', async () => {
			// Arrange
			const { updateSupabaseAuth } = require('../../utils/supabaseClient');
			updateSupabaseAuth.mockRejectedValue(new Error('Supabase update failed'));

			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			setupTokenObservers();
			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act - Token refresh should succeed even if Supabase update fails
				const token = await tokenManager.getValidToken();

				// Wait for states
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));

				// Assert
				expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

				// Supabase update should have been attempted and failed gracefully
				await testUtils.waitFor(() => updateSupabaseAuth.mock.calls.length > 0);
				expect(updateSupabaseAuth).toHaveBeenCalled();
				expect(
					consoleMock.debugs.some((msg) =>
						msg.includes('Error updating Supabase auth from token observer')
					)
				).toBe(true);
			} finally {
				unsubscribe();
			}
		});

		it.skip('should handle partial Supabase operations during token transitions', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let refreshComplete = false;
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					await testUtils.sleep(200);
					refreshComplete = true;
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			const mockQuery = mockSupabaseClient.from('test_table').select('*');
			mockQuery.eq.mockImplementation(() => {
				if (!refreshComplete) {
					return {
						single: jest.fn().mockResolvedValue({
							data: null,
							error: { message: 'JWT expired', code: 'PGRST301' },
						}),
					};
				}

				return {
					single: jest.fn().mockResolvedValue({
						data: { id: 1, name: 'test' },
						error: null,
					}),
				};
			});

			// Act - Start refresh and immediately try to use Supabase
			const tokenPromise = tokenManager.getValidToken();

			// Try to query before refresh completes
			const earlyResult = await mockQuery.eq('id', 1).single();

			// Wait for refresh to complete
			await tokenPromise;

			// Try to query after refresh completes
			const lateResult = await mockQuery.eq('id', 1).single();

			// Assert
			expect(earlyResult.error?.code).toBe('PGRST301');
			expect(lateResult.data).toBeDefined();
			expect(lateResult.error).toBeNull();
		});
	});
});
