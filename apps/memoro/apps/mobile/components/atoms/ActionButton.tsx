import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from './Icon';

export interface ActionButtonProps extends PressableProps {
	iconName: string;
	size?: number;
	active?: boolean;
	activeColor?: string;
	inactiveColor?: string;
	buttonSize?: number;
	className?: string;
}

/**
 * ActionButton-Komponente
 *
 * Ein runder Button mit Icon für Aktionen wie Pause, Abbrechen und Einstellungen.
 *
 * Beispiel:
 * ```tsx
 * <ActionButton
 *   iconName="settings-outline"
 *   active={true}
 *   onPress={handlePress}
 * />
 * ```
 */
function ActionButton({
	iconName,
	size = 28,
	active = false,
	activeColor,
	inactiveColor,
	buttonSize = 48,
	style,
	className,
	onPress,
	...rest
}: ActionButtonProps) {
	const { isDark, themeVariant } = useTheme();

	const handlePress = async (event: any) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
		onPress?.(event);
	};

	// Bestimme die Farben basierend auf dem Theme
	const activeColorToUse =
		activeColor ||
		(isDark ? `var(--color-dark-${themeVariant}-primary)` : `var(--color-${themeVariant}-primary)`);
	const inactiveColorToUse = inactiveColor || (isDark ? '#333333' : '#F5F5F5');
	const textColorToUse = active ? '#FFFFFF' : isDark ? '#FFFFFF' : '#000000';

	return (
		<Pressable
			className={`items-center justify-center ${className || ''}`}
			style={[
				{
					width: buttonSize,
					height: buttonSize,
					borderRadius: buttonSize / 2,
					backgroundColor: active ? activeColorToUse : inactiveColorToUse,
				},
				style,
			]}
			onPress={handlePress}
			{...rest}
		>
			<Icon name={iconName} size={size} color={textColorToUse} />
		</Pressable>
	);
}

export default ActionButton;
