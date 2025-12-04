import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider } from '../utils/ThemeContext';
import { AuthProvider, useAuth } from '../utils/AuthContext';
import { useEffect } from 'react';
import ErrorBoundary, { setupGlobalErrorHandler } from '../utils/ErrorHandler';

// Globalen Fehlerhandler einrichten
setupGlobalErrorHandler();

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(tabs)',
};

// Authentifizierungsprüfung
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (loading) return; // Warte, bis der Auth-Status geladen ist

		const inAuthGroup = segments[0] === '(auth)';

		// Wenn der Benutzer nicht angemeldet ist und nicht im Auth-Bereich
		if (!user && !inAuthGroup) {
			router.replace('/login');
		}
		// Wenn der Benutzer angemeldet ist und im Auth-Bereich
		else if (user && inAuthGroup) {
			router.replace('/(tabs)');
		}
	}, [user, loading, segments]);

	if (loading) {
		// Hier könnte ein Ladeindikator angezeigt werden
		return null;
	}

	return <>{children}</>;
}

export default function RootLayout() {
	return (
		<ErrorBoundary>
			<ThemeProvider>
				<AuthProvider>
					<AuthenticationGuard>
						<Stack>
							<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
							<Stack.Screen name="(auth)" options={{ headerShown: false }} />
							<Stack.Screen name="modal" options={{ presentation: 'modal' }} />
							<Stack.Screen name="settings" options={{ title: 'Settings' }} />
							<Stack.Screen name="subscription" options={{ title: 'Mana' }} />
						</Stack>
					</AuthenticationGuard>
				</AuthProvider>
			</ThemeProvider>
		</ErrorBoundary>
	);
}
