import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface SpinnerAnimationProps {
	size?: number;
	style?: ViewStyle;
	color?: string;
	thickness?: number;
}

/**
 * Minimalistischer rotierender Spinner
 * Clean und modern - inspiriert von iOS/Material Design
 */
export function SpinnerAnimation({
	size = 60,
	style,
	color,
	thickness = 4,
}: SpinnerAnimationProps) {
	const { colors, isDark } = useTheme();
	const rotateAnim = useRef(new Animated.Value(0)).current;

	const spinnerColor = color || colors.primary;

	useEffect(() => {
		const animation = Animated.loop(
			Animated.timing(rotateAnim, {
				toValue: 1,
				duration: 1000,
				useNativeDriver: true,
			})
		);

		animation.start();

		return () => animation.stop();
	}, [rotateAnim]);

	const rotate = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '360deg'],
	});

	return (
		<View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
			<Animated.View
				style={{
					width: size,
					height: size,
					borderRadius: size / 2,
					borderWidth: thickness,
					borderColor: 'transparent',
					borderTopColor: spinnerColor,
					borderRightColor: spinnerColor,
					transform: [{ rotate }],
				}}
			/>
		</View>
	);
}
