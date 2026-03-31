import '../global.css';

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '~/features/auth';
import { ThemeProvider, useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import ErrorBoundary from '~/components/ErrorBoundary';
import { SpaceProvider } from '~/features/spaces';
import { CreditProvider } from '~/features/credits/CreditContext';
import LoadingScreen from '~/components/LoadingScreen';
import { LanguageProvider } from '~/features/i18n/LanguageContext';
import { LocationProvider } from '~/features/location/LocationContext';
import { RecordingLanguageProvider } from '~/features/audioRecordingV2';
import { ToastProvider } from '~/features/toast';
import { AnalyticsNavigationTracker } from '~/features/analytics/components/AnalyticsNavigationTracker';
import { initializeI18n } from '~/features/i18n';
// RevenueCat initialization is now handled conditionally in the auth context based on B2B status
import { MemoRealtimeProvider } from '~/features/memos/contexts/MemoRealtimeContext';
import ThemedStatusBar from '~/components/atoms/ThemedStatusBar';
import { NetworkStatusProvider } from '~/features/network/NetworkStatusProvider';
import PasswordResetRequiredModal from '~/features/auth/components/PasswordResetRequiredModal';
import { useShareIntentHandler } from '~/features/shareIntent';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
	/* reloading the app might trigger some race conditions, ignore them */
});

export const unstable_settings = {
	// Ensure any reloading maintains proper routing
	initialRouteName: '(public)',
};

// Komponente für die Routing-Logik
function RootLayoutNav() {
	const {
		isAuthenticated,
		loading,
		showPasswordResetModal,
		setShowPasswordResetModal,
		setAuthModeOverride,
	} = useAuth();
	const segments = useSegments();
	const router = useRouter();
	const [appIsReady, setAppIsReady] = useState(false);

	// Consume share intents from other apps at root level
	// resetOnBackground: false — we buffer in Zustand and reset manually after consuming
	useShareIntentHandler({ resetOnBackground: false });

	// Prepare app resources and hide splash screen when ready
	useEffect(() => {
		async function prepare() {
			console.debug('App initialization started');
			try {
				// Add any resource loading here if needed
				// For example: load fonts, pre-fetch data, etc.

				// Initialize i18n - critical, but don't block on errors
				try {
					console.debug('Initializing i18n...');
					await initializeI18n();
					console.debug('i18n initialized successfully');
				} catch (i18nError) {
					console.debug('i18n initialization failed, continuing with fallback:', i18nError);
				}

				// Note: RevenueCat initialization is now handled after authentication
				// in the auth context to check B2B settings first
			} catch (e) {
				console.debug('Error loading resources:', e);
			} finally {
				// Mark app as ready regardless of initialization errors
				console.debug('App initialization completed, setting appIsReady = true');
				setAppIsReady(true);
			}
		}

		prepare();
	}, []);

	// Hide splash screen once auth is loaded and app is ready
	useEffect(() => {
		if (!loading && appIsReady) {
			// Hide the splash screen after a short delay to ensure smooth transition
			const timer = setTimeout(() => {
				SplashScreen.hideAsync().catch(() => {
					// Ignore errors hiding the splash screen
				});
			}, 300);

			return () => clearTimeout(timer);
		}
	}, [loading, appIsReady]);

	// Failsafe: Force hide splash screen after maximum wait time
	useEffect(() => {
		const failsafeTimer = setTimeout(() => {
			console.debug('Failsafe: Force hiding splash screen after 10 seconds');
			SplashScreen.hideAsync().catch(() => {
				// Ignore errors hiding the splash screen
			});
			// Force set app as ready if it's still not ready
			if (!appIsReady) {
				setAppIsReady(true);
			}
		}, 10000); // 10 seconds failsafe

		return () => clearTimeout(failsafeTimer);
	}, [appIsReady]);

	// Force navigation when auth state changes
	useEffect(() => {
		console.debug(
			'RootLayoutNav: Auth state changed - isAuthenticated:',
			isAuthenticated,
			'loading:',
			loading
		);
		if (!loading) {
			if (isAuthenticated) {
				// Navigate to protected routes
				if (segments[0] !== '(protected)') {
					console.debug('RootLayoutNav: Navigating to protected routes');
					router.replace('/(protected)/(tabs)/');
				}
			} else {
				// Navigate to public routes
				if (segments[0] !== '(public)') {
					console.debug('RootLayoutNav: Navigating to public routes');
					router.replace('/(public)/login');
				}
			}
		}
	}, [isAuthenticated, loading, segments, router]);

	// Zeige Ladebildschirm während des Ladens des Auth-Status
	if (loading) {
		return <LoadingScreen message="Authentifiziere..." />;
	}

	console.debug('RootLayoutNav render - isAuthenticated:', isAuthenticated, 'loading:', loading);

	// Conditional navigation based on authentication status
	return (
		<>
			<ThemedStatusBar />
			<AnalyticsNavigationTracker />
			{isAuthenticated ? (
				<ErrorBoundary
					onError={(error) => {
						console.error('[RootLayout] Protected route crash:', error.message);
					}}
				>
					<MemoRealtimeProvider>
						<Stack
							screenOptions={{
								headerShown: false,
								animation: 'none',
								animationDuration: 0,
								contentStyle: { backgroundColor: 'transparent' },
							}}
						>
							<Stack.Screen name="(protected)" />
						</Stack>
					</MemoRealtimeProvider>
				</ErrorBoundary>
			) : (
				<Stack
					screenOptions={{
						headerShown: false,
						animation: 'none',
						animationDuration: 0,
					}}
				>
					<Stack.Screen name="(public)" />
				</Stack>
			)}

			{/* Password Reset Required Modal - rendered at root level to persist across navigation */}
			<PasswordResetRequiredModal
				visible={showPasswordResetModal}
				onClose={() => {
					console.log('Modal onClose called from RootLayout');
					setShowPasswordResetModal(false);
				}}
				onResetPassword={() => {
					console.log('Modal onResetPassword called from RootLayout');
					setShowPasswordResetModal(false);
					setAuthModeOverride('forgot-password');
					// Navigate to login page if not already there
					if (segments[0] !== '(public)' || segments[1] !== 'login') {
						router.replace('/(public)/login');
					}
				}}
			/>
		</>
	);
}

// Wrapper that applies the theme background color at the root level
// Must be inside ThemeProvider to access theme context
function ThemedBackground({ children }: { children: React.ReactNode }) {
	const { isDark, themeVariant } = useTheme();
	const backgroundColor = isDark
		? (colors.theme?.extend?.colors?.dark as any)?.[themeVariant]?.pageBackground || '#101010'
		: (colors.theme?.extend?.colors as any)?.[themeVariant]?.pageBackground || '#dddddd';

	return <View style={[styles.container, { backgroundColor }]}>{children}</View>;
}

function RootLayout() {
	return (
		<GestureHandlerRootView style={styles.container}>
			<SafeAreaProvider>
				<ThemeProvider>
					<ThemedBackground>
						<ActionSheetProvider>
							<NetworkStatusProvider>
								<AuthProvider>
									<CreditProvider>
										<SpaceProvider>
											<LanguageProvider>
												<LocationProvider>
													<RecordingLanguageProvider>
														<ToastProvider>
															<RootLayoutNav />
														</ToastProvider>
													</RecordingLanguageProvider>
												</LocationProvider>
											</LanguageProvider>
										</SpaceProvider>
									</CreditProvider>
								</AuthProvider>
							</NetworkStatusProvider>
						</ActionSheetProvider>
					</ThemedBackground>
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}

export default RootLayout;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
