import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
	createAuthService,
	createTokenManager,
	setStorageAdapter,
	setDeviceAdapter,
	setNetworkAdapter,
	type UserData,
} from '@manacore/shared-auth';
import { logger } from '~/utils/logger';

// Mana Core Auth URL from environment
const MANA_AUTH_URL = process.env.EXPO_PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

// Create SecureStore adapter for React Native
const createSecureStoreAdapter = () => ({
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
});

// Create device adapter for React Native
const createReactNativeDeviceAdapter = () => {
	let deviceId: string | null = null;

	return {
		async getDeviceInfo() {
			if (!deviceId) {
				// Try to get stored device ID
				deviceId = await SecureStore.getItemAsync('@device/id');

				if (!deviceId) {
					// Generate new device ID
					deviceId = `rn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
					await SecureStore.setItemAsync('@device/id', deviceId);
				}
			}

			return {
				deviceId,
				deviceName: 'React Native Device',
				deviceType: 'mobile',
				platform: 'react-native',
			};
		},
		async getStoredDeviceId() {
			return deviceId || (await SecureStore.getItemAsync('@device/id'));
		},
	};
};

// Create network adapter (basic implementation)
const createReactNativeNetworkAdapter = () => ({
	async isDeviceConnected() {
		return true; // Always assume connected for now
	},
	async hasStableConnection() {
		return true;
	},
});

// Initialize adapters
setStorageAdapter(createSecureStoreAdapter());
setDeviceAdapter(createReactNativeDeviceAdapter());
setNetworkAdapter(createReactNativeNetworkAdapter());

// Create auth service
const authService = createAuthService({ baseUrl: MANA_AUTH_URL });
const tokenManager = createTokenManager(authService);

// Export for use in API client
export { authService, tokenManager };

// Auth context type
type AuthContextType = {
	user: UserData | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<{ error: any | null }>;
	signUp: (
		email: string,
		password: string,
		username?: string
	) => Promise<{ error: any | null; data: any | null }>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<{ error: any | null }>;
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to access auth context
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		// Return safe defaults during initial render before provider is ready
		return {
			user: null,
			loading: true,
			signIn: async () => ({ error: null }),
			signUp: async () => ({ error: null, data: null }),
			signOut: async () => {},
			resetPassword: async () => ({ error: null }),
		};
	}
	return context;
};

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);

	// Initialize auth state
	useEffect(() => {
		const initialize = async () => {
			try {
				setLoading(true);
				logger.debug('Initializing auth session...');

				// Check if user is authenticated
				const authenticated = await authService.isAuthenticated();

				if (authenticated) {
					const userData = await authService.getUserFromToken();
					setUser(userData);
					logger.debug('User authenticated:', userData?.id);
				} else {
					logger.debug('No active session found');
				}
			} catch (error) {
				logger.error('Error initializing auth session:', error);
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		initialize();
	}, []);

	// Sign in with email and password
	const signIn = async (email: string, password: string) => {
		try {
			logger.info('Attempting sign in:', email);
			const result = await authService.signIn(email, password);

			if (!result.success) {
				logger.error('Auth error:', result.error);
				return { error: { message: result.error } };
			}

			// Get user data from token
			const userData = await authService.getUserFromToken();
			setUser(userData);

			logger.success('Sign in successful:', userData?.id);
			return { error: null };
		} catch (error: any) {
			logger.error('Unexpected sign in error:', error.message || error);
			return { error };
		}
	};

	// Sign up with email and password
	const signUp = async (email: string, password: string, username?: string) => {
		try {
			logger.info('Attempting sign up:', email);
			const result = await authService.signUp(email, password);

			if (!result.success) {
				return { data: null, error: { message: result.error } };
			}

			// Auto sign in after successful signup
			const signInResult = await signIn(email, password);

			if (signInResult.error) {
				return { data: null, error: signInResult.error };
			}

			logger.success('Sign up successful');
			return { data: user, error: null };
		} catch (error) {
			logger.error('Sign up error:', error);
			return { data: null, error };
		}
	};

	// Sign out
	const signOut = async () => {
		try {
			logger.info('Signing out...');

			// Add timeout to prevent hanging
			const timeout = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Sign out timeout after 5s')), 5000)
			);

			try {
				const signOutPromise = authService.signOut();
				await Promise.race([signOutPromise, timeout]);
				logger.success('Successfully signed out');
			} catch (error: any) {
				logger.error('Sign out failed, forcing local logout:', error);
			}

			// Always clear local state
			setUser(null);
		} catch (error) {
			logger.error('Sign out error:', error);
			setUser(null);
		}
	};

	// Reset password
	const resetPassword = async (email: string) => {
		try {
			logger.info('Requesting password reset for:', email);
			const result = await authService.forgotPassword(email);

			if (!result.success) {
				return { error: { message: result.error } };
			}

			logger.success('Password reset email sent');
			return { error: null };
		} catch (error) {
			logger.error('Password reset error:', error);
			return { error };
		}
	};

	// Show loading indicator during initialization
	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#000',
				}}
			>
				<ActivityIndicator size="large" color="#0A84FF" />
				<Text style={{ marginTop: 16, color: '#fff' }}>
					Authentifizierung wird initialisiert...
				</Text>
			</View>
		);
	}

	// Provide auth context
	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signIn,
				signUp,
				signOut,
				resetPassword,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
