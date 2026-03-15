import { Stack } from 'expo-router';

import { useTheme } from '~/utils/themeContext';

export default function PlacesLayout() {
	const { isDarkMode } = useTheme();

	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
				},
				headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
				headerTitleStyle: {
					color: isDarkMode ? '#FFFFFF' : '#000000',
				},
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					title: 'Orte',
				}}
			/>
		</Stack>
	);
}
