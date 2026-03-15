import FontAwesome from '@expo/vector-icons/FontAwesome';
import { forwardRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../utils/themeContext';

export const HeaderButton = forwardRef<typeof Pressable, { onPress?: () => void }>(
	({ onPress }, ref) => {
		const { isDarkMode, colors } = useTheme();

		return (
			<Pressable onPress={onPress}>
				{({ pressed }) => (
					<FontAwesome
						name="info-circle"
						size={24}
						color={isDarkMode ? '#FFFFFF' : colors.primary}
						style={[
							styles.headerRight,
							{
								opacity: pressed ? 0.5 : 1,
							},
						]}
					/>
				)}
			</Pressable>
		);
	}
);

export const styles = StyleSheet.create({
	headerRight: {
		marginRight: 30, // Further increased margin for better spacing
	},
});
