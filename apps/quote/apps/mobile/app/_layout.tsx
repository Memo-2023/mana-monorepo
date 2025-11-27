import '../global.css';
import '../i18n/config';

import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import { ErrorBoundary } from '~/components/ErrorBoundary';
import RevenueCat from '~/services/RevenueCat';
import usePremiumStore from '~/store/premiumStore';
import { useOnboardingStore } from '~/store/onboardingStore';
import { useQuotesStore } from '~/store/quotesStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DataBackupService } from '~/services/dataBackup';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(tabs)',
};

export default function RootLayout() {
	const [isStoreReady, setIsStoreReady] = useState(false);
	const { checkPremiumStatus, checkAndResetLimits } = usePremiumStore();
	const { shouldShowOnboarding } = useOnboardingStore();
	const { initializeStore } = useQuotesStore();

	// Wait for stores to be ready
	useEffect(() => {
		const initStores = async () => {
			try {
				// WICHTIG: Warte auf Zustand Rehydration, bevor wir initialisieren
				// Dies verhindert Race Conditions auf echten Geräten
				console.log('[App] Waiting for store hydration...');

				// Poll für hasHydrated flag (max 5 Sekunden)
				let attempts = 0;
				const maxAttempts = 50; // 50 * 100ms = 5 Sekunden

				while (!useQuotesStore.getState().hasHydrated && attempts < maxAttempts) {
					await new Promise((resolve) => setTimeout(resolve, 100));
					attempts++;
				}

				if (attempts >= maxAttempts) {
					console.warn('[App] Hydration timeout, proceeding anyway');
				} else {
					console.log('[App] Store hydrated successfully');
				}

				// WICHTIG: Backup-Check NACH Rehydration, damit persistierte Daten verfügbar sind
				console.log('[App] Checking for data backup...');
				await DataBackupService.checkAndRestoreIfNeeded();

				// Initialize quotes store
				console.log('[App] Initializing quotes store...');
				await initializeStore();
				console.log('[App] Quotes store initialized');

				// Give AsyncStorage time to fully settle
				await new Promise((resolve) => setTimeout(resolve, 50));
				setIsStoreReady(true);
			} catch (error) {
				console.error('Error initializing stores:', error);
				// Retry initialization after a delay instead of proceeding with uninitialized state
				setTimeout(() => {
					console.log('[App] Retrying initialization...');
					initStores();
				}, 1000);
			}
		};

		initStores();
	}, []);

	useEffect(() => {
		if (!isStoreReady) return;

		// Initialize RevenueCat
		const initRevenueCat = async () => {
			try {
				console.log('[App] Configuring RevenueCat...');
				await RevenueCat.configure();
				console.log('[App] RevenueCat configured successfully');
				await checkPremiumStatus();
			} catch (error) {
				console.error('[App] Error initializing RevenueCat:', error);
			}
		};

		initRevenueCat();
		checkAndResetLimits();

		// Check onboarding after a small delay to ensure navigation is ready
		const timer = setTimeout(() => {
			if (shouldShowOnboarding()) {
				router.replace('/onboarding');
			}
		}, 100);

		return () => clearTimeout(timer);
	}, [isStoreReady, checkPremiumStatus, checkAndResetLimits, shouldShowOnboarding]);

	useEffect(() => {
		// Handle deep links from widgets
		const handleDeepLink = (url: string) => {
			try {
				// Parse the URL - expecting format: zitare://widget/{quoteId}
				if (url.includes('zitare://widget/')) {
					const quoteHash = url.split('zitare://widget/')[1];

					if (quoteHash) {
						// Navigate to main tab with quote parameter
						router.replace({
							pathname: '/(tabs)/quotes',
							params: { widgetQuoteId: quoteHash },
						});
					}
				}
			} catch (error) {
				console.error('Error handling deep link:', error);
				// Fallback: just open the app normally
				router.replace('/');
			}
		};

		// Listen for incoming links
		const subscription = Linking.addEventListener('url', ({ url }) => {
			handleDeepLink(url);
		});

		// Check if app was opened from a link
		Linking.getInitialURL().then((url) => {
			if (url) {
				handleDeepLink(url);
			}
		});

		return () => subscription.remove();
	}, []);

	// Show loading screen while stores are initializing
	if (!isStoreReady) {
		return (
			<GestureHandlerRootView style={{ flex: 1 }}>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: '#000',
					}}
				>
					<ActivityIndicator size="large" color="#fff" />
				</View>
			</GestureHandlerRootView>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ErrorBoundary
				onError={(error, errorInfo) => {
					// Hier könnte man Error-Logging an einen Service senden
					console.error('App Error:', error, errorInfo);
				}}
			>
				<Stack>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen name="onboarding" options={{ headerShown: false }} />
					<Stack.Screen name="author/[id]" options={{ headerShown: false }} />
					<Stack.Screen name="settings" options={{ headerShown: false }} />
					<Stack.Screen name="list/[id]" options={{ headerShown: false }} />
					<Stack.Screen
						name="paywall"
						options={{
							headerShown: false,
							presentation: 'modal',
							animation: 'slide_from_bottom',
						}}
					/>
				</Stack>
			</ErrorBoundary>
		</GestureHandlerRootView>
	);
}
