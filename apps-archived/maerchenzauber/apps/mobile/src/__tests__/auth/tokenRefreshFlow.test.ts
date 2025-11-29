/**
 * Token Refresh Flow Test Suite
 * Tests all aspects of the token refresh system including race conditions and concurrent requests
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { authService } from '../../services/authService';
import { tokenManager, TokenState } from '../../services/tokenManager';
import {
	MOCK_TOKENS,
	MOCK_USER_DATA,
	MOCK_DEVICE_INFO,
	mockFetchResponses,
	MockResponseBuilder,
	TestScenarioBuilder,
	TokenStateObserver,
	NetworkCondition,
	testUtils,
	mockStorage,
} from '../utils/authTestUtils';

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

jest.mock('../../utils/networkErrorUtils', () => ({
	hasStableConnection: jest.fn().mockResolvedValue(true),
	isDeviceConnected: jest.fn().mockResolvedValue(true),
}));

describe('Token Refresh Flow', () => {
	let tokenObserver: TokenStateObserver;
	let consoleMock: ReturnType<typeof testUtils.mockConsole>;

	beforeEach(() => {
		tokenObserver = new TokenStateObserver();
		consoleMock = testUtils.mockConsole();

		// Reset token manager state
		tokenManager.reset();

		// Clear storage
		mockStorage.clear();

		// Reset fetch mocks
		if (globalThis.fetch && typeof (globalThis.fetch as any).mockReset === 'function') {
			(globalThis.fetch as jest.Mock).mockReset();
		}
	});

	afterEach(() => {
		consoleMock.restore();
	});

	describe('Automatic Token Refresh', () => {
		it.skip('should refresh token automatically on 401 response', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let callCount = 0;
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				// First call returns 401, second call succeeds
				callCount++;
				if (callCount === 1) {
					return MockResponseBuilder.unauthorized('JWT expired').build();
				}

				return MockResponseBuilder.success({ data: 'success' }).build();
			});

			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act - Make a request that will trigger token refresh
				const response = await tokenManager.handle401Response('http://localhost:3002/api/test', {
					method: 'GET',
					headers: { Authorization: `Bearer ${MOCK_TOKENS.EXPIRED_APP_TOKEN}` },
				});

				// Assert
				expect(response.status).toBe(200);
				expect(callCount).toBe(2); // One 401, one retry with new token

				// Wait for token state update
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.REFRESHING));
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));

				// Verify new token was stored
				const newToken = await mockStorage.getItem('@auth/appToken');
				expect(newToken).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
			} finally {
				unsubscribe();
			}
		});

		it.skip('should queue concurrent requests during token refresh', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let refreshCallCount = 0;
			let apiCallCount = 0;

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					refreshCallCount++;
					// Simulate slow refresh
					await testUtils.sleep(500);
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				if (url.includes('/api/test')) {
					apiCallCount++;
					// Return success after refresh
					return MockResponseBuilder.success({ data: `response-${apiCallCount}` }).build();
				}

				return MockResponseBuilder.unauthorized('JWT expired').build();
			});

			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act - Make multiple concurrent requests
				const requests = [
					tokenManager.handle401Response('http://localhost:3002/api/test1', { method: 'GET' }),
					tokenManager.handle401Response('http://localhost:3002/api/test2', { method: 'GET' }),
					tokenManager.handle401Response('http://localhost:3002/api/test3', { method: 'GET' }),
				];

				const responses = await Promise.all(requests);

				// Assert
				expect(refreshCallCount).toBe(1); // Only one refresh should occur
				expect(responses).toHaveLength(3);
				responses.forEach((response) => {
					expect(response.status).toBe(200);
				});

				// Verify token manager handled queuing correctly
				const queueStatus = tokenManager.getQueueStatus();
				expect(queueStatus.size).toBe(0); // Queue should be empty after processing
			} finally {
				unsubscribe();
			}
		});

		it.skip('should handle refresh token expiration', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenExpired().build();
				}

				return MockResponseBuilder.unauthorized('JWT expired').build();
			});

			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act & Assert
				await expect(
					tokenManager.handle401Response('http://localhost:3002/api/test', { method: 'GET' })
				).rejects.toThrow('Invalid refresh token');

				// Wait for state updates
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.EXPIRED));

				// Verify tokens were cleared
				const appToken = await mockStorage.getItem('@auth/appToken');
				const refreshToken = await mockStorage.getItem('@auth/refreshToken');
				expect(appToken).toBeNull();
				expect(refreshToken).toBeNull();
			} finally {
				unsubscribe();
			}
		});

		it('should detect device ID changes and handle appropriately', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			// Mock device ID mismatch
			const { DeviceManager } = require('../../utils/deviceManager');
			DeviceManager.getStoredDeviceId.mockResolvedValueOnce('old-device-id');
			DeviceManager.getDeviceInfo.mockResolvedValueOnce({
				...MOCK_DEVICE_INFO,
				deviceId: 'new-device-id',
			});

			globalThis.fetch = jest.fn().mockImplementation(async () => {
				return mockFetchResponses.refreshTokenDeviceChanged().build();
			});

			// Act & Assert
			await expect(authService.refreshTokens(MOCK_TOKENS.VALID_REFRESH_TOKEN)).rejects.toThrow(
				'Device ID has changed'
			);
		});
	});

	describe('Token Refresh Race Conditions', () => {
		it.skip('should prevent multiple simultaneous refresh attempts', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let refreshCallCount = 0;
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					refreshCallCount++;
					// Simulate slow refresh
					await testUtils.sleep(300);
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Act - Start multiple refresh attempts simultaneously
			const refreshPromises = [
				tokenManager.getValidToken(),
				tokenManager.getValidToken(),
				tokenManager.getValidToken(),
			];

			const tokens = await Promise.all(refreshPromises);

			// Assert
			expect(refreshCallCount).toBe(1); // Only one refresh should occur
			tokens.forEach((token) => {
				expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
			});
		});

		it.skip('should handle refresh cooldown period', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Act - Make first refresh
			const firstToken = await tokenManager.getValidToken();
			expect(firstToken).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

			// Try to refresh again immediately (should be in cooldown)
			mockStorage.setItem('@auth/appToken', MOCK_TOKENS.EXPIRED_APP_TOKEN);

			const secondToken = await tokenManager.getValidToken();

			// Assert - Should get expired token due to cooldown
			expect(secondToken).toBe(null);
		});

		it.skip('should handle max refresh attempts', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let refreshCallCount = 0;
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					refreshCallCount++;
					// Fail first few attempts, succeed on last
					if (refreshCallCount <= 2) {
						throw new Error('Network error');
					}
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.unauthorized('JWT expired').build();
			});

			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				const token = await tokenManager.getValidToken();

				// Assert
				expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
				expect(refreshCallCount).toBeGreaterThan(1); // Multiple attempts made
			} finally {
				unsubscribe();
			}
		});
	});

	describe('Network Error Handling During Refresh', () => {
		it.skip('should retry refresh on network errors', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let attemptCount = 0;
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					attemptCount++;
					if (attemptCount <= 2) {
						throw new Error('Network request failed');
					}
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Act
			const token = await tokenManager.getValidToken();

			// Assert
			expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
			expect(attemptCount).toBe(3); // Should retry network failures
		});

		it.skip('should not retry on auth errors', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let attemptCount = 0;
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					attemptCount++;
					return mockFetchResponses.refreshTokenExpired().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Act & Assert
			const token = await tokenManager.getValidToken();

			expect(token).toBe(null);
			expect(attemptCount).toBe(1); // Should not retry auth errors
		});

		it.skip('should handle offline state during refresh', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			const { isDeviceConnected } = require('../../utils/networkErrorUtils');
			isDeviceConnected.mockResolvedValueOnce(false);

			// Act
			const token = await tokenManager.getValidToken();

			// Assert - Should return current token if offline and it's not expired locally
			expect(token).toBe(null);
		});

		it.skip('should handle unstable connection during refresh', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			const { isDeviceConnected, hasStableConnection } = require('../../utils/networkErrorUtils');
			isDeviceConnected.mockResolvedValue(true);
			hasStableConnection.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

			let attemptCount = 0;
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					attemptCount++;
					if (attemptCount === 1) {
						// First attempt should not be made due to unstable connection
						return mockFetchResponses.refreshTokenSuccess().build();
					}
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Act
			const token = await tokenManager.getValidToken();

			// Assert
			expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
			expect(attemptCount).toBeGreaterThan(0);
		});
	});

	describe('Token Refresh State Management', () => {
		it.skip('should properly transition through token states', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					// Simulate slow refresh
					await testUtils.sleep(200);
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				const tokenPromise = tokenManager.getValidToken();

				// Assert - Should transition through states
				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.REFRESHING));

				const token = await tokenPromise;
				expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);

				await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));

				const stateTransitions = tokenObserver.getStateTransitions();
				expect(stateTransitions).toContain(TokenState.REFRESHING);
				expect(stateTransitions).toContain(TokenState.VALID);
			} finally {
				unsubscribe();
			}
		});

		it.skip('should notify observers of token state changes', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());
			let observerCallCount = 0;
			const testObserver = tokenManager.subscribe(() => {
				observerCallCount++;
			});

			try {
				// Act
				await tokenManager.getValidToken();

				// Assert
				expect(observerCallCount).toBeGreaterThan(0);
				expect(tokenObserver.getStates().length).toBeGreaterThan(0);
			} finally {
				unsubscribe();
				testObserver();
			}
		});

		it.skip('should handle observer errors gracefully', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.success().build();
			});

			// Observer that throws error
			const errorObserver = jest.fn().mockImplementation(() => {
				throw new Error('Observer error');
			});

			const unsubscribe1 = tokenManager.subscribe(errorObserver);
			const unsubscribe2 = tokenManager.subscribe(tokenObserver.getCallback());

			try {
				// Act
				const token = await tokenManager.getValidToken();

				// Assert
				expect(token).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
				expect(errorObserver).toHaveBeenCalled();
				expect(tokenObserver.getStates().length).toBeGreaterThan(0); // Other observers still work
			} finally {
				unsubscribe1();
				unsubscribe2();
			}
		});
	});

	describe('Request Queueing', () => {
		it.skip('should queue requests during token refresh and process them after', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			let refreshStarted = false;
			let requestsProcessed = 0;

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					refreshStarted = true;
					await testUtils.sleep(500); // Slow refresh
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				if (url.includes('/api/test')) {
					requestsProcessed++;
					return MockResponseBuilder.success({ data: `response-${requestsProcessed}` }).build();
				}

				return MockResponseBuilder.unauthorized('JWT expired').build();
			});

			// Act - Start refresh and queue requests
			const refreshPromise = tokenManager.handle401Response('http://localhost:3002/api/initial', {
				method: 'GET',
			});

			// Wait for refresh to start
			await testUtils.waitFor(() => refreshStarted);

			// Queue additional requests
			const queuedRequests = [
				tokenManager.handle401Response('http://localhost:3002/api/test1', { method: 'GET' }),
				tokenManager.handle401Response('http://localhost:3002/api/test2', { method: 'GET' }),
			];

			// Wait for all requests to complete
			const [initialResponse, ...queuedResponses] = await Promise.all([
				refreshPromise,
				...queuedRequests,
			]);

			// Assert
			expect(initialResponse.status).toBe(200);
			queuedResponses.forEach((response) => {
				expect(response.status).toBe(200);
			});
			expect(requestsProcessed).toBe(3); // All requests were processed after refresh
		});

		it.skip('should handle queue timeout', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			// Mock a very slow refresh that exceeds queue timeout
			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					await testUtils.sleep(35000); // Longer than queue timeout (30s)
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.unauthorized('JWT expired').build();
			});

			// Start refresh
			tokenManager.handle401Response('http://localhost:3002/api/initial', { method: 'GET' });

			await testUtils.sleep(100); // Let refresh start

			// Act & Assert - Queue a request that should timeout
			await expect(
				tokenManager.handle401Response('http://localhost:3002/api/test', { method: 'GET' })
			).rejects.toThrow('Queued request timeout');
		});

		it.skip('should handle queue size limit', async () => {
			// Arrange
			mockStorage.setupExpiredTokens();

			globalThis.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
				const url = typeof input === 'string' ? input : input.toString();

				if (url.includes('/auth/refresh')) {
					await testUtils.sleep(1000); // Slow refresh
					return mockFetchResponses.refreshTokenSuccess().build();
				}

				return MockResponseBuilder.unauthorized('JWT expired').build();
			});

			// Start refresh
			tokenManager.handle401Response('http://localhost:3002/api/initial', { method: 'GET' });

			await testUtils.sleep(100); // Let refresh start

			// Act - Queue many requests (more than MAX_QUEUE_SIZE = 50)
			const queuePromises = [];
			for (let i = 0; i < 52; i++) {
				queuePromises.push(
					tokenManager
						.handle401Response(`http://localhost:3002/api/test${i}`, { method: 'GET' })
						.catch((error) => error)
				);
			}

			const results = await Promise.all(queuePromises);

			// Assert - Some requests should be rejected due to queue limit
			const errors = results.filter((result) => result instanceof Error);
			expect(errors.length).toBeGreaterThan(0);
			expect(errors.some((error) => error.message === 'Request queue full')).toBe(true);
		});
	});
});
