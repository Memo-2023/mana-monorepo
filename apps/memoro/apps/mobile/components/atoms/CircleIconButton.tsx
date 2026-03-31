import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

interface CircleIconButtonProps {
	size?: number;
	onPress?: () => void;
	children: React.ReactNode;
	style?: ViewStyle;
	disabled?: boolean;
}

const CircleIconButton: React.FC<CircleIconButtonProps> = ({
	size = 52,
	onPress,
	children,
	style,
	disabled = false,
}) => {
	const { isDark, themeVariant } = useTheme();

	const themeColors = (colors as any).theme?.extend?.colors;
	const backgroundColor = isDark
		? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';

	const circleStyle: ViewStyle = {
		width: size,
		height: size,
		borderRadius: size / 2,
		backgroundColor,
		justifyContent: 'center',
		alignItems: 'center',
		opacity: 0.66,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	};

	if (onPress) {
		return (
			<Pressable style={[circleStyle, style]} onPress={onPress} disabled={disabled}>
				{children}
			</Pressable>
		);
	}

	return <View style={[circleStyle, style]}>{children}</View>;
};

export default CircleIconButton;
