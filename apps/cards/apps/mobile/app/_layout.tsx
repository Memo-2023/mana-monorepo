import '../global.css';

import { Stack, Redirect } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '~/store/authStore';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ErrorBoundary } from '~/components/ErrorBoundary';
import { ThemeProvider } from '~/components/ThemeProvider';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import 'react-native-reanimated';

// Configure Reanimated logger to reduce noise (if available)
try {
	const Reanimated = require('react-native-reanimated');
	if (Reanimated.configureReanimatedLogger) {
		Reanimated.configureReanimatedLogger({
			level: Reanimated.ReanimatedLogLevel?.warn,
			strict: false,
		});
	}
} catch (e) {
	console.warn('Reanimated logger configuration not available');
}

// Ignore known warnings from third-party libraries
LogBox.ignoreLogs(['SafeAreaView has been deprecated', 'A UIRefreshControl received offscreen']);

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(tabs)',
};

export default function RootLayout() {
	const { initialize, isInitialized, isLoading, user } = useAuthStore();

	useEffect(() => {
		initialize();
	}, []);

	if (!isInitialized || isLoading) {
		return (
			<SafeAreaProvider initialMetrics={initialWindowMetrics}>
				<ThemeProvider>
					<ThemeWrapper>
						<View className="flex-1 items-center justify-center bg-surface">
							<ActivityIndicator size="large" color="#3B82F6" />
						</View>
					</ThemeWrapper>
				</ThemeProvider>
			</SafeAreaProvider>
		);
	}

	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics}>
			<ThemeProvider>
				<ThemeWrapper>
					<ErrorBoundary>
						{!user ? (
							<Stack screenOptions={{ headerShown: false }}>
								<Stack.Screen name="(auth)" />
							</Stack>
						) : (
							<Stack screenOptions={{ headerShown: false }}>
								<Stack.Screen name="(tabs)" />
								<Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
							</Stack>
						)}
					</ErrorBoundary>
				</ThemeWrapper>
			</ThemeProvider>
		</SafeAreaProvider>
	);
}
