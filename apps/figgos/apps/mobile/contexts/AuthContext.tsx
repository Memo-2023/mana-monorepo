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
				deviceType: 'mobile',
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
	async isDeviceConnected() {
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
};

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to access auth context
export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		return {
			user: null,
			loading: true,
			signIn: async () => ({ error: null }),
			signUp: async () => ({ error: null, data: null }),
			signOut: async () => {},
		};
	}
	return context;
};

// AuthProvider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserData | null>(null);
	const [loading, setLoading] = useState(true);

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

	const signUp = async (email: string, password: string, _username?: string) => {
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

	const signOut = async () => {
		try {
			const timeout = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Sign out timeout after 5s')), 5000)
			);

			try {
				await Promise.race([authService.signOut(), timeout]);
			} catch {
				// Force local logout on failure
			}

			setUser(null);
		} catch {
			setUser(null);
		}
	};

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: '#1A1A2E',
				}}
			>
				<ActivityIndicator size="large" color="#6C5CE7" />
				<Text style={{ marginTop: 16, color: '#fff' }}>Loading...</Text>
			</View>
		);
	}

	return (
		<AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
			{children}
		</AuthContext.Provider>
	);
}
