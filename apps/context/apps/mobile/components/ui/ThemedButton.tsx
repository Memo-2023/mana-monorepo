import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { colors } from '~/utils/theme/colors';

interface ThemedButtonProps {
	title: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary' | 'outline' | 'danger';
	size?: 'small' | 'medium' | 'large';
	iconName?: keyof typeof Ionicons.glyphMap;
	isActive?: boolean;
	disabled?: boolean;
	style?: ViewStyle;
	textStyle?: TextStyle;
	iconOnly?: boolean;
	tooltip?: string;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
	title,
	onPress,
	variant = 'primary',
	size = 'medium',
	iconName,
	isActive = false,
	disabled = false,
	style,
	textStyle,
	iconOnly = false,
	tooltip,
}) => {
	const { isDark } = useTheme();
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);

	// Bestimme die Hintergrundfarbe basierend auf Variante und Zustand
	const getBackgroundColor = () => {
		// Typensicherheit für die Variante
		if (variant === 'outline') {
			return 'transparent';
		}

		// Danger-Variante für Lösch-Buttons
		if (variant === 'danger') {
			if (disabled) {
				return isDark ? '#6b2128' : '#fecaca';
			}

			if (isPressed || isActive) {
				return isDark ? '#b91c1c' : '#ef4444';
			}

			if (isHovered) {
				return isDark ? '#991b1b' : '#f87171';
			}

			return isDark ? '#7f1d1d' : '#dc2626';
		}

		const buttonColors = colors.button[variant as 'primary' | 'secondary'];

		if (disabled) {
			return isDark
				? buttonColors.background.disabled.dark
				: buttonColors.background.disabled.light;
		}

		if (isPressed || isActive) {
			return isDark ? buttonColors.background.active.dark : buttonColors.background.active.light;
		}

		if (isHovered) {
			return isDark ? buttonColors.background.hover.dark : buttonColors.background.hover.light;
		}

		return isDark ? buttonColors.background.default.dark : buttonColors.background.default.light;
	};

	// Bestimme die Textfarbe basierend auf Variante und Zustand
	const getTextColor = () => {
		// Danger-Variante für Lösch-Buttons
		if (variant === 'danger') {
			return '#ffffff';
		}

		const buttonColors = colors.button[variant as keyof typeof colors.button];

		if (disabled) {
			if (variant === 'primary' || variant === 'secondary') {
				return isDark ? buttonColors.text.disabled.dark : buttonColors.text.disabled.light;
			}
			return isDark ? '#4b5563' : '#9ca3af';
		}

		if (isPressed || isActive) {
			if (variant === 'secondary') {
				return '#ffffff';
			}

			if (variant === 'primary') {
				return '#ffffff';
			}

			// outline variant
			return isDark ? '#e5e7eb' : '#374151';
		}

		if (isHovered) {
			if (variant === 'outline') {
				return isDark ? '#e5e7eb' : '#374151';
			}

			if (variant === 'primary') {
				return '#ffffff';
			}

			if (variant === 'secondary') {
				return isDark ? '#f9fafb' : '#111827';
			}
		}

		// Default state
		if (variant === 'primary') {
			return '#ffffff';
		}

		if (variant === 'secondary') {
			return isDark ? '#f9fafb' : '#111827';
		}

		// outline variant
		return isDark ? '#f9fafb' : '#111827';
	};

	// Bestimme den Rand basierend auf Variante und Zustand
	const getBorderColor = () => {
		if (variant === 'outline') {
			const borderColors = colors.button.outline.border;

			if (isPressed || isActive) {
				return isDark ? borderColors.active.dark : borderColors.active.light;
			}

			if (isHovered) {
				return isDark ? borderColors.hover.dark : borderColors.hover.light;
			}

			return isDark ? borderColors.default.dark : borderColors.default.light;
		}
		return 'transparent';
	};

	// Bestimme die Größe basierend auf der size-Prop und iconOnly
	const getSizeStyles = () => {
		if (iconOnly) {
			switch (size) {
				case 'small':
					return {
						padding: 6,
						borderRadius: 4,
						fontSize: 12,
						iconSize: 14,
					};
				case 'large':
					return {
						padding: 12,
						borderRadius: 8,
						fontSize: 16,
						iconSize: 20,
					};
				case 'medium':
				default:
					return {
						padding: 8,
						borderRadius: 6,
						fontSize: 14,
						iconSize: 16,
					};
			}
		} else {
			switch (size) {
				case 'small':
					return {
						paddingVertical: 6,
						paddingHorizontal: 12,
						borderRadius: 4,
						fontSize: 12,
						iconSize: 14,
					};
				case 'large':
					return {
						paddingVertical: 12,
						paddingHorizontal: 24,
						borderRadius: 8,
						fontSize: 16,
						iconSize: 20,
					};
				case 'medium':
				default:
					return {
						paddingVertical: 8,
						paddingHorizontal: 16,
						borderRadius: 6,
						fontSize: 14,
						iconSize: 16,
					};
			}
		}
	};

	const sizeStyles = getSizeStyles();

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
			onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
			onPressIn={() => setIsPressed(true)}
			onPressOut={() => setIsPressed(false)}
			accessibilityLabel={title}
			accessibilityHint={tooltip}
			style={[
				styles.button,
				{
					backgroundColor: getBackgroundColor(),
					borderRadius: sizeStyles.borderRadius,
					borderWidth: variant === 'outline' ? 1 : 0,
					borderColor: getBorderColor(),
					opacity: disabled ? 0.6 : 1,
				},
				iconOnly
					? {
							padding: sizeStyles.padding,
							aspectRatio: 1, // Quadratisch für Icon-Only-Buttons
							justifyContent: 'center',
						}
					: {
							paddingVertical: sizeStyles.paddingVertical,
							paddingHorizontal: sizeStyles.paddingHorizontal,
						},
				style,
			]}
		>
			{iconName && (
				<Ionicons
					name={iconName}
					size={sizeStyles.iconSize}
					color={getTextColor()}
					style={[styles.icon, iconOnly && { marginRight: 0 }]}
				/>
			)}
			{!iconOnly && (
				<Text
					style={[
						styles.text,
						{
							color: getTextColor(),
							fontSize: sizeStyles.fontSize,
							fontWeight: '500',
						},
						textStyle,
					]}
				>
					{title}
				</Text>
			)}
		</Pressable>
	);
};

const styles = StyleSheet.create({
	button: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	icon: {
		marginRight: 8,
	},
	text: {
		textAlign: 'center',
	},
});
