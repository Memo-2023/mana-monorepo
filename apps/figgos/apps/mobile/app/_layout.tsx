import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '~/contexts/AuthContext';
import { useEffect } from 'react';

function AuthGuard({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === '(auth)';

		if (!user && !inAuthGroup) {
			router.replace('/(auth)/login');
		} else if (user && inAuthGroup) {
			router.replace('/(tabs)');
		}
	}, [user, loading, segments]);

	return <>{children}</>;
}

function Layout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="(auth)" options={{ headerShown: false }} />
			</Stack>
		</GestureHandlerRootView>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<AuthGuard>
				<Layout />
			</AuthGuard>
		</AuthProvider>
	);
}
