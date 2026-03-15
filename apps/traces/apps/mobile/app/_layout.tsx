import '../global.css';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeWrapper } from '~/components/ThemeWrapper';
import { registerBackgroundTasks } from '~/utils/registerBackgroundTasks';
import { startAutoSync } from '~/utils/syncService';
import { ThemeProvider } from '~/utils/themeContext';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: '(tabs)',
};

export default function RootLayout() {
	// Registriere Hintergrundaufgaben beim App-Start
	useEffect(() => {
		registerBackgroundTasks().catch((error) =>
			console.error('Fehler beim Initialisieren der Hintergrundaufgaben:', error)
		);

		// Start auto-sync (syncs to backend when logged in)
		startAutoSync();
	}, []);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					{({ isDarkMode }) => (
						<ThemeWrapper>
							<Stack
								screenOptions={{
									headerStyle: {
										// Use transparent background to allow the ThemeWrapper color to show through
										backgroundColor: isDarkMode ? '#1E1E1E' : 'transparent',
									},
									headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
									headerTitleStyle: {
										color: isDarkMode ? '#FFFFFF' : '#000000',
									},
									contentStyle: {
										backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
									},
								}}
							>
								<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
								<Stack.Screen
									name="modal"
									options={{
										presentation: 'modal',
										title: 'Über die App',
									}}
								/>
								<Stack.Screen
									name="settings"
									options={{ title: 'Einstellungen', headerBackTitle: 'Zurück' }}
								/>
								<Stack.Screen
									name="city-detail"
									options={{ title: 'Stadt-Details', headerBackTitle: 'Zurück' }}
								/>
								<Stack.Screen
									name="guide-detail"
									options={{ title: 'Stadtführung', headerBackTitle: 'Zurück' }}
								/>
							</Stack>
						</ThemeWrapper>
					)}
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
