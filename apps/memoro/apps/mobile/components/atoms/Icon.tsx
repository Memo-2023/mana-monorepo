import React, { useMemo } from 'react';
import { View, Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getIconComponent } from '~/features/icons/iconMapping';
import { Question as QuestionIcon } from 'phosphor-react-native';

// Props for the Icon component
type IconProps = {
	name: string;
	size?: number;
	color?: string;
	weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
	useThemeColor?: boolean;
	className?: string;
	type?: 'ionicons'; // kept for backward compat, ignored
	asButton?: boolean;
	buttonBackgroundColor?: string;
	onPress?: PressableProps['onPress'];
	buttonClassName?: string;
	disabled?: boolean;
};

/**
 * Icon component using Phosphor Icons (Bold weight)
 *
 * Provides consistent icons across all platforms (iOS, Android, Web).
 * Uses the same Phosphor Icons library as the web app.
 */
export const Icon: React.FC<IconProps> = React.memo(
	({
		name,
		size = 24,
		color,
		weight = 'duotone',
		useThemeColor = false,
		className = '',
		asButton = false,
		buttonBackgroundColor,
		onPress,
		buttonClassName = '',
		disabled = false,
	}: IconProps) => {
		const { tw, themeVariant, isDark, themeVersion } = useTheme();

		const iconColor = useMemo(() => {
			if (useThemeColor) {
				return isDark
					? `var(--color-dark-${themeVariant}-primary)`
					: `var(--color-${themeVariant}-primary)`;
			} else if (!color && className) {
				const colorClass = className.match(/text-([a-z0-9-]+)/)?.[0];
				if (colorClass) {
					const twClass = tw(colorClass);
					return twClass.includes('text-dark-')
						? `var(--color-${twClass.replace('text-dark-', '')})`
						: `var(--color-${twClass.replace('text-', '')})`;
				}
			}
			return color;
		}, [color, className, useThemeColor, themeVariant, isDark, tw, themeVersion]);

		const renderIcon = () => {
			const PhosphorIcon = getIconComponent(name);

			if (PhosphorIcon) {
				return (
					<PhosphorIcon
						size={size}
						color={iconColor || (isDark ? '#FFFFFF' : '#000000')}
						weight={weight}
					/>
				);
			}

			// Fallback: show question mark for unmapped icons
			if (__DEV__) {
				console.warn(`[Icon] No Phosphor mapping for icon name: "${name}"`);
			}
			return (
				<QuestionIcon
					size={size}
					color={iconColor || (isDark ? '#FFFFFF' : '#000000')}
					weight="bold"
				/>
			);
		};

		const handlePress = async () => {
			if (!disabled && onPress) {
				try {
					await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				} catch (error) {
					console.debug('Haptic feedback error:', error);
				}
				onPress();
			}
		};

		if (asButton) {
			return (
				<Pressable
					onPress={handlePress}
					disabled={disabled}
					style={({ pressed }) => [
						{
							padding: 8,
							opacity: pressed ? 0.7 : 1,
						},
					]}
				>
					<View
						style={{
							width: 36,
							height: 36,
							borderRadius: 8,
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: buttonBackgroundColor,
						}}
					>
						{renderIcon()}
					</View>
				</Pressable>
			);
		}

		return <View style={className ? tw(className) : undefined}>{renderIcon()}</View>;
	}
);

export default Icon as React.FC<IconProps>;
