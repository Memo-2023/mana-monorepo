import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { authService } from '../services/authService';
import { updateSupabaseAuth, setSupabaseToken } from '../lib/supabaseClient';
import { setupGlobalFetchInterceptor, setupTokenObservers } from '../utils/fetchInterceptor';
import { tokenManager, TokenState } from '../services/tokenManager';
import {
	initializeRevenueCatConditionally,
	identifyRevenueCatUser,
	resetRevenueCatUser,
} from '~/features/subscription/revenueCatManager';

// User type
type User = {
	id: string;
	email: string;
	role: string;
	name: string;
};

// Define type for the Auth context
type AuthContextType = {
	isAuthenticated: boolean;
	user: User | null;
	loading: boolean;
	showPasswordResetModal: boolean;
	setShowPasswordResetModal: (show: boolean) => void;
	authModeOverride: string | null;
	setAuthModeOverride: (mode: string | null) => void;
	setUser: (userData: { id: string; email: string; role: string }) => void;
	signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
	signUp: (
		email: string,
		password: string
	) => Promise<{ success: boolean; error?: string; needsVerification?: boolean }>;
	signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
	signOut: () => Promise<void>;
};

// Create context with default values
const AuthContext = createContext<AuthContextType>({
	isAuthenticated: false,
	user: null,
	loading: false,
	showPasswordResetModal: false,
	setShowPasswordResetModal: () => {},
	authModeOverride: null,
	setAuthModeOverride: () => {},
	setUser: () => {},
	signIn: async () => ({ success: false }),
	signUp: async () => ({ success: false }),
	signInWithGoogle: async () => ({ success: false }),
	signOut: async () => {},
});

// Hook for easy access to the Auth context
export const useAuth = () => useContext(AuthContext);

// Auth Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [loading, setLoading] = useState(true);
	const [user, setUser] = useState<User | null>(null);
	const [isSigningOut, setIsSigningOut] = useState(false);
	const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
	const [authModeOverride, setAuthModeOverride] = useState<string | null>(null);

	// Use a ref to track the latest auth state for the token observer
	const authStateRef = useRef({ isAuthenticated, user });

	// Update the ref whenever auth state changes
	useEffect(() => {
		authStateRef.current = { isAuthenticated, user };
	}, [isAuthenticated, user]);

	// Update user data when it changes
	const updateUserData = useCallback((userData: { id: string; email: string; role: string }) => {
		console.debug('Auth: updateUserData called with:', userData);
		if (userData) {
			console.debug('Auth: Setting isAuthenticated to true and updating user');
			setIsAuthenticated(true);
			// Add name field derived from email
			const userWithName = {
				...userData,
				name: userData.email.split('@')[0],
			};
			setUser(userWithName);
			console.debug('Auth: User data updated successfully');
		} else {
			console.debug('Auth: updateUserData called with null/undefined userData');
		}
	}, []);

	// Load auth state on startup
	useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		const initAuth = async () => {
			try {
				// Set up the global fetch interceptor FIRST - this is critical for handling 401s during auth check
				setupGlobalFetchInterceptor();

				// Set up token manager observers for Supabase integration
				setupTokenObservers();

				// Register the token refresh callback BEFORE any auth operations
				authService.onTokenRefresh = updateUserData;

				// Subscribe to token state changes for UI updates
				unsubscribe = tokenManager.subscribe((state: TokenState, token?: string) => {
					console.debug('Auth: Token state changed to', state);
					console.debug(
						'Auth: Current auth state - isAuthenticated:',
						authStateRef.current.isAuthenticated,
						'user:',
						!!authStateRef.current.user
					);

					if (state === TokenState.VALID && token) {
						// We have a valid token, try to get user data
						console.debug('Auth: Token is VALID, attempting to get user data...');
						authService
							.getUserFromToken()
							.then((userData) => {
								console.debug('Auth: getUserFromToken result:', userData);
								if (userData) {
									console.debug('Auth: Calling updateUserData with:', userData);
									updateUserData(userData);
									// Force a re-check of auth state after update
									setTimeout(() => {
										console.debug(
											'Auth: After updateUserData - isAuthenticated:',
											authStateRef.current.isAuthenticated,
											'user:',
											!!authStateRef.current.user
										);
									}, 100);
								} else {
									console.debug('Auth: getUserFromToken returned null/undefined');
								}
							})
							.catch((error) => {
								console.debug('Error getting user data from token:', error);
							});
					} else if (state === TokenState.EXPIRED_OFFLINE) {
						// Token expired while offline - preserve auth state, don't logout
						console.debug('Auth: Token expired offline, preserving auth state');
						// User can continue using the app offline, token will refresh when connection returns
						return; // Don't trigger logout
					} else if (state === TokenState.EXPIRED && !isSigningOut) {
						// Only handle token expiration if we're not actively signing out
						console.debug('Auth: Token expired, handling expiration. isSigningOut:', isSigningOut);
						handleTokenExpiration().catch((error) => {
							console.debug('Error during token expiration handling:', error);
						});
					}
				});

				// Check if user is authenticated (uses local validation to avoid race conditions)
				const authenticated = await authService.isAuthenticated();

				if (authenticated) {
					// Get user information from token
					const userData = await authService.getUserFromToken();

					if (userData) {
						updateUserData(userData);

						// Update Supabase auth state only if we have a valid current token
						// to avoid triggering unnecessary token refresh during startup
						try {
							const currentToken = await authService.getAppToken();
							if (currentToken && authService.isTokenValidLocally(currentToken)) {
								// Only update Supabase if we have a valid token to avoid refresh cycles
								console.debug('Updating Supabase auth with existing valid token');
								await setSupabaseToken(currentToken);
							}
						} catch (error) {
							console.debug('Error setting Supabase token during startup:', error);
						}

						// Initialize RevenueCat conditionally for existing authenticated users
						try {
							await initializeRevenueCatConditionally();
							await identifyRevenueCatUser(userData.id);
						} catch (error) {
							console.error('Error with RevenueCat initialization for existing user:', error);
							// Don't block startup if initialization fails
						}
					} else {
						// If user data couldn't be retrieved, sign out
						await handleSignOut();
					}
				} else {
					// If not authenticated, make sure we're on the login screen
					if (router.canGoBack()) {
						router.replace('/(public)/login');
					}
				}
			} catch (error) {
				console.error('Error initializing auth state:', error);
				// On error, make sure we're signed out and on login screen
				await handleSignOut();
			} finally {
				setLoading(false);
			}
		};

		initAuth();

		// Cleanup the callback and subscription on unmount
		return () => {
			authService.onTokenRefresh = null;
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, []); // Empty dependencies - we use refs to access latest values

	// Handle sign in
	const handleSignIn = async (email: string, password: string) => {
		// Set loading state immediately
		setLoading(true);

		try {
			// Authenticate with the API
			const result = await authService.signIn(email, password);

			if (result.success) {
				// Reset password reset modal on successful login
				setShowPasswordResetModal(false);

				try {
					// Get user information from token
					const userData = await authService.getUserFromToken();

					if (userData) {
						updateUserData(userData);

						// Update Supabase auth state
						await updateSupabaseAuth();

						// Initialize RevenueCat conditionally based on B2B settings
						try {
							await initializeRevenueCatConditionally();
							await identifyRevenueCatUser(userData.id);
						} catch (error) {
							console.error('Error with RevenueCat initialization:', error);
							// Don't block auth flow if initialization fails
						}

						// Use replace to prevent swiping back to login
						// Small delay to ensure auth state is updated
						setTimeout(() => {
							router.replace('/(protected)/(tabs)/');
						}, 100);
					}
				} catch (err) {
					console.error('Error getting user data after sign in:', err);
					// Keep loading false but return the success result
					// This will allow navigation to proceed even if we couldn't get user data
				}
			}

			// Check if it's a password reset required error
			if (!result.success && result.error === 'FIREBASE_USER_PASSWORD_RESET_REQUIRED') {
				console.log('AuthContext: Setting showPasswordResetModal to true');
				setShowPasswordResetModal(true);
			}

			return result;
		} catch (error) {
			console.error('Error in handleSignIn:', error);
			return { success: false, error: 'An unexpected error occurred' };
		} finally {
			// Always set loading to false when done, regardless of success or failure
			setLoading(false);
		}
	};

	// Handle sign up
	const handleSignUp = async (email: string, password: string) => {
		// Set loading state immediately
		setLoading(true);

		try {
			// Register with the API
			const result = await authService.signUp(email, password);

			if (result.success) {
				// Check if email verification is needed
				if (result.needsVerification) {
					// Don't authenticate user, just return success with verification flag
					return result;
				}

				try {
					// Get user information from token (only if no verification needed)
					const userData = await authService.getUserFromToken();

					if (userData) {
						updateUserData(userData);

						// Update Supabase auth state
						await updateSupabaseAuth();

						// Initialize RevenueCat conditionally based on B2B settings
						try {
							await initializeRevenueCatConditionally();
							await identifyRevenueCatUser(userData.id);
						} catch (error) {
							console.error('Error with RevenueCat initialization:', error);
							// Don't block auth flow if initialization fails
						}

						// Use replace to prevent swiping back to login
						// Small delay to ensure auth state is updated
						setTimeout(() => {
							router.replace('/(protected)/(tabs)/');
						}, 100);
					}
				} catch (err) {
					console.error('Error getting user data after sign up:', err);
					// Keep loading false but return the success result
				}
			}

			return result;
		} catch (error) {
			console.error('Error in handleSignUp:', error);
			return { success: false, error: 'An unexpected error occurred' };
		} finally {
			// Always set loading to false when done, regardless of success or failure
			setLoading(false);
		}
	};

	// Handle sign out
	const handleSignOut = async () => {
		// Prevent multiple simultaneous logout calls
		if (isSigningOut) {
			console.debug('Auth: Sign out already in progress, skipping');
			return;
		}

		setIsSigningOut(true);
		try {
			// Track sign out event before clearing user data
			// Use TokenManager to clear tokens and state
			await tokenManager.clearTokens();

			// Also call authService signOut for any server-side cleanup
			await authService.signOut();

			setIsAuthenticated(false);
			setUser(null);

			// Update Supabase auth state
			await updateSupabaseAuth();

			// Reset RevenueCat user to anonymous
			try {
				await resetRevenueCatUser();
			} catch (error) {
				console.error('Error resetting RevenueCat user:', error);
				// Don't block sign out if reset fails
			}

			// Don't navigate here - let the root layout handle navigation based on auth state
			// This prevents the infinite redirect loop on Android
		} catch (error) {
			console.error('Error signing out:', error);
		} finally {
			setIsSigningOut(false);
		}
	};

	// Handle token expiration - try to refresh before logging out
	const handleTokenExpiration = async () => {
		console.debug('Auth: Handling token expiration');

		// Check if we're offline first
		const { hasStableConnection, isDeviceConnected } = await import(
			'~/features/errorHandling/utils/networkErrorUtils'
		);
		const isOnline = await isDeviceConnected();

		if (!isOnline) {
			console.debug('Auth: Device offline, preserving auth state');
			return; // Don't logout when offline
		}

		// Check if connection is stable before attempting critical operations
		const isStable = await hasStableConnection();
		if (!isStable) {
			console.debug('Auth: Connection unstable during token expiration, deferring action');
			// Schedule a retry after network stabilizes
			setTimeout(() => {
				// Re-check token state after delay
				const currentState = tokenManager.getState();
				if (currentState === TokenState.EXPIRED) {
					handleTokenExpiration();
				}
			}, 3000);
			return;
		}

		try {
			// Check if we can attempt a refresh (has valid refresh token)
			const canRefresh = await tokenManager.canAttemptRefresh();

			if (canRefresh) {
				console.debug('Auth: Refresh token available, attempting refresh before logout');

				// Try to get a valid token (this will trigger refresh if needed)
				const validToken = await tokenManager.getValidToken();

				if (validToken) {
					console.debug('Auth: Token refresh successful, staying logged in');
					// Token refresh succeeded, the TokenManager will notify us of the new valid state
					// Update user data to ensure UI is synchronized
					const userData = await authService.getUserFromToken();
					if (userData) {
						updateUserData(userData);
					}
					return;
				} else {
					console.debug('Auth: Token refresh failed despite having refresh token');
				}
			} else {
				console.debug('Auth: No refresh token available');
			}

			// No refresh token or refresh failed, proceed with logout
			console.debug('Auth: Proceeding with logout due to expired tokens');
			await handleSignOut();
		} catch (error) {
			console.debug('Error during token expiration handling:', error);
			// If anything fails, fall back to logout to ensure security
			await handleSignOut();
		}
	};

	// Handle Google Sign-In
	const handleGoogleSignIn = async () => {
		setLoading(true);

		try {
			// The actual Google Sign-In is handled in the GoogleSignInButton component
			// Here we just handle the post-authentication flow

			try {
				// Get user information from token
				const userData = await authService.getUserFromToken();

				if (userData) {
					updateUserData(userData);

					// Update Supabase auth state
					await updateSupabaseAuth();

					// Identify user with RevenueCat
					try {
						await identifyRevenueCatUser(userData.id);
					} catch (rcError) {
						console.error('Error identifying user with RevenueCat:', rcError);
						// Don't block auth flow if RevenueCat identification fails
					}

					// Track Google sign in event
					identify(userData.id, {
						email: userData.email,
						role: userData.role,
					});
					track('user_signed_in', {
						method: 'google',
					});

					// Use replace to prevent swiping back to login
					// Small delay to ensure auth state is updated
					setTimeout(() => {
						router.replace('/(protected)/(tabs)/');
					}, 100);

					return { success: true };
				}
			} catch (err) {
				console.error('Error getting user data after Google Sign-In:', err);
			}

			return { success: false, error: 'No user data available after Google Sign-In' };
		} catch (error) {
			console.error('Error in handleGoogleSignIn:', error);
			return { success: false, error: 'An unexpected error occurred during Google Sign-In' };
		} finally {
			setLoading(false);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				isAuthenticated,
				user,
				loading,
				showPasswordResetModal,
				setShowPasswordResetModal,
				authModeOverride,
				setAuthModeOverride,
				setUser: updateUserData,
				signIn: handleSignIn,
				signUp: handleSignUp,
				signInWithGoogle: handleGoogleSignIn,
				signOut: handleSignOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};
