import '../global.css';

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '~/utils/themeContext';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(drawer)',
};

// Auth Provider Komponente für die Authentifizierungsprüfung
function AuthProvider({ children }: { children: React.ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		// Prüfe den aktuellen Authentifizierungsstatus
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setIsLoading(false);
		});

		// Abonniere Authentifizierungsänderungen
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setIsLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	useEffect(() => {
		if (isLoading) return;

		// Prüfe, ob der Benutzer auf der Anmeldeseite oder Passwort-Reset-Seite ist
		const isLoginScreen = segments[0] === 'login';
		const isAuthScreen = segments[0] === 'auth'; // For reset-password and other auth routes
		const isPublicScreen = isLoginScreen || isAuthScreen;

		if (!session && !isPublicScreen) {
			// Wenn der Benutzer nicht angemeldet ist und nicht auf einer öffentlichen Seite ist,
			// leite ihn zur Anmeldeseite um
			router.replace('/login');
		} else if (session && isLoginScreen) {
			// Wenn der Benutzer angemeldet ist und auf der Anmeldeseite ist,
			// leite ihn zur Hauptseite um
			router.replace('/');
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [session, segments, isLoading]);

	// Zeige nichts während des Ladens
	if (isLoading) return null;

	return <>{children}</>;
}

export default function RootLayout() {
	return (
		<ThemeProvider>
			<AuthProvider>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<Stack>
						<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
						<Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
						<Stack.Screen name="login" options={{ headerShown: true }} />
						<Stack.Screen name="auth" options={{ headerShown: false }} />
					</Stack>
				</GestureHandlerRootView>
			</AuthProvider>
		</ThemeProvider>
	);
}
