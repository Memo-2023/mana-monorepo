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
				deviceId = await SecureStore.getItemAsync('@device/id');

				if (!deviceId) {
					deviceId = `rn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
					await SecureStore.setItemAsync('@device/id', deviceId);
				}
			}

			return {
				deviceId,
				deviceName: 'React Native Device',
				platform: 'react-native',
			};
		},
		async getStoredDeviceId() {
			return deviceId || (await SecureStore.getItemAsync('@device/id'));
		},
	};
};

// Create network adapter
const createReactNativeNetworkAdapter = () => ({
	async isConnected() {
		return true;
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

// Auth context type
type AuthContextType = {
	user: UserData | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<{ error: any | null }>;
	signUp: (email: string, password: string) => Promise<{ error: any | null; data: any | null }>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<{ error: any | null }>;
	getToken: () => Promise<string | null>;
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to access auth context
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
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

				const authenticated = await authService.isAuthenticated();

				if (authenticated) {
					const userData = await authService.getUserFromToken();
					setUser(userData);
				}
			} catch (error) {
				console.error('Error initializing auth session:', error);
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
			const result = await authService.signIn(email, password);

			if (!result.success) {
				return { error: { message: result.error } };
			}

			const userData = await authService.getUserFromToken();
			setUser(userData);

			return { error: null };
		} catch (error: any) {
			return { error };
		}
	};

	// Sign up with email and password
	const signUp = async (email: string, password: string) => {
		try {
			const result = await authService.signUp(email, password);

			if (!result.success) {
				return { data: null, error: { message: result.error } };
			}

			const signInResult = await signIn(email, password);

			if (signInResult.error) {
				return { data: null, error: signInResult.error };
			}

			return { data: user, error: null };
		} catch (error) {
			return { data: null, error };
		}
	};

	// Sign out
	const signOut = async () => {
		try {
			await authService.signOut();
			setUser(null);
		} catch (error) {
			console.error('Error signing out:', error);
		}
	};

	// Reset password
	const resetPassword = async (email: string) => {
		try {
			const result = await authService.forgotPassword(email);

			if (!result.success) {
				return { error: { message: result.error } };
			}

			return { error: null };
		} catch (error) {
			return { error };
		}
	};

	// Get token for API calls
	const getToken = async () => {
		try {
			return await tokenManager.getAccessToken();
		} catch {
			return null;
		}
	};

	// Show loading indicator during initialization
	if (loading) {
		return (
			<View
				style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}
			>
				<ActivityIndicator size="large" color="#6366f1" />
				<Text style={{ marginTop: 16, color: '#fff' }}>Loading...</Text>
			</View>
		);
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signIn,
				signUp,
				signOut,
				resetPassword,
				getToken,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
