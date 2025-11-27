import '../global.css';

import { Stack } from 'expo-router';
import { useDatabase } from '../hooks/useDatabase';
import { useTheme } from '../hooks/useTheme';
import { View, Text, ActivityIndicator, AppState } from 'react-native';
import { useEffect } from 'react';
import { PhotoService } from '../services/storage/PhotoService';

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: 'index',
};

export default function RootLayout() {
	const { isReady, error } = useDatabase();

	// Initialize theme on app start
	useTheme();

	// Clean up temporary photos when app comes to foreground
	useEffect(() => {
		const handleAppStateChange = async (nextAppState: string) => {
			if (nextAppState === 'active') {
				try {
					const photoService = PhotoService.getInstance();
					await photoService.cleanupTempPhotos();
					console.log('Temporary photos cleaned up on app foreground');
				} catch (error) {
					console.warn('Failed to cleanup temp photos on foreground:', error);
				}
			}
		};

		const subscription = AppState.addEventListener('change', handleAppStateChange);
		return () => subscription?.remove();
	}, []);

	if (!isReady) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				{error ? (
					<View className="items-center space-y-4">
						<Text className="text-lg font-semibold text-red-500">Database Error</Text>
						<Text className="px-4 text-center text-gray-600">{error}</Text>
					</View>
				) : (
					<View className="items-center space-y-4">
						<ActivityIndicator size="large" color="#6366f1" />
						<Text className="text-gray-600">Initializing Nutriphi...</Text>
					</View>
				)}
			</View>
		);
	}

	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen name="modal" options={{ presentation: 'modal' }} />
		</Stack>
	);
}
