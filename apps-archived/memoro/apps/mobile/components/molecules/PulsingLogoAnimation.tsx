import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import MemoroLogo from '~/components/atoms/MemoroLogo';
import { useTheme } from '~/features/theme/ThemeProvider';

interface PulsingLogoAnimationProps {
	size?: number;
	style?: ViewStyle;
	color?: string;
}

/**
 * Einfache pulsierende Logo-Animation
 * Minimalistisch und elegant - perfekt für Loading-States
 */
export function PulsingLogoAnimation({ size = 80, style, color }: PulsingLogoAnimationProps) {
	const { colors } = useTheme();
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const opacityAnim = useRef(new Animated.Value(1)).current;

	const logoColor = color || colors.primary;

	useEffect(() => {
		// Kombinierte Scale + Opacity Animation
		const animation = Animated.loop(
			Animated.sequence([
				Animated.parallel([
					Animated.timing(scaleAnim, {
						toValue: 1.1,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(opacityAnim, {
						toValue: 0.6,
						duration: 1000,
						useNativeDriver: true,
					}),
				]),
				Animated.parallel([
					Animated.timing(scaleAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true,
					}),
					Animated.timing(opacityAnim, {
						toValue: 1,
						duration: 1000,
						useNativeDriver: true,
					}),
				]),
			])
		);

		animation.start();

		return () => animation.stop();
	}, [scaleAnim, opacityAnim]);

	return (
		<View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
			<Animated.View
				style={{
					transform: [{ scale: scaleAnim }],
					opacity: opacityAnim,
				}}
			>
				<MemoroLogo size={size} color={logoColor} />
			</Animated.View>
		</View>
	);
}
