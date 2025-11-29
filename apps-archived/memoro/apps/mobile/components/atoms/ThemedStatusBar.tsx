import React, { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

/**
 * ThemedStatusBar component
 *
 * A global StatusBar component that automatically matches the header background color
 * based on the current theme variant and dark mode setting.
 */
const ThemedStatusBar: React.FC = () => {
	const { isDark, themeVariant } = useTheme();

	// Get the header background color from theme config
	const headerBackgroundColor = useMemo(
		() =>
			isDark
				? colors.theme.extend.colors.dark[themeVariant].menuBackground
				: colors.theme.extend.colors[themeVariant].menuBackground,
		[isDark, themeVariant]
	);

	// Determine status bar style based on background color brightness
	const statusBarStyle = useMemo(() => {
		// For dark mode, use light content (white text/icons)
		if (isDark) {
			return 'light';
		}

		// For light mode, use dark content (dark text/icons)
		return 'dark';
	}, [isDark]);

	return (
		<StatusBar
			style={statusBarStyle}
			backgroundColor={Platform.OS === 'android' ? headerBackgroundColor : undefined}
			translucent={Platform.OS === 'android'}
		/>
	);
};

export default ThemedStatusBar;
