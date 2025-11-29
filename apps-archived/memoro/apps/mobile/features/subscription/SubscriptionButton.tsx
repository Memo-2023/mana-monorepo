import React, { useState } from 'react';
import { Pressable, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import Text from '~/components/atoms/Text';

interface SubscriptionButtonProps {
	label: string;
	onPress: () => void;
	iconName?: keyof typeof Ionicons.glyphMap;
	leftIconName?: keyof typeof Ionicons.glyphMap;
	variant?: 'primary' | 'secondary' | 'accent';
	disabled?: boolean;
}

export const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
	label,
	onPress,
	iconName = 'arrow-forward-outline',
	leftIconName = 'cart-outline',
	variant = 'primary',
	disabled = false,
}) => {
	const { isDark, themeVariant } = useTheme();
	const [isHovered, setIsHovered] = useState(false);

	// Get background color based on variant and theme
	function getBackgroundColor() {
		if (disabled) return isDark ? '#333333' : '#EEEEEE';
		if (variant === 'accent') return '#4287f5'; // Konsistente Mana-Farbe
		if (variant === 'primary') return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
		return isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
	}

	// Get border color based on variant and theme
	function getBorderColor() {
		if (disabled) return isDark ? '#444444' : '#DDDDDD';
		if (variant === 'accent') return '#4287f5'; // Konsistente Mana-Farbe
		if (variant === 'primary') return isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';
		return isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
	}

	// Get text color based on variant and theme
	function getTextColor() {
		if (disabled) return isDark ? '#777777' : '#999999';
		if (variant === 'accent') return '#000000';
		if (variant === 'primary') return isDark ? '#FFFFFF' : '#000000';
		return isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)';
	}

	// Hover props for web
	const hoverProps =
		Platform.OS === 'web'
			? {
					onMouseEnter: () => setIsHovered(true),
					onMouseLeave: () => setIsHovered(false),
				}
			: {};

	return (
		<Pressable
			className="h-12 flex-row items-center justify-center justify-between rounded-lg border px-4"
			style={[
				{
					backgroundColor: isHovered ? (isDark ? '#333333' : '#F5F5F5') : getBackgroundColor(),
					borderColor: getBorderColor(),
					opacity: disabled ? 0.5 : 1,
				},
			]}
			disabled={disabled}
			onPress={disabled ? undefined : onPress}
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			{...hoverProps}
		>
			<View className="flex-row items-center justify-center">
				<Ionicons name={leftIconName} size={16} color={getTextColor()} style={{ marginRight: 8 }} />
				<Text variant="body" style={[{ color: getTextColor(), fontWeight: '500' }]}>
					{label}
				</Text>
			</View>

			<Ionicons name={iconName} size={16} color={getTextColor()} style={{ marginLeft: 8 }} />
		</Pressable>
	);
};

export default SubscriptionButton;
