import { Stack } from 'expo-router';
import { useTheme } from '../../utils/ThemeContext';

export default function AuthLayout() {
	const { theme } = useTheme();

	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: theme.colors.background,
				},
				headerTintColor: theme.colors.text,
				headerTitleStyle: {
					fontWeight: 'bold',
				},
				headerShown: false,
			}}
		/>
	);
}
