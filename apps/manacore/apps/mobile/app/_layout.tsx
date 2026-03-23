import '../global.css';

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '~/utils/themeContext';
import { AuthProvider, useAuth } from '~/context/AuthProvider';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(drawer)',
};

// Navigation guard that redirects based on auth state
function NavigationGuard({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		// Prüfe, ob der Benutzer auf der Anmeldeseite oder Passwort-Reset-Seite ist
		const isLoginScreen = segments[0] === 'login';
		const isAuthScreen = segments[0] === 'auth'; // For reset-password and other auth routes
		const isPublicScreen = isLoginScreen || isAuthScreen;

		if (!user && !isPublicScreen) {
			// Wenn der Benutzer nicht angemeldet ist und nicht auf einer öffentlichen Seite ist,
			// leite ihn zur Anmeldeseite um
			router.replace('/login');
		} else if (user && isLoginScreen) {
			// Wenn der Benutzer angemeldet ist und auf der Anmeldeseite ist,
			// leite ihn zur Hauptseite um
			router.replace('/');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user, segments, loading]);

	// Zeige nichts während des Ladens
	if (loading) return null;

	return <>{children}</>;
}

export default function RootLayout() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<NavigationGuard>
					<GestureHandlerRootView style={{ flex: 1 }}>
						<Stack>
							<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
							<Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
							<Stack.Screen name="login" options={{ headerShown: true }} />
							<Stack.Screen name="auth" options={{ headerShown: false }} />
						</Stack>
					</GestureHandlerRootView>
				</NavigationGuard>
			</AuthProvider>
		</ThemeProvider>
	);
}
