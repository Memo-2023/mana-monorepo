import '../global.css';
import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useMatrixStore } from '~/src/matrix/store';
import {
	requestNotificationPermissions,
	setupNotificationNavigation,
} from '~/src/notifications';

function AuthGuard({ children }: { children: React.ReactNode }) {
	const [checking, setChecking] = useState(true);
	const segments = useSegments();
	const router = useRouter();
	const { isReady, restoreSession } = useMatrixStore();

	useEffect(() => {
		restoreSession().finally(() => setChecking(false));
	}, []);

	useEffect(() => {
		if (checking) return;
		const inAuthGroup = segments[0] === '(auth)';
		if (!isReady && !inAuthGroup) router.replace('/(auth)/login');
		else if (isReady && inAuthGroup) router.replace('/(app)');
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isReady, checking, segments]);

	if (checking) return null;
	return <>{children}</>;
}

export default function RootLayout() {
	useEffect(() => {
		// Request notification permissions (non-blocking)
		requestNotificationPermissions().catch(() => {});
		// Set up navigation from notification taps
		const cleanup = setupNotificationNavigation();
		return cleanup;
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<StatusBar style="light" />
			<AuthGuard>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="(auth)" />
					<Stack.Screen name="(app)" />
					<Stack.Screen
						name="room/[id]"
						options={{ headerShown: false, animation: 'slide_from_right' }}
					/>
					<Stack.Screen
						name="room/new"
						options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }}
					/>
					<Stack.Screen
						name="room/settings"
						options={{ headerShown: false, animation: 'slide_from_right' }}
					/>
					<Stack.Screen
						name="search"
						options={{ headerShown: false, animation: 'slide_from_bottom', presentation: 'modal' }}
					/>
					<Stack.Screen name="+not-found" />
				</Stack>
			</AuthGuard>
		</GestureHandlerRootView>
	);
}
