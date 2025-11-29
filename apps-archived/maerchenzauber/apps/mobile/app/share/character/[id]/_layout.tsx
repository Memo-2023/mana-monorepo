import { Stack } from 'expo-router';

/**
 * Layout for character sharing deep links
 * Prevents screen snapshot crashes during navigation
 */
export default function ShareCharacterLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: 'none', // Disable animations to prevent crashes
				freezeOnBlur: false, // Important: prevents snapshot creation
			}}
		/>
	);
}
