import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useAppTheme, ThemeProvider } from '../theme/ThemeProvider';
import { AuthProvider, useAuth } from '../context/AuthProvider';
import { useEffect } from 'react';

export const unstable_settings = {
	initialRouteName: '(drawer)',
};

function Layout() {
	const { theme } = useAppTheme();

	return (
		<NavigationThemeProvider value={theme}>
			<GestureHandlerRootView style={{ flex: 1 }}>
				<Stack>
					<Stack.Screen name="(drawer)" options={{ headerShown: false }} />
					<Stack.Screen name="auth/login" options={{ headerShown: false }} />
					<Stack.Screen name="auth/register" options={{ headerShown: false }} />
					<Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
					<Stack.Screen name="email/[id]" options={{ headerShown: false }} />
					<Stack.Screen
						name="compose"
						options={{
							headerShown: false,
							presentation: 'modal',
							animation: 'slide_from_bottom',
						}}
					/>
					<Stack.Screen name="settings" options={{ headerShown: false }} />
					<Stack.Screen name="accounts" options={{ headerShown: false }} />
				</Stack>
			</GestureHandlerRootView>
		</NavigationThemeProvider>
	);
}

// Auth guard component
function AuthGuard({ children }: { children: React.ReactNode }) {
	const { user, loading } = useAuth();
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		if (loading) return;

		const inAuthGroup = segments[0] === 'auth';

		if (!user && !inAuthGroup) {
			router.replace('/auth/login');
		} else if (user && inAuthGroup) {
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
