import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';

export type PillVariant = 'space' | 'document' | 'action';

export interface FilterPillProps {
	label: string;
	onPress: () => void;
	isSelected?: boolean;
	variant?: PillVariant;
	icon?: keyof typeof Ionicons.glyphMap;
	iconPosition?: 'left' | 'right';
	color?: {
		light: string;
		dark: string;
	};
	actionButton?: {
		icon: keyof typeof Ionicons.glyphMap;
		onPress: () => void;
	};
	disabled?: boolean;
	style?: any;
}

export const FilterPill: React.FC<FilterPillProps> = ({
	label,
	onPress,
	isSelected = false,
	variant = 'space',
	icon,
	iconPosition = 'left',
	color,
	actionButton,
	disabled = false,
	style,
}) => {
	const { isDark } = useTheme();
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);

	// Default colors based on variant
	const getDefaultColors = () => {
		switch (variant) {
			case 'space':
				return {
					light: '#818cf8',
					dark: '#4f46e5',
				};
			case 'document':
				return {
					light: '#0891b2',
					dark: '#06b6d4',
				};
			case 'action':
				return {
					light: '#4b5563',
					dark: '#d1d5db',
				};
			default:
				return {
					light: '#818cf8',
					dark: '#4f46e5',
				};
		}
	};

	const pillColors = color || getDefaultColors();

	// Calculate background color based on variant and selection state
	const getBgColor = () => {
		if (variant === 'document' && isSelected) {
			return isDark ? `${pillColors.dark}30` : `${pillColors.light}20`;
		}

		if (isSelected) {
			return isDark ? pillColors.dark : pillColors.light;
		}

		// Hover and pressed states for unselected pills
		if (isPressed) {
			return isDark ? '#374151' : '#e5e7eb';
		}

		if (isHovered) {
			return isDark ? '#2d3748' : '#f1f2f4';
		}

		return isDark ? '#1f2937' : '#f3f4f6';
	};

	// Calculate text/icon color based on variant and selection state
	const getContentColor = () => {
		if (variant === 'document' && isSelected) {
			return isDark ? pillColors.dark : pillColors.light;
		}

		if (isSelected) {
			return '#ffffff';
		}

		return isDark ? '#d1d5db' : '#4b5563';
	};

	// Calculate border color
	const getBorderColor = () => {
		if (variant === 'document' && isSelected) {
			return isDark ? pillColors.dark : pillColors.light;
		}

		if (isSelected) {
			return isDark ? pillColors.dark : pillColors.light;
		}

		return isDark ? '#374151' : '#d1d5db';
	};

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				marginRight: actionButton ? 12 : 8,
				height: 28,
			}}
		>
			<Pressable
				style={[
					styles.pill,
					{
						paddingRight: actionButton ? 30 : 14, // Mehr Platz für den Action Button
						backgroundColor: getBgColor(),
						borderColor: getBorderColor(),
						opacity: disabled ? 0.6 : (isHovered || isPressed) && !isSelected ? 0.8 : 1,
					},
					style,
				]}
				onPress={disabled ? undefined : onPress}
				onHoverIn={() => setIsHovered(true)}
				onHoverOut={() => setIsHovered(false)}
				onPressIn={() => setIsPressed(true)}
				onPressOut={() => setIsPressed(false)}
			>
				{icon && iconPosition === 'left' && (
					<Ionicons name={icon} size={16} color={getContentColor()} style={styles.leftIcon} />
				)}

				<Text
					style={[
						styles.label,
						{
							color: getContentColor(),
							fontSize: 14,
						},
					]}
				>
					{label}
				</Text>

				{icon && iconPosition === 'right' && (
					<Ionicons name={icon} size={16} color={getContentColor()} style={styles.rightIcon} />
				)}
			</Pressable>

			{actionButton && (
				<Pressable
					style={({ pressed }) => [
						styles.actionButton,
						{
							backgroundColor: isSelected
								? isDark
									? pillColors.dark
									: pillColors.light
								: pressed
									? isDark
										? '#374151'
										: '#d1d5db'
									: isDark
										? '#111827'
										: '#e5e7eb',
							borderColor: isSelected
								? isDark
									? pillColors.dark
									: pillColors.light
								: isDark
									? '#1f2937'
									: '#d1d5db',
							opacity: disabled ? 0.6 : pressed ? 0.8 : 1,
						},
					]}
					onPress={disabled ? undefined : actionButton.onPress}
				>
					<Ionicons
						name={actionButton.icon}
						size={14}
						color={isSelected ? '#ffffff' : isDark ? '#d1d5db' : '#4b5563'}
					/>
				</Pressable>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	pill: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 14,
		paddingVertical: 4,
		borderRadius: 9999,
		borderWidth: 1,
		height: 28,
	},
	label: {
		fontWeight: '500',
		fontSize: 14,
	},
	leftIcon: {
		marginRight: 4,
	},
	rightIcon: {
		marginLeft: 4,
	},
	actionButton: {
		width: 24,
		height: 24,
		borderRadius: 9999,
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: -10, // Weniger Überlappung für mehr Abstand
		position: 'absolute',
		right: -2, // Mehr Abstand nach rechts
	},
});
