import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import {
	createAuthService,
	createTokenManager,
	setStorageAdapter,
	setDeviceAdapter,
	setNetworkAdapter,
	createMemoryStorageAdapter,
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
	async isConnected() {
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

// Auth context type
type AuthResult = { success: boolean; error?: string };

type AuthContextType = {
	user: UserData | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<AuthResult>;
	signUp: (
		email: string,
		password: string
	) => Promise<AuthResult & { needsVerification?: boolean }>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<AuthResult>;
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

				// Check if user is authenticated
				const authenticated = await authService.isAuthenticated();

				if (authenticated) {
					const userData = await authService.getUserFromToken();
					setUser(userData);
				}
			} catch (error) {
				console.error('Fehler beim Initialisieren der Auth-Session:', error);
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		initialize();
	}, []);

	// Sign in with email and password
	const signIn = async (email: string, password: string): Promise<AuthResult> => {
		try {
			const result = await authService.signIn(email, password);

			if (!result.success) {
				return { success: false, error: result.error || 'Login failed' };
			}

			const userData = await authService.getUserFromToken();
			setUser(userData);

			return { success: true };
		} catch (error: any) {
			console.error('Fehler beim Anmelden:', error.message || error);
			return { success: false, error: error.message || 'Unknown error' };
		}
	};

	// Sign up with email and password
	const signUp = async (email: string, password: string) => {
		try {
			const result = await authService.signUp(email, password);

			if (!result.success) {
				return { success: false, error: result.error || 'Signup failed' };
			}

			if (result.needsVerification) {
				return { success: true, needsVerification: true };
			}

			// Auto sign in after successful signup
			return signIn(email, password);
		} catch (error: any) {
			console.error('Fehler beim Registrieren:', error);
			return { success: false, error: error.message || 'Unknown error' };
		}
	};

	// Sign out
	const signOut = async () => {
		try {
			await authService.signOut();
			setUser(null);
		} catch (error) {
			console.error('Fehler beim Abmelden:', error);
		}
	};

	// Reset password
	const resetPassword = async (email: string): Promise<AuthResult> => {
		try {
			const result = await authService.forgotPassword(email);

			if (!result.success) {
				return { success: false, error: result.error || 'Password reset failed' };
			}

			return { success: true };
		} catch (error: any) {
			console.error('Fehler beim Zurücksetzen des Passworts:', error);
			return { success: false, error: error.message || 'Unknown error' };
		}
	};

	// Show loading indicator during initialization
	if (loading) {
		return (
			<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color="#F59E0B" />
				<Text style={{ marginTop: 16 }}>Authentifizierung wird initialisiert...</Text>
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
