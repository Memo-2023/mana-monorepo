import '../global.css';

import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack
				screenOptions={{
					headerShown: false,
					contentStyle: { backgroundColor: 'rgb(15, 15, 30)' },
				}}
			>
				<Stack.Screen name="(tabs)" />
				<Stack.Screen name="card/[id]" />
				<Stack.Screen name="card/v2/[id]" />
			</Stack>
		</GestureHandlerRootView>
	);
}
