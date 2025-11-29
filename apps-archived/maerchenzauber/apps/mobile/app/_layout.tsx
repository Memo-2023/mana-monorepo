import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, Platform, Dimensions, StyleSheet, Linking } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { DebugProvider } from '../src/contexts/DebugContext';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { theme } from '../src/theme/theme';
import { Redirect } from 'expo-router';
import * as Font from 'expo-font';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { safeStorage } from '../src/utils/safeStorage';
import '../src/i18n'; // Initialize i18n

// NOTE: Fetch interceptor and token observers are now set up in AuthContext
// to prevent race conditions during initialization

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
	/* reloading the app might trigger some race conditions, ignore them */
});
import { PostHogWebProvider } from '../src/providers/PostHogWebProvider';
import { usePostHog } from '../src/hooks/usePostHogWeb';
import {
	useFonts,
	Grandstander_400Regular,
	Grandstander_700Bold,
} from '@expo-google-fonts/grandstander';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../src/config/toastConfig';
import GlobalInsufficientCreditsHandler from '../components/molecules/GlobalInsufficientCreditsHandler';
import {
	initializeRevenueCat,
	identifyRevenueCatUser,
	resetRevenueCatUser,
} from '../src/features/subscription/revenueCatManager';

function RootLayoutNav() {
	const { user, loading, isAuthenticated } = useAuth();
	const [customFontsLoaded, setCustomFontsLoaded] = useState(false);
	const posthog = usePostHog();
	const [sessionStartTime] = useState(new Date());
	const segments = useSegments();
	const router = useRouter();
	const navigationState = useRootNavigationState();
	const [hasToken, setHasToken] = useState(false);

	// Navigation state to prevent loops
	const lastNavigationTimeRef = React.useRef<number>(0);
	const lastNavigationTargetRef = React.useRef<string | null>(null);
	const navigationCooldown = 200; // 200ms cooldown to prevent double-taps

	// Deep link handling state
	const pendingDeeplinkRef = useRef<string | null>(null);
	const deeplinkProcessedRef = useRef(false);

	// Check for token on mount and when auth state changes
	useEffect(() => {
		// Use safeStorage (AsyncStorage) where auth tokens are actually stored
		safeStorage.getItem<string>('@auth/appToken').then((token) => {
			console.log('[_layout] Token check on startup:', token ? 'Token exists' : 'No token found');
			setHasToken(token !== null);
		});
	}, [isAuthenticated]); // Re-check when authentication state changes

	// Initialize RevenueCat on app start
	useEffect(() => {
		async function initRC() {
			try {
				console.log('[_layout] Initializing RevenueCat...');
				await initializeRevenueCat();
				console.log('[_layout] RevenueCat initialized');
			} catch (error) {
				console.error('[_layout] Error initializing RevenueCat:', error);
			}
		}
		initRC();
	}, []);

	// Identify user with RevenueCat when authenticated
	useEffect(() => {
		async function identifyUser() {
			if (user?.id) {
				try {
					console.log('[_layout] Identifying user with RevenueCat:', user.id);
					await identifyRevenueCatUser(user.id);
				} catch (error) {
					console.error('[_layout] Error identifying RevenueCat user:', error);
				}
			} else if (!loading && !user) {
				// User logged out, reset to anonymous
				try {
					console.log('[_layout] Resetting RevenueCat user to anonymous');
					await resetRevenueCatUser();
				} catch (error) {
					console.error('[_layout] Error resetting RevenueCat user:', error);
				}
			}
		}
		identifyUser();
	}, [user, loading]);

	// Handle deep links using Linking API (prevents race conditions)
	useEffect(() => {
		console.log('[_layout] Setting up deep link listeners');

		// Handle cold start - app opened via deep link
		Linking.getInitialURL()
			.then((url) => {
				if (url) {
					console.log('[_layout] Cold start deep link:', url);
					pendingDeeplinkRef.current = url;
				}
			})
			.catch((err) => {
				console.error('[_layout] Error getting initial URL:', err);
			});

		// Handle warm start - app already running, new deep link received
		const subscription = Linking.addEventListener('url', ({ url }) => {
			console.log('[_layout] Warm start deep link:', url);
			pendingDeeplinkRef.current = url;
			deeplinkProcessedRef.current = false; // Reset flag for new link
		});

		return () => {
			console.log('[_layout] Cleaning up deep link listeners');
			subscription.remove();
		};
	}, []);

	// Process pending deep link after auth is ready
	useEffect(() => {
		if (!pendingDeeplinkRef.current || deeplinkProcessedRef.current || loading) {
			return;
		}

		const url = pendingDeeplinkRef.current;
		console.log('[_layout] Processing pending deep link:', url);

		// Mark as processed immediately to prevent re-processing
		deeplinkProcessedRef.current = true;

		// Extract path from URL (maerchenzauber://share/character/abc -> /share/character/abc)
		try {
			const urlObj = new URL(url);
			const path = urlObj.pathname || '/';

			console.log('[_layout] Extracted path from deep link:', path);

			// Navigate to the deep link path
			// Longer timeout on iOS to prevent navigation race conditions and image loading crashes
			setTimeout(
				() => {
					console.log('[_layout] Navigating to deep link path:', path);
					router.push(path); // Use push to avoid snapshot issues
					pendingDeeplinkRef.current = null; // Clear after processing
				},
				Platform.OS === 'ios' ? 4000 : 600
			); // Increased timeout for iOS to prevent image deallocation crashes
		} catch (error) {
			console.error('[_layout] Error parsing deep link URL:', error);
			pendingDeeplinkRef.current = null;
		}
	}, [loading, router]);

	// Load Grandstander font
	const [fontsLoaded, fontError] = useFonts({
		Grandstander_400Regular,
		Grandstander_700Bold,
	});

	// Debug font loading
	useEffect(() => {
		console.log('[Font Loading] Status:', {
			fontsLoaded,
			fontError,
			platform: Platform.OS,
		});
	}, [fontsLoaded, fontError]);

	// Handle automatic navigation based on authentication state
	useEffect(() => {
		// Wait for navigation to be ready AND auth to be loaded
		if (!navigationState?.key || loading) {
			console.log('Waiting for navigation/auth to be ready:', {
				hasNavigationKey: !!navigationState?.key,
				isLoading: loading,
			});
			return;
		}

		const currentPath = `/${segments.join('/')}`;
		const isInAuth = segments[0] === 'login';
		const isDeepLink = segments[0] === 'share'; // Check if we're on a deep link route

		// IMPORTANT: Don't auto-redirect if user is on a deep link route
		// Let the deep link handler manage auth checks
		if (isDeepLink) {
			console.log('[_layout] Skipping auth redirect - user on deep link route');
			return;
		}

		// Determine where we should navigate
		let targetRoute: string | null = null;
		if (!isAuthenticated && !isInAuth) {
			targetRoute = '/login';
		} else if (isAuthenticated && isInAuth) {
			targetRoute = '/';
		}

		// Skip if no navigation needed
		if (!targetRoute) {
			return;
		}

		const now = Date.now();
		const timeSinceLastNav = now - lastNavigationTimeRef.current;
		const isSameTarget = targetRoute === lastNavigationTargetRef.current;

		console.log('Navigation state check:', {
			hasToken,
			isAuthenticated,
			currentRoute: currentPath,
			segments,
			isInAuth,
			isDeepLink,
			targetRoute,
			timeSinceLastNav: `${timeSinceLastNav}ms`,
			isSameTarget,
		});

		// Skip if we recently navigated to the same target (prevent loops)
		if (isSameTarget && timeSinceLastNav < navigationCooldown) {
			console.log(
				`Navigation to ${targetRoute} blocked (cooldown: ${navigationCooldown - timeSinceLastNav}ms remaining)`
			);
			return;
		}

		// Perform navigation
		console.log(`Navigating from ${currentPath} to ${targetRoute}`);
		lastNavigationTimeRef.current = now;
		lastNavigationTargetRef.current = targetRoute;
		router.replace(targetRoute);
	}, [loading, segments, hasToken, isAuthenticated, navigationState?.key]);

	// Track session start
	useEffect(() => {
		if (user) {
			const window = Dimensions.get('window');
			posthog?.capture('session_started', {
				device_type: Platform.OS,
				screen_size: {
					width: window.width,
					height: window.height,
				},
				user_id: user.id,
				is_new_user: user.created_at
					? new Date(user.created_at).getTime() === new Date(user.last_sign_in_at || '').getTime()
					: false,
			});
		}

		// Track session end
		return () => {
			if (user) {
				const sessionDuration = (new Date().getTime() - sessionStartTime.getTime()) / 1000; // in seconds
				posthog?.capture('session_ended', {
					session_duration: sessionDuration,
					user_id: user.id,
				});
			}
		};
	}, [user]);

	useEffect(() => {
		async function loadFonts() {
			try {
				// Icon fonts are auto-loaded by @expo/vector-icons, no need to load manually
				setCustomFontsLoaded(true);
			} catch (e) {
				console.error('Error loading fonts:', e);
				// Set loaded anyway to not block the app
				setCustomFontsLoaded(true);
			}
		}
		loadFonts();
	}, []);

	// Hide splash screen once fonts are loaded and auth is checked
	useEffect(() => {
		if (!loading && customFontsLoaded && fontsLoaded) {
			// Small delay to ensure skeleton loaders are ready
			setTimeout(() => {
				SplashScreen.hideAsync().catch(console.warn);
			}, 100);
		}
	}, [loading, customFontsLoaded, fontsLoaded]);

	// Skip loading indicator and directly show skeleton loaders
	if (loading || !customFontsLoaded || !fontsLoaded) {
		return null;
	}

	// Use Stack instead of Slot for the root navigator to enable swipe back gesture
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				gestureEnabled: true,
				gestureDirection: 'horizontal',
				animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right', // Use native iOS animation to prevent snapshot crashes
				animationDuration: 200,
				contentStyle: {
					backgroundColor: '#121212',
				},
				// Disable freezing which can cause snapshot issues with BlurView and LinearGradient
				freezeOnBlur: false,
			}}
		>
			<Stack.Screen
				name="login"
				options={{
					animation: 'fade',
					animationDuration: 300,
					freezeOnBlur: false,
				}}
			/>
		</Stack>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});

export default function RootLayout() {
	return (
		<PostHogWebProvider>
			<GestureHandlerRootView style={styles.container}>
				<View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
					<AuthProvider>
						<ThemeProvider>
							<DebugProvider>
								<RootLayoutNav />
								<GlobalInsufficientCreditsHandler />
							</DebugProvider>
						</ThemeProvider>
					</AuthProvider>
				</View>
				<Toast config={toastConfig} />
			</GestureHandlerRootView>
		</PostHogWebProvider>
	);
}
