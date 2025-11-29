import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import Icon, { IconSet } from './Icon';
import Text from './Text';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SFSymbol } from 'expo-symbols';
import { useTheme } from '../../src/theme/ThemeProvider';

type IconPosition = 'left' | 'right' | 'none';
type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'plain' | 'danger';
type ButtonSize = 'none' | 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps {
	title: string;
	onPress: () => void;
	color?: string;
	iconName?: keyof typeof MaterialIcons.glyphMap | keyof typeof Ionicons.glyphMap | SFSymbol;
	iconSet?: IconSet;
	iconPosition?: IconPosition;
	variant?: ButtonVariant;
	size?: ButtonSize;
	style?: any;
	textStyle?: any;
	contentContainerStyle?: any;
	disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
	title,
	onPress,
	color,
	iconName,
	iconSet,
	iconPosition = 'none',
	variant = 'primary',
	size = 'md',
	style,
	textStyle,
	contentContainerStyle,
	disabled = false,
}) => {
	const theme = useTheme();
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);

	// Auto-detect icon set based on platform if not specified
	const effectiveIconSet = iconSet || (Platform.OS === 'ios' ? 'sf-symbols' : 'ionicons');

	const getVariantStyles = () => {
		const buttonColor = color || theme.colors.yellow.dark;

		switch (variant) {
			case 'secondary':
				return {
					backgroundColor: buttonColor,
					borderWidth: 1,
					borderColor: buttonColor,
				};
			case 'danger':
				return {
					backgroundColor: '#d32f2f',
				};
			case 'tonal':
				return {
					backgroundColor: `${buttonColor}20`,
				};
			case 'plain':
				return {
					backgroundColor: 'transparent',
					paddingHorizontal: 0,
					minHeight: 0,
				};
			default:
				return {
					backgroundColor: buttonColor,
				};
		}
	};

	const getSizeStyles = () => {
		switch (size) {
			case 'sm':
				return {
					paddingVertical: 8,
					paddingHorizontal: 16,
					minHeight: 32,
				};
			case 'lg':
				return {
					paddingVertical: 16,
					paddingHorizontal: 32,
					minHeight: 48,
				};
			case 'icon':
				return {
					paddingVertical: 8,
					paddingHorizontal: 8,
					minHeight: 40,
					width: 40,
				};
			case 'none':
				return {};
			default:
				return {
					paddingVertical: 12,
					paddingHorizontal: 24,
					minHeight: 40,
				};
		}
	};

	const getTextColor = () => {
		if (variant === 'primary') return '#ffffff';
		if (variant === 'secondary') return textStyle?.color || '#ffffff';
		if (variant === 'tonal') return color;
		if (variant === 'plain') return color;
		return color;
	};

	const renderIcon = () => {
		if (!iconName || iconPosition === 'none') return null;
		return (
			<Icon
				set={effectiveIconSet as any}
				name={iconName as any}
				size={size === 'lg' ? 24 : 20}
				color={getTextColor()}
			/>
		);
	};

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={({ pressed }) => [
				styles.button,
				getSizeStyles(),
				getVariantStyles(),
				isHovered && styles.hovered,
				isPressed && styles.pressed,
				disabled && styles.disabled,
				style, // Move style to end so it can override everything
			]}
			onPressIn={() => setIsPressed(true)}
			onPressOut={() => setIsPressed(false)}
			onHoverIn={() => setIsHovered(true)}
			onHoverOut={() => setIsHovered(false)}
		>
			<View
				style={[
					styles.contentContainer,
					size === 'icon' && styles.iconContainer,
					contentContainerStyle,
				]}
			>
				{iconPosition === 'left' && renderIcon()}
				{size !== 'icon' && (
					<Text
						variant="body"
						color={getTextColor()}
						style={[styles.text, textStyle]}
						numberOfLines={1}
						ellipsizeMode="tail"
					>
						{title}
					</Text>
				)}
				{iconPosition === 'right' && renderIcon()}
			</View>
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		borderRadius: 8,
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'visible',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	hovered: {
		opacity: 0.8,
	},
	pressed: {
		opacity: 0.8,
	},
	disabled: {
		opacity: 0.5,
	},
	contentContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		gap: 8,
	},
	iconContainer: {
		aspectRatio: 1,
	},
	text: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
		flexShrink: 1,
	},
});

export default Button;
