import { FontAwesome } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { forwardRef } from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '~/utils/themeContext';

export const SettingsButton = forwardRef<typeof Pressable>((props, ref) => {
	const { isDarkMode, colors } = useTheme();

	return (
		<Link href="/settings" asChild>
			<Pressable style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, marginLeft: 30 })}>
				<FontAwesome name="gear" size={24} color={isDarkMode ? '#FFFFFF' : colors.primary} />
			</Pressable>
		</Link>
	);
});
