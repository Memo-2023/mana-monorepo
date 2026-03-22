import type {
	AuthServiceConfig,
	AuthEndpoints,
	AuthResult,
	TokenRefreshResult,
	UserData,
	StorageKeys,
	CreditBalance,
	B2BInfo,
} from '../types';
import { getStorageAdapter } from '../adapters/storage';
import { getDeviceAdapter } from '../adapters/device';
import {
	decodeToken,
	isTokenValidLocally,
	getUserFromToken,
	getB2BInfo as getB2BInfoFromToken,
	shouldDisableRevenueCat as checkRevenueCat,
	isB2BUser as checkB2BUser,
	getAppSettings as getAppSettingsFromToken,
} from './jwtUtils';

/**
 * Inline analytics helper - tracks auth events via Umami if available.
 * No-ops silently in environments without Umami (mobile, SSR, dev).
 */
function trackAuth(event: string, data?: Record<string, string | number | boolean>): void {
	if (typeof window !== 'undefined' && (window as any).umami?.track) {
		try {
			(window as any).umami.track(event, data);
		} catch {
			// Silently ignore tracking errors
		}
	}
}

/**
 * Default storage keys
 */
const DEFAULT_STORAGE_KEYS: StorageKeys = {
	APP_TOKEN: '@auth/appToken',
	REFRESH_TOKEN: '@auth/refreshToken',
	USER_EMAIL: '@auth/userEmail',
};

/**
 * Default API endpoints - Updated for Mana Core Auth
 */
const DEFAULT_ENDPOINTS: AuthEndpoints = {
	signIn: '/api/v1/auth/login',
	signUp: '/api/v1/auth/register',
	signOut: '/api/v1/auth/logout',
	refresh: '/api/v1/auth/refresh',
	validate: '/api/v1/auth/validate',
	forgotPassword: '/api/v1/auth/forgot-password',
	resetPassword: '/api/v1/auth/reset-password',
	resendVerification: '/api/v1/auth/resend-verification',
	googleSignIn: '/api/v1/auth/google-signin',
	appleSignIn: '/api/v1/auth/apple-signin',
	credits: '/api/v1/credits/balance',
	// Better Auth native endpoints for SSO
	getSession: '/api/auth/get-session',
};

/**
 * Create an authentication service with the given configuration
 */
export function createAuthService(config: AuthServiceConfig) {
	const baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
	const storageKeys: StorageKeys = { ...DEFAULT_STORAGE_KEYS, ...config.storageKeys };
	const endpoints: AuthEndpoints = { ...DEFAULT_ENDPOINTS, ...config.endpoints };

	// Callback for token refresh events
	let onTokenRefreshCallback: ((userData: UserData) => void) | null = null;

	const service = {
		/**
		 * Sign in with email and password
		 */
		async signIn(email: string, password: string): Promise<AuthResult> {
			try {
				const storage = getStorageAdapter();
				const deviceAdapter = getDeviceAdapter();
				const deviceInfo = await deviceAdapter.getDeviceInfo();

				const response = await fetch(`${baseUrl}${endpoints.signIn}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email,
						password,
						deviceId: deviceInfo?.deviceId,
						deviceName: deviceInfo?.deviceName,
					}),
				});

				if (!response.ok) {
					const errorData = await response.json();
					return service.handleAuthError(response.status, errorData);
				}

				const data = await response.json();
				const appToken = data.accessToken; // Mana Core Auth uses 'accessToken'
				const refreshToken = data.refreshToken;

				await Promise.all([
					storage.setItem(storageKeys.APP_TOKEN, appToken),
					storage.setItem(storageKeys.REFRESH_TOKEN, refreshToken),
					storage.setItem(storageKeys.USER_EMAIL, email),
				]);

				// Also sign in via Better Auth native endpoint to set session cookie
				// This enables cross-subdomain SSO (cookie shared across *.mana.how)
				try {
					await fetch(`${baseUrl}/api/auth/sign-in/email`, {
						method: 'POST',
						credentials: 'include',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email, password }),
					});
				} catch {
					// SSO cookie is nice-to-have, don't fail login if this fails
				}

				trackAuth('login', { method: 'email' });
				return { success: true };
			} catch (error) {
				console.error('Error signing in:', error);
				trackAuth('login_failed', { method: 'email' });
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error during sign in',
				};
			}
		},

		/**
		 * Sign up with email and password
		 * @param email User email
		 * @param password User password
		 * @param sourceAppUrl Optional URL of the app where the user is registering
		 */
		async signUp(email: string, password: string, sourceAppUrl?: string): Promise<AuthResult> {
			try {
				const body: Record<string, string> = { email, password };
				if (sourceAppUrl) {
					body.sourceAppUrl = sourceAppUrl;
				}

				const response = await fetch(`${baseUrl}${endpoints.signUp}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(body),
				});

				if (!response.ok) {
					const errorData = await response.json();

					if (response.status === 409) {
						return { success: false, error: 'Email already in use' };
					} else if (response.status === 400) {
						return { success: false, error: errorData.message || 'Invalid email or password' };
					}

					return { success: false, error: errorData.message || 'Sign up failed' };
				}

				// Consume response to avoid unhandled promise
				await response.json();

				// Mana Core Auth returns user data immediately on registration
				// User needs to sign in separately to get tokens
				trackAuth('signup', { method: 'email' });
				return { success: true, needsVerification: false };
			} catch (error) {
				console.error('Error signing up:', error);
				trackAuth('signup_failed', { method: 'email' });
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error during sign up',
				};
			}
		},

		/**
		 * Sign out the current user
		 */
		async signOut(): Promise<void> {
			try {
				const storage = getStorageAdapter();
				const refreshToken = await storage.getItem<string>(storageKeys.REFRESH_TOKEN);

				if (refreshToken) {
					await fetch(`${baseUrl}${endpoints.signOut}`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ refreshToken }),
					}).catch((err) => console.error('Error logging out on server:', err));
				}

				trackAuth('logout');
				await service.clearAuthStorage();
			} catch (error) {
				console.error('Error signing out:', error);
			}
		},

		/**
		 * Send password reset email
		 * @param email - User's email address
		 * @param redirectTo - Optional URL to redirect after password reset (current app origin)
		 */
		async forgotPassword(email: string, redirectTo?: string): Promise<AuthResult> {
			try {
				const response = await fetch(`${baseUrl}${endpoints.forgotPassword}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, redirectTo }),
				});

				if (!response.ok) {
					const errorData = await response.json();

					if (errorData.message?.includes('rate limit')) {
						return { success: false, error: 'Too many attempts. Please wait before trying again.' };
					}

					return { success: false, error: errorData.message || 'Password reset failed' };
				}

				trackAuth('password_reset_requested');
				return { success: true };
			} catch (error) {
				console.error('Error sending password reset email:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error during password reset',
				};
			}
		},

		/**
		 * Reset password with token
		 */
		async resetPassword(token: string, newPassword: string): Promise<AuthResult> {
			try {
				const response = await fetch(`${baseUrl}${endpoints.resetPassword}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, newPassword }),
				});

				if (!response.ok) {
					const errorData = await response.json();

					if (errorData.message?.includes('expired')) {
						return { success: false, error: 'Reset link has expired. Please request a new one.' };
					}

					if (errorData.message?.includes('invalid')) {
						return { success: false, error: 'Invalid reset link. Please request a new one.' };
					}

					return { success: false, error: errorData.message || 'Password reset failed' };
				}

				return { success: true };
			} catch (error) {
				console.error('Error resetting password:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error during password reset',
				};
			}
		},

		/**
		 * Resend verification email
		 * @param email - User's email address
		 * @param sourceAppUrl - Optional URL to redirect after verification (current app origin)
		 */
		async resendVerificationEmail(email: string, sourceAppUrl?: string): Promise<AuthResult> {
			try {
				const response = await fetch(`${baseUrl}${endpoints.resendVerification}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, sourceAppUrl }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					return {
						success: false,
						error: errorData.message || 'Failed to resend verification email',
					};
				}

				return { success: true };
			} catch (error) {
				console.error('Error resending verification email:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error',
				};
			}
		},

		/**
		 * Refresh the authentication tokens
		 */
		async refreshTokens(currentRefreshToken: string): Promise<TokenRefreshResult> {
			const storage = getStorageAdapter();
			const deviceAdapter = getDeviceAdapter();

			// Check for device ID mismatch
			const storedDeviceId = await deviceAdapter.getStoredDeviceId();
			const deviceInfo = await deviceAdapter.getDeviceInfo();

			if (storedDeviceId && deviceInfo.deviceId !== storedDeviceId) {
				throw new Error('Device ID has changed. Please sign in again.');
			}

			const response = await fetch(`${baseUrl}${endpoints.refresh}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken: currentRefreshToken }),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));

				if (response.status === 401 && errorData.message === 'Invalid refresh token') {
					throw new Error('Session expired. Please sign in again.');
				}

				throw new Error(errorData.message || 'Failed to refresh tokens');
			}

			const data = await response.json();
			const appToken = data.accessToken; // Mana Core Auth uses 'accessToken'
			const refreshToken = data.refreshToken;

			if (!appToken || !refreshToken) {
				throw new Error('Invalid response from token refresh - missing tokens');
			}

			// Store new tokens
			await storage.setItem(storageKeys.APP_TOKEN, appToken);
			await storage.setItem(storageKeys.REFRESH_TOKEN, refreshToken);

			// Extract user data from new token
			const storedEmail = await storage.getItem<string>(storageKeys.USER_EMAIL);
			const userData = getUserFromToken(appToken, storedEmail || undefined);

			// Notify callback if registered
			if (userData && onTokenRefreshCallback) {
				onTokenRefreshCallback(userData);
			}

			return { appToken, refreshToken, userData };
		},

		/**
		 * Sign in with Google
		 */
		async signInWithGoogle(idToken: string): Promise<AuthResult> {
			const result = await service.signInWithSocial(idToken, endpoints.googleSignIn);
			trackAuth(result.success ? 'login' : 'login_failed', { method: 'google' });
			return result;
		},

		/**
		 * Sign in with Apple
		 */
		async signInWithApple(identityToken: string): Promise<AuthResult> {
			const result = await service.signInWithSocial(identityToken, endpoints.appleSignIn);
			trackAuth(result.success ? 'login' : 'login_failed', { method: 'apple' });
			return result;
		},

		/**
		 * Internal: Sign in with social provider
		 */
		async signInWithSocial(token: string, endpoint: string): Promise<AuthResult> {
			try {
				const storage = getStorageAdapter();
				const deviceAdapter = getDeviceAdapter();
				const deviceInfo = await deviceAdapter.getDeviceInfo();

				const response = await fetch(`${baseUrl}${endpoint}`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token, deviceInfo }),
				});

				if (!response.ok) {
					const errorData = await response.json();
					return { success: false, error: errorData.message || 'Social sign in failed' };
				}

				const responseData = await response.json();
				const { appToken, refreshToken } = responseData;

				// Extract email from response or token
				let email = responseData.email;
				if (!email && appToken) {
					const userData = getUserFromToken(appToken);
					email = userData?.email;
				}

				// Store tokens
				const storagePromises = [
					storage.setItem(storageKeys.APP_TOKEN, appToken),
					storage.setItem(storageKeys.REFRESH_TOKEN, refreshToken),
				];

				if (email) {
					storagePromises.push(storage.setItem(storageKeys.USER_EMAIL, email));
				}

				await Promise.all(storagePromises);

				return { success: true };
			} catch (error) {
				console.error('Error with social sign in:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error during social sign in',
				};
			}
		},

		/**
		 * Get the current app token
		 */
		async getAppToken(): Promise<string | null> {
			try {
				const storage = getStorageAdapter();
				return await storage.getItem<string>(storageKeys.APP_TOKEN);
			} catch (error) {
				console.error('Error getting app token:', error);
				return null;
			}
		},

		/**
		 * Get the current refresh token
		 */
		async getRefreshToken(): Promise<string | null> {
			try {
				const storage = getStorageAdapter();
				return await storage.getItem<string>(storageKeys.REFRESH_TOKEN);
			} catch (error) {
				console.debug('Error getting refresh token:', error);
				return null;
			}
		},

		/**
		 * Update stored tokens
		 */
		async updateTokens(appToken: string, refreshToken: string): Promise<void> {
			const storage = getStorageAdapter();
			await Promise.all([
				storage.setItem(storageKeys.APP_TOKEN, appToken),
				storage.setItem(storageKeys.REFRESH_TOKEN, refreshToken),
			]);

			// Notify callback
			const storedEmail = await storage.getItem<string>(storageKeys.USER_EMAIL);
			const userData = getUserFromToken(appToken, storedEmail || undefined);
			if (userData && onTokenRefreshCallback) {
				onTokenRefreshCallback(userData);
			}
		},

		/**
		 * Get user from current token
		 */
		async getUserFromToken(): Promise<UserData | null> {
			const storage = getStorageAdapter();
			const appToken = await storage.getItem<string>(storageKeys.APP_TOKEN);
			if (!appToken) return null;

			const storedEmail = await storage.getItem<string>(storageKeys.USER_EMAIL);
			return getUserFromToken(appToken, storedEmail || undefined);
		},

		/**
		 * Clear all authentication data
		 */
		async clearAuthStorage(): Promise<void> {
			const storage = getStorageAdapter();
			await Promise.all(Object.values(storageKeys).map((key) => storage.removeItem(key)));
		},

		/**
		 * Check if user is authenticated
		 */
		async isAuthenticated(): Promise<boolean> {
			const appToken = await service.getAppToken();
			if (!appToken) return false;
			return isTokenValidLocally(appToken);
		},

		/**
		 * Check if token is valid locally
		 */
		isTokenValidLocally(token: string): boolean {
			return isTokenValidLocally(token);
		},

		/**
		 * Decode token
		 */
		decodeToken(token: string) {
			return decodeToken(token);
		},

		/**
		 * Get user credits
		 */
		async getUserCredits(): Promise<CreditBalance | null> {
			try {
				const appToken = await service.getAppToken();
				if (!appToken) return null;

				const response = await fetch(`${baseUrl}${endpoints.credits}`, {
					method: 'GET',
					headers: {
						Authorization: `Bearer ${appToken}`,
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					throw new Error('Failed to fetch user credits');
				}

				const data = await response.json();
				return {
					credits: (data.balance || 0) + (data.freeCreditsRemaining || 0),
					maxCreditLimit: data.maxCreditLimit || 1000,
					userId: data.userId || 'unknown',
				};
			} catch (error) {
				console.error('Error fetching user credits:', error);
				return null;
			}
		},

		/**
		 * Check if user is B2B
		 */
		async isB2BUser(): Promise<boolean> {
			const appToken = await service.getAppToken();
			if (!appToken) return false;
			return checkB2BUser(appToken);
		},

		/**
		 * Get B2B information
		 */
		async getB2BInfo(): Promise<B2BInfo | null> {
			const appToken = await service.getAppToken();
			if (!appToken) return null;
			return getB2BInfoFromToken(appToken);
		},

		/**
		 * Check if RevenueCat should be disabled
		 */
		async shouldDisableRevenueCat(): Promise<boolean> {
			const appToken = await service.getAppToken();
			if (!appToken) return false;
			return checkRevenueCat(appToken);
		},

		/**
		 * Get app settings from token
		 */
		async getAppSettings(): Promise<Record<string, unknown> | null> {
			const appToken = await service.getAppToken();
			if (!appToken) return null;
			return getAppSettingsFromToken(appToken);
		},

		/**
		 * Set callback for token refresh events
		 */
		set onTokenRefresh(callback: ((userData: UserData) => void) | null) {
			onTokenRefreshCallback = callback;
		},

		/**
		 * Get callback for token refresh events
		 */
		get onTokenRefresh(): ((userData: UserData) => void) | null {
			return onTokenRefreshCallback;
		},

		/**
		 * Handle authentication errors
		 */
		handleAuthError(status: number, errorData: Record<string, unknown>): AuthResult {
			if (status === 401) {
				const isFirebaseUserNeedsReset =
					String(errorData.message).includes('Firebase user detected') ||
					String(errorData.message).includes('password reset required') ||
					errorData.code === 'FIREBASE_USER_PASSWORD_RESET_REQUIRED';

				if (isFirebaseUserNeedsReset) {
					return { success: false, error: 'FIREBASE_USER_PASSWORD_RESET_REQUIRED' };
				}

				const isEmailNotConfirmed =
					String(errorData.message).includes('Email not confirmed') ||
					String(errorData.message).includes('Email not verified') ||
					errorData.code === 'EMAIL_NOT_VERIFIED';

				if (isEmailNotConfirmed) {
					return { success: false, error: 'EMAIL_NOT_VERIFIED' };
				}

				return { success: false, error: 'INVALID_CREDENTIALS' };
			} else if (status === 403) {
				return { success: false, error: 'EMAIL_NOT_VERIFIED' };
			}

			return { success: false, error: String(errorData.message) || 'Authentication failed' };
		},

		/**
		 * Get the base URL
		 */
		getBaseUrl(): string {
			return baseUrl;
		},

		/**
		 * Get storage keys
		 */
		getStorageKeys(): StorageKeys {
			return storageKeys;
		},

		/**
		 * Try to authenticate using SSO session cookie
		 *
		 * This enables cross-domain SSO: If the user is logged in on another app
		 * (e.g., calendar.mana.how), they will automatically be logged in here
		 * via the shared session cookie on .mana.how
		 *
		 * @returns AuthResult with success=true if SSO succeeded
		 */
		async trySSO(): Promise<AuthResult> {
			try {
				const storage = getStorageAdapter();

				// Check if we already have valid tokens - skip SSO if so
				const existingToken = await storage.getItem<string>(storageKeys.APP_TOKEN);
				if (existingToken && isTokenValidLocally(existingToken)) {
					return { success: true };
				}

				// Try to get session from cookie (credentials: 'include' sends cookies)
				const response = await fetch(`${baseUrl}${endpoints.getSession}`, {
					method: 'GET',
					credentials: 'include', // Send cookies cross-origin
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!response.ok) {
					// No valid session cookie - user needs to login manually
					return { success: false, error: 'No SSO session found' };
				}

				const data = await response.json();

				// Better Auth returns session with user info
				if (!data.session || !data.user) {
					return { success: false, error: 'Invalid session response' };
				}

				// Now get tokens by signing in with the session
				// We need to exchange the session for JWT tokens
				const tokenResponse = await fetch(`${baseUrl}/api/v1/auth/session-to-token`, {
					method: 'POST',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json',
					},
				});

				if (!tokenResponse.ok) {
					// Fallback: Session exists but no token endpoint
					// Store session info for display, but user may need to re-authenticate for API calls
					console.warn('SSO: Session found but token exchange not available');
					return { success: false, error: 'Token exchange not available' };
				}

				const tokenData = await tokenResponse.json();
				const appToken = tokenData.accessToken;
				const refreshToken = tokenData.refreshToken;

				if (!appToken || !refreshToken) {
					return { success: false, error: 'Invalid token response' };
				}

				// Store the tokens
				await Promise.all([
					storage.setItem(storageKeys.APP_TOKEN, appToken),
					storage.setItem(storageKeys.REFRESH_TOKEN, refreshToken),
					storage.setItem(storageKeys.USER_EMAIL, data.user.email || ''),
				]);

				console.log('SSO: Successfully authenticated via session cookie');
				trackAuth('login', { method: 'sso' });
				return { success: true };
			} catch (error) {
				// SSO failed - this is expected if user hasn't logged in anywhere
				console.debug('SSO check failed:', error);
				return {
					success: false,
					error: error instanceof Error ? error.message : 'SSO check failed',
				};
			}
		},
	};

	return service;
}

/**
 * Type for the auth service instance
 */
export type AuthService = ReturnType<typeof createAuthService>;
