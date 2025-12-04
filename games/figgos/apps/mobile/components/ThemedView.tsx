import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, ViewProps, TextProps } from 'react-native';
import { useTheme } from '~/utils/ThemeContext';

// Debug border colors for different components
const DEBUG_COLORS = {
	primary: '#FF0000', // Red
	secondary: '#00FF00', // Green
	tertiary: '#0000FF', // Blue
	quaternary: '#FF00FF', // Magenta
	default: '#FFFF00', // Yellow
};

// Themed View component
interface ThemedViewProps extends ViewProps {
	style?: ViewStyle | ViewStyle[];
	darkStyle?: ViewStyle;
	lightStyle?: ViewStyle;
	debugBorderType?: keyof typeof DEBUG_COLORS;
}

export const ThemedView: React.FC<ThemedViewProps> = ({
	style,
	darkStyle,
	lightStyle,
	debugBorderType = 'default',
	children,
	...props
}) => {
	const { isDark, theme, debugBorders } = useTheme();

	const themeSpecificStyle = isDark ? darkStyle : lightStyle;

	// Apply debug borders if enabled
	const debugStyle: ViewStyle = debugBorders
		? {
				borderWidth: 1,
				borderColor: DEBUG_COLORS[debugBorderType],
			}
		: {};

	// Bestimme, ob ein expliziter Hintergrund in den Styles gesetzt wurde
	const hasExplicitBackground =
		(style && typeof style === 'object' && !Array.isArray(style) && 'backgroundColor' in style) ||
		(Array.isArray(style) &&
			style.some((s) => s && typeof s === 'object' && 'backgroundColor' in s));

	return (
		<View
			style={[
				// Setze den Theme-Hintergrund nur, wenn kein expliziter Hintergrund definiert wurde
				!hasExplicitBackground ? { backgroundColor: theme.colors.background } : {},
				style,
				themeSpecificStyle,
				debugStyle,
			]}
			{...props}
		>
			{children}
		</View>
	);
};

// Themed Text component
interface ThemedTextProps extends TextProps {
	style?: TextStyle | TextStyle[];
	darkStyle?: TextStyle;
	lightStyle?: TextStyle;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
	style,
	darkStyle,
	lightStyle,
	children,
	...props
}) => {
	const { isDark, theme } = useTheme();

	const themeSpecificStyle = isDark ? darkStyle : lightStyle;

	return (
		<Text style={[{ color: theme.colors.text }, style, themeSpecificStyle]} {...props}>
			{children}
		</Text>
	);
};
