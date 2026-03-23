import '../global.css';
import { useEffect } from 'react';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthProvider';
import { ThemeProvider } from '../components/theme';
import { DebugProvider } from '../context/DebugContext';
import { I18nProvider } from '../context/I18nContext';
import { initializeRevenueCat } from '../services/revenueCatService';
import '../utils/i18n'; // Initialize i18n

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Komponente zur Überprüfung der Authentifizierung und Weiterleitung
function RootLayoutNav() {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	const [fontsLoaded, fontError] = useFonts({
		// You can add custom fonts here if needed
	});

	useEffect(() => {
		if (fontsLoaded || fontError) {
			// Hide the splash screen after the fonts have loaded (or an error was reported)
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, fontError]);

	// Prevent rendering until the fonts have loaded or an error was encountered
	if (!fontsLoaded && !fontError) {
		return null;
	}

	// Authentifizierungslogik
	useEffect(() => {
		if (loading) return;

		const isAuthRoute = segments[0] === 'login' || segments[0] === 'register';

		if (!user && !isAuthRoute) {
			// Wenn der Benutzer nicht angemeldet ist und nicht auf einer Auth-Seite ist, leite zur Login-Seite weiter
			router.replace('/login');
		} else if (user && isAuthRoute) {
			// Wenn der Benutzer angemeldet ist und auf einer Auth-Seite ist, leite zur Startseite weiter
			router.replace('/');
		}

		// Initialisiere RevenueCat, wenn der Benutzer angemeldet ist
		if (user) {
			initializeRevenueCat(user.userId);
		}
	}, [user, loading, segments, router]);

	return <Slot />;
}

// Root-Layout mit AuthProvider, ThemeProvider, I18nProvider und DebugProvider
export default function RootLayout() {
	return (
		<I18nProvider>
			<AuthProvider>
				<ThemeProvider>
					<DebugProvider>
						<RootLayoutNav />
					</DebugProvider>
				</ThemeProvider>
			</AuthProvider>
		</I18nProvider>
	);
}
