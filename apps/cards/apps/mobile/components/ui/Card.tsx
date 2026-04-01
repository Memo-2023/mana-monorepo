import React from 'react';
import { View, Pressable, ViewProps, ViewStyle } from 'react-native';
import { useThemeColors } from '~/utils/themeUtils';

interface CardProps extends ViewProps {
	children: React.ReactNode;
	onPress?: () => void;
	variant?: 'default' | 'outlined' | 'elevated';
	padding?: 'none' | 'sm' | 'md' | 'lg';
	className?: string;
	style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
	children,
	onPress,
	variant = 'default',
	padding = 'md',
	className = '',
	style,
	...props
}) => {
	const colors = useThemeColors();

	const paddingValues = {
		none: 0,
		sm: 8,
		md: 16,
		lg: 24,
	};

	const getVariantStyles = (): ViewStyle => {
		switch (variant) {
			case 'outlined':
				return {
					backgroundColor: colors.surfaceElevated,
					borderWidth: 1,
					borderColor: colors.border,
				};
			case 'elevated':
				return {
					backgroundColor: colors.surface,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 4 },
					shadowOpacity: 0.15,
					shadowRadius: 12,
					elevation: 6,
					borderWidth: 1.5,
					borderColor: colors.border,
				};
			case 'default':
			default:
				return {
					backgroundColor: colors.surfaceElevated,
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.1,
					shadowRadius: 6,
					elevation: 4,
					borderWidth: 1,
					borderColor: colors.border,
				};
		}
	};

	const containerStyle: ViewStyle = {
		borderRadius: 16,
		overflow: 'hidden',
		padding: paddingValues[padding],
		...getVariantStyles(),
		...style,
	};

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					...containerStyle,
					opacity: pressed ? 0.95 : 1,
					transform: pressed ? [{ scale: 0.98 }] : [{ scale: 1 }],
				})}
				{...props}
			>
				{children}
			</Pressable>
		);
	}

	return (
		<View style={containerStyle} {...props}>
			{children}
		</View>
	);
};
