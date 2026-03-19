import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeWrapper } from '~/components/ThemeWrapper';
import { AudioProvider } from '~/contexts/AudioContext';
import { ThemeProvider } from '~/utils/themeContext';

export const unstable_settings = {
	initialRouteName: '(tabs)',
};

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<ThemeProvider>
					{({ isDarkMode }) => (
						<ThemeWrapper>
							<AudioProvider>
								<Stack
									screenOptions={{
										headerStyle: {
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
										name="player"
										options={{
											presentation: 'modal',
											headerShown: false,
										}}
									/>
									<Stack.Screen
										name="queue"
										options={{
											presentation: 'modal',
											title: 'Warteschlange',
										}}
									/>
									<Stack.Screen
										name="album/[id]"
										options={{ title: 'Album', headerBackTitle: 'Zurück' }}
									/>
									<Stack.Screen
										name="artist/[id]"
										options={{ title: 'Künstler', headerBackTitle: 'Zurück' }}
									/>
									<Stack.Screen
										name="playlist/[id]"
										options={{ title: 'Playlist', headerBackTitle: 'Zurück' }}
									/>
									<Stack.Screen
										name="playlist/new"
										options={{
											presentation: 'modal',
											title: 'Neue Playlist',
										}}
									/>
								</Stack>
							</AudioProvider>
						</ThemeWrapper>
					)}
				</ThemeProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
