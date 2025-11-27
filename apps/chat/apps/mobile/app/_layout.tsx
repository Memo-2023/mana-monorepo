import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';
import { ThemeProvider } from '../theme/ThemeProvider';
import { AuthProvider, useAuth } from '../context/AuthProvider';
import { useEffect } from 'react';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(drawer)',
};

function Layout() {
	const { theme } = useAppTheme();

	return (
		<NavigationThemeProvider value={theme}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<Stack>
					<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
					<Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
					<Stack.Screen name="index" options={{ headerShown: false }} />
					<Stack.Screen name="model-selection" options={{ headerShown: false }} />
					<Stack.Screen name="templates" options={{ headerShown: false }} />
					<Stack.Screen name="conversation/[id]" options={{ headerShown: false }} />
					<Stack.Screen name="auth/login" options={{ headerShown: false }} />
					<Stack.Screen name="auth/register" options={{ headerShown: false }} />
					<Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
					<Stack.Screen name="profile" options={{ headerShown: false }} />
				</Stack>
			</GestureHandlerRootView>
		</NavigationThemeProvider>
	);
}

// Authentifizierungsprüfung und Umleitung
function AuthGuard({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === 'auth';

		if (!user && !inAuthGroup) {
			// Wenn kein Benutzer angemeldet ist und nicht auf einer Auth-Seite, zur Login-Seite umleiten
			router.replace('/auth/login');
		} else if (user && inAuthGroup) {
			// Wenn ein Benutzer angemeldet ist und auf einer Auth-Seite, zur Hauptseite umleiten
			router.replace('/');
		}
	}, [user, loading, segments]);

	return <>{children}</>;
}

export default function RootLayout() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<AuthGuard>
					<Layout />
				</AuthGuard>
			</AuthProvider>
		</ThemeProvider>
	);
}
