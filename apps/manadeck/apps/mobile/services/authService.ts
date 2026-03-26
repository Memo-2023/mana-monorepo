/**
 * Mana Core Authentication Service
 * Uses @manacore/shared-auth for unified auth across all apps
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
	createAuthService,
	createTokenManager,
	setStorageAdapter,
	setDeviceAdapter,
	setNetworkAdapter,
	isTokenValidLocally as sharedIsTokenValidLocally,
	getUserFromToken as sharedGetUserFromToken,
	decodeToken as sharedDecodeToken,
} from '@manacore/shared-auth';
import type { ManaUser, JwtPayload } from '../types/auth';

// Mana Core Auth URL
const AUTH_URL = process.env.EXPO_PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// --- Adapters ---

const secureStoreAdapter = {
	async getItem<T>(key: string): Promise<T | null> {
		try {
			const value = await SecureStore.getItemAsync(key);
			return value ? JSON.parse(value) : null;
		} catch {
			return null;
		}
	},
	async setItem(key: string, value: unknown): Promise<void> {
		await SecureStore.setItemAsync(key, JSON.stringify(value));
	},
	async removeItem(key: string): Promise<void> {
		await SecureStore.deleteItemAsync(key);
	},
};

const deviceAdapter = (() => {
	let deviceId: string | null = null;
	return {
		async getDeviceInfo() {
			if (!deviceId) {
				deviceId = await SecureStore.getItemAsync('@device/id');
				if (!deviceId) {
					deviceId = `rn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
					await SecureStore.setItemAsync('@device/id', deviceId);
				}
			}
			return {
				deviceId,
				deviceName: `${Platform.OS} Device`,
				platform: 'react-native',
				deviceType: Platform.OS,
			};
		},
		async getStoredDeviceId() {
			return deviceId || (await SecureStore.getItemAsync('@device/id'));
		},
	};
})();

const networkAdapter = {
	async isDeviceConnected() {
		return true;
	},
	async hasStableConnection() {
		return true;
	},
};

// --- Initialize shared-auth ---

setStorageAdapter(secureStoreAdapter);
setDeviceAdapter(deviceAdapter);
setNetworkAdapter(networkAdapter);

const _sharedAuth = createAuthService({ baseUrl: AUTH_URL });
const _sharedTokenManager = createTokenManager(_sharedAuth);

// --- Helpers ---

function toManaUser(
	userData: { id: string; email: string; role?: string } | null
): ManaUser | null {
	if (!userData) return null;
	return {
		id: userData.id,
		email: userData.email,
		role: userData.role || 'user',
		name: userData.email?.split('@')[0] || 'User',
	};
}

// --- Auth Service (backward-compatible API) ---

export const authService = {
	signIn: async (
		email: string,
		password: string
	): Promise<{ success: boolean; user?: ManaUser; error?: string }> => {
		try {
			const result = await _sharedAuth.signIn(email, password);
			if (!result.success) {
				return { success: false, error: result.error || 'Authentication failed' };
			}
			const userData = await _sharedAuth.getUserFromToken();
			return { success: true, user: toManaUser(userData) || undefined };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	},

	signUp: async (
		email: string,
		password: string,
		_username?: string
	): Promise<{ success: boolean; user?: ManaUser; error?: string }> => {
		try {
			// TODO: username is not supported by mana-core-auth signUp - add profile update after registration
			const result = await _sharedAuth.signUp(email, password);
			if (!result.success) {
				return { success: false, error: result.error || 'Sign up failed' };
			}

			if (result.needsVerification) {
				return { success: true, error: 'Please verify your email before signing in.' };
			}

			// Auto sign-in after successful signup
			return authService.signIn(email, password);
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	},

	signOut: async (): Promise<void> => {
		try {
			await _sharedAuth.signOut();
		} catch (error) {
			console.error('Sign out error:', error);
		}
	},

	resetPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
		try {
			const result = await _sharedAuth.forgotPassword(email);
			if (!result.success) {
				return { success: false, error: result.error || 'Failed to send reset email' };
			}
			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	},

	getAppToken: async (): Promise<string | null> => {
		return await _sharedAuth.getAppToken();
	},

	getRefreshToken: async (): Promise<string | null> => {
		return await _sharedAuth.getRefreshToken();
	},

	refreshTokens: async (
		_currentRefreshToken: string
	): Promise<{
		appToken: string;
		refreshToken: string;
		userData?: { id: string; email: string; role: string } | null;
	}> => {
		// shared-auth handles refresh internally - just trigger it
		await _sharedAuth.refreshTokens();
		const appToken = (await _sharedAuth.getAppToken()) || '';
		const refreshToken = (await _sharedAuth.getRefreshToken()) || '';
		const user = appToken ? sharedGetUserFromToken(appToken) : null;
		return {
			appToken,
			refreshToken,
			userData: user ? { id: user.id, email: user.email, role: user.role || 'user' } : null,
		};
	},

	clearAuthStorage: async (): Promise<void> => {
		await _sharedAuth.signOut();
	},

	isAuthenticated: async (): Promise<boolean> => {
		return await _sharedAuth.isAuthenticated();
	},

	decodeToken: (token: string): JwtPayload | null => {
		return sharedDecodeToken(token) as JwtPayload | null;
	},

	getUserFromToken: (token: string): ManaUser | null => {
		const userData = sharedGetUserFromToken(token);
		return toManaUser(userData);
	},

	isTokenValidLocally: (token: string): boolean => {
		return sharedIsTokenValidLocally(token);
	},

	getCredits: async (): Promise<number | null> => {
		try {
			const credits = await _sharedAuth.getUserCredits();
			return credits?.credits ?? null;
		} catch {
			return null;
		}
	},

	onTokenRefresh: null as ((userData: { id: string; email: string; role: string }) => void) | null,
};

// Wire up token refresh callback
_sharedAuth.onTokenRefresh = async () => {
	if (authService.onTokenRefresh) {
		const token = await _sharedAuth.getAppToken();
		if (token) {
			const user = sharedGetUserFromToken(token);
			if (user) {
				authService.onTokenRefresh({
					id: user.id,
					email: user.email,
					role: user.role || 'user',
				});
			}
		}
	}
};

// Export shared-auth instances for direct use
export { _sharedAuth, _sharedTokenManager };
