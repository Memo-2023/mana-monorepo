import React from 'react';
import { Pressable } from 'react-native';
import Icon from '@/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';

/**
 * A large round checkbox for selection UIs.
 * @param checked Whether the checkbox is checked.
 * @param onPress Called when the checkbox is pressed.
 * @param disabled If true, disables interaction.
 * @param style Optional custom style.
 */
interface RoundCheckboxProps {
	checked: boolean;
	onPress: () => void;
	disabled?: boolean;
	style?: any;
}

const RoundCheckbox: React.FC<RoundCheckboxProps> = ({
	checked,
	onPress,
	disabled = false,
	style,
}) => {
	// Get theme and variant from ThemeProvider
	const { themeVariant, isDark } = useTheme();

	// Use theme CSS variables for border and background
	const borderColor = isDark
		? `var(--color-dark-${themeVariant}-primary)`
		: `var(--color-${themeVariant}-primary)`;

	// Use CSS variable with alpha for background if checked, else white
	// This assumes your theme supports CSS variable with alpha, otherwise fallback to rgba
	const backgroundColor = checked
		? `rgba(var(--color-rgb-${isDark ? `dark-${themeVariant}` : themeVariant}-primary), 0.5)`
		: '#fff';

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			accessibilityRole="checkbox"
			accessibilityState={{ checked, disabled }}
			style={({ pressed }) => [
				{
					width: 32,
					height: 32,
					borderRadius: 16,
					borderWidth: 2,
					alignItems: 'center',
					justifyContent: 'center',
					borderColor,
					backgroundColor,
					opacity: pressed ? 0.8 : 1,
				},
				style,
			]}
		>
			{checked && <Icon name="checkmark" size={22} color="#fff" />}
		</Pressable>
	);
};

export default RoundCheckbox;
