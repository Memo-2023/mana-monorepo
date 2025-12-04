import React, { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../utils/ThemeContext';

interface SubscriptionButtonProps {
	label: string;
	onPress: () => void;
	iconName?: keyof typeof Ionicons.glyphMap;
	variant?: 'primary' | 'secondary' | 'accent';
	disabled?: boolean;
}

export const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
	label,
	onPress,
	iconName = 'chevron-forward',
	variant = 'primary',
	disabled = false,
}) => {
	const { theme } = useTheme();
	const [isHovered, setIsHovered] = useState(false);

	// Bestimme die Klassen basierend auf der Variante und dem Hover-Status
	const getButtonClasses = () => {
		const baseClasses = 'flex-row items-center justify-between py-2.5 px-4 rounded-lg';
		const disabledClass = disabled ? 'opacity-50' : '';
		const hoverClass = isHovered && !disabled ? 'opacity-90' : '';

		switch (variant) {
			case 'accent':
				return `${baseClasses} ${hoverClass} ${disabledClass}`;
			case 'primary':
				return `${baseClasses} bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] ${hoverClass} ${disabledClass}`;
			case 'secondary':
			default:
				return `${baseClasses} bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] ${hoverClass} ${disabledClass}`;
		}
	};

	// Bestimme die Textklassen basierend auf der Variante
	const getTextClasses = () => {
		const baseClasses = 'text-sm font-medium';

		switch (variant) {
			case 'accent':
				return `${baseClasses} text-black font-semibold`;
			case 'primary':
				return `${baseClasses} text-white`;
			case 'secondary':
			default:
				return `${baseClasses} text-[rgba(255,255,255,0.8)]`;
		}
	};

	return (
		<Pressable
			className={getButtonClasses()}
			onPress={disabled ? undefined : onPress}
			onHoverIn={() => setIsHovered(true)}
			onHoverOut={() => setIsHovered(false)}
			style={({ pressed }) => [
				variant === 'accent' ? { backgroundColor: theme.colors.primary } : {},
				pressed && !disabled ? { opacity: 0.75, transform: [{ scale: 0.98 }] } : {},
				isHovered && !disabled && !pressed
					? {
							opacity: 0.9,
							transform: [{ scale: 1.02 }],
							shadowColor: '#000',
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 3,
							elevation: 2,
						}
					: {},
			]}
		>
			<View className="flex-row items-center">
				<Text className={getTextClasses()}>{label}</Text>
			</View>

			<Ionicons
				name={iconName}
				size={16}
				color={
					variant === 'accent'
						? '#000000'
						: variant === 'primary'
							? '#FFFFFF'
							: 'rgba(255,255,255,0.8)'
				}
				style={{ marginLeft: 8 }}
			/>
		</Pressable>
	);
};

export default SubscriptionButton;
