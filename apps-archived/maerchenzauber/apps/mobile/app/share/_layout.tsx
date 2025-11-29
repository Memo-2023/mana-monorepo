import { Stack } from 'expo-router';
import { Platform } from 'react-native';

/**
 * Layout for share deeplink routes
 *
 * IMPORTANT: Disables screen optimization to prevent snapshot crashes
 * during deeplink navigation on iOS
 */
export default function ShareLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: Platform.OS === 'ios' ? 'none' : 'default',
				// Disable all screen optimization features that could cause crashes
				freezeOnBlur: false,
				// Disable native stack on iOS to prevent snapshot creation
				presentation: 'transparentModal',
			}}
		/>
	);
}
