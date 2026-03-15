import { FontAwesome } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '../utils/themeContext';

type ThemeToggleProps = {
	style?: any;
};

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ style }) => {
	const { isDarkMode, toggleTheme, colors } = useTheme();

	return (
		<Pressable
			onPress={toggleTheme}
			style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, ...style })}
		>
			<View className="flex-row items-center">
				<FontAwesome
					name={isDarkMode ? 'moon-o' : 'sun-o'}
					size={24}
					color={isDarkMode ? '#FFFFFF' : colors.primary}
				/>
				<Text className={`ml-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>
					{isDarkMode ? 'Dark Mode' : 'Light Mode'}
				</Text>
			</View>
		</Pressable>
	);
};
