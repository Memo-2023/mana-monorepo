/**
 * Sign In Flow Test Suite
 * Tests all aspects of the authentication sign-in process
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

describe('Sign In Flow', () => {
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

  describe('Successful Sign In', () => {
    it('should sign in successfully with valid credentials', async () => {
      // Arrange
      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

      try {
        // Act
        const result = await authService.signIn('test@example.com', 'password123');

        // Assert
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();

        // Check tokens were stored
        const appToken = await mockStorage.getItem('@auth/appToken');
        const refreshToken = await mockStorage.getItem('@auth/refreshToken');
        const userEmail = await mockStorage.getItem('@auth/userEmail');

        expect(appToken).toBe(MOCK_TOKENS.VALID_APP_TOKEN);
        expect(refreshToken).toBe(MOCK_TOKENS.VALID_REFRESH_TOKEN);
        expect(userEmail).toBe('test@example.com');

        // Verify fetch was called with correct parameters
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/auth/signin'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
              deviceInfo: MOCK_DEVICE_INFO,
            }),
          })
        );
      } finally {
        unsubscribe();
        scenario.cleanup();
      }
    });

    it('should handle sign in with Supabase token', async () => {
      // Arrange
      const mockResponse = MockResponseBuilder.success({
        appToken: MOCK_TOKENS.VALID_APP_TOKEN,
        refreshToken: MOCK_TOKENS.VALID_REFRESH_TOKEN,
        appSupabaseToken: 'mock-supabase-token-12345',
      });

      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockResponse)
        .build();

      // Act
      const result = await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(true);

      const supabaseToken = await mockStorage.getItem('@auth/appSupabaseToken');
      expect(supabaseToken).toBe('mock-supabase-token-12345');

      scenario.cleanup();
    });

    it('should update token manager state after successful sign in', async () => {
      // Arrange
      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      const unsubscribe = tokenManager.subscribe(tokenObserver.getCallback());

      try {
        // Act
        await authService.signIn('test@example.com', 'password123');
        
        // Get a valid token to trigger state update
        await tokenManager.getValidToken();

        // Assert
        await testUtils.waitFor(() => tokenObserver.hasState(TokenState.VALID));
        
        const stateTransitions = tokenObserver.getStateTransitions();
        expect(stateTransitions).toContain(TokenState.VALID);
      } finally {
        unsubscribe();
        scenario.cleanup();
      }
    });
  });

  describe('Failed Sign In Scenarios', () => {
    it('should handle invalid credentials', async () => {
      // Arrange
      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInInvalidCredentials())
        .build();

      // Act
      const result = await authService.signIn('test@example.com', 'wrongpassword');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_CREDENTIALS');

      // Check no tokens were stored
      const appToken = await mockStorage.getItem('@auth/appToken');
      const refreshToken = await mockStorage.getItem('@auth/refreshToken');

      expect(appToken).toBeNull();
      expect(refreshToken).toBeNull();

      scenario.cleanup();
    });

    it('should handle email not verified error', async () => {
      // Arrange
      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInEmailNotVerified())
        .build();

      // Act
      const result = await authService.signIn('unverified@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('EMAIL_NOT_VERIFIED');

      scenario.cleanup();
    });

    it.skip('should handle Firebase user password reset required', async () => {
      // Arrange
      const mockResponse = MockResponseBuilder.error(401, 'Firebase user detected - password reset required');

      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockResponse)
        .build();

      // Act
      const result = await authService.signIn('firebase@example.com', 'oldpassword');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('FIREBASE_USER_PASSWORD_RESET_REQUIRED');

      scenario.cleanup();
    });

    it.skip('should handle network errors during sign in', async () => {
      // Arrange
      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', MockResponseBuilder.networkError())
        .build();

      // Act
      const result = await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unbekannter Fehler bei der Anmeldung');

      scenario.cleanup();
    });

    it.skip('should handle server errors (500)', async () => {
      // Arrange
      const mockResponse = MockResponseBuilder.error(500, 'Internal server error');

      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockResponse)
        .build();

      // Act
      const result = await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Internal server error');

      scenario.cleanup();
    });
  });

  describe('Device Binding Validation', () => {
    it('should include device info in sign in request', async () => {
      // Arrange
      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      // Act
      await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/signin'),
        expect.objectContaining({
          body: expect.stringContaining(JSON.stringify(MOCK_DEVICE_INFO)),
        })
      );

      scenario.cleanup();
    });

    it('should handle device info retrieval errors', async () => {
      // Arrange
      const { DeviceManager } = require('../../utils/deviceManager');
      DeviceManager.getDeviceInfo.mockRejectedValueOnce(new Error('Device info unavailable'));

      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      // Act
      const result = await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Device info unavailable');

      scenario.cleanup();
    });
  });

  describe('Sign In Edge Cases', () => {
    it.skip('should handle empty response body', async () => {
      // Arrange
      const mockResponse = new MockResponseBuilder()
        .withStatus(200)
        .withBody({}) // Empty response
        .build();

      globalThis.fetch = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(consoleMock.errors.some(error => error.includes('Error signing in'))).toBe(true);
    });

    it.skip('should handle malformed response body', async () => {
      // Arrange
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      } as Partial<Response>;

      globalThis.fetch = jest.fn().mockResolvedValue(mockResponse);

      // Act
      const result = await authService.signIn('test@example.com', 'password123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unbekannter Fehler bei der Anmeldung');
    });

    it('should handle concurrent sign in attempts', async () => {
      // Arrange
      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      // Act - Make concurrent sign in requests
      const promises = [
        authService.signIn('test@example.com', 'password123'),
        authService.signIn('test@example.com', 'password123'),
        authService.signIn('test@example.com', 'password123'),
      ];

      const results = await Promise.all(promises);

      // Assert - All should succeed (no race conditions)
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      scenario.cleanup();
    });

    it('should handle extremely long email/password', async () => {
      // Arrange
      const longEmail = 'a'.repeat(1000) + '@example.com';
      const longPassword = 'b'.repeat(1000);

      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      // Act
      const result = await authService.signIn(longEmail, longPassword);

      // Assert
      expect(result.success).toBe(true);

      scenario.cleanup();
    });
  });

  describe('Storage Error Handling', () => {
    it.skip('should handle storage write failures', async () => {
      // Arrange
      const originalSetItem = mockStorage.setItem;
      mockStorage.setItem = jest.fn().mockRejectedValue(new Error('Storage write failed'));

      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      try {
        // Act
        const result = await authService.signIn('test@example.com', 'password123');

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('Unbekannter Fehler bei der Anmeldung');
      } finally {
        mockStorage.setItem = originalSetItem;
        scenario.cleanup();
      }
    });

    it('should handle partial storage write failures', async () => {
      // Arrange
      let callCount = 0;
      const originalSetItem = mockStorage.setItem;
      mockStorage.setItem = jest.fn().mockImplementation((key, value) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Storage write failed on second call');
        }
        return originalSetItem.call(mockStorage, key, value);
      });

      const scenario = new TestScenarioBuilder()
        .withNoTokens()
        .withMockResponse('/auth/signin', mockFetchResponses.signInSuccess())
        .build();

      try {
        // Act
        const result = await authService.signIn('test@example.com', 'password123');

        // Assert
        expect(result.success).toBe(false);
      } finally {
        mockStorage.setItem = originalSetItem;
        scenario.cleanup();
      }
    });
  });
});