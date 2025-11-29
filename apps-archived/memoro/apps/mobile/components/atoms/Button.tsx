import React, { forwardRef, useState } from 'react';
import { Pressable, View, PressableProps, ViewStyle, TextStyle, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import Text from './Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from './Icon';

interface ButtonProps extends Omit<PressableProps, 'style'> {
	title?: string;
	variant?: 'primary' | 'secondary' | 'icon' | 'text' | 'danger';
	iconName?: string;
	iconSize?: number;
	iconColor?: string;
	leftIcon?: () => React.ReactNode;
	iconButtonStyle?: boolean;
	active?: boolean;
	textStyle?: TextStyle;
	noBorder?: boolean;
	disabled?: boolean;
	loading?: boolean;
	style?: ViewStyle | ViewStyle[];
	numberOfLines?: number;
}

/**
 * Button-Komponente
 *
 * Eine flexible Button-Komponente, die verschiedene Varianten und Stile unterstützt.
 *
 * Beispiel:
 * ```tsx
 * <Button title="Klick mich" variant="primary" />
 * <Button title="Abbrechen" variant="secondary" />
 * <Button iconName="trash-outline" variant="danger" />
 * <Button iconName="settings-outline" variant="icon" iconButtonStyle />
 * ```
 */
const Button = forwardRef<View, ButtonProps>(
	(
		{
			title,
			variant = 'primary',
			iconName,
			iconSize,
			iconColor,
			leftIcon,
			style,
			iconButtonStyle = false,
			active = false,
			textStyle,
			noBorder = false,
			disabled = false,
			loading = false,
			numberOfLines,
			onPress,
			...props
		},
		ref
	) => {
		const { isDark, themeVariant, colors } = useTheme();
		const [isHovered, setIsHovered] = useState(false);

		// Haptic feedback for button press
		const triggerButtonHaptic = async () => {
			try {
				await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			} catch (error) {
				console.debug('Haptic feedback error:', error);
			}
		};

		// Enhanced onPress handler with haptic feedback
		const handlePress = async (event: any) => {
			if (!disabled && !loading) {
				await triggerButtonHaptic();
				onPress?.(event);
			}
		};

		// Get theme colors based on the current theme variant
		const getThemeColor = (isDarkMode: boolean, variant: string) => {
			// Use the actual theme colors from the provider instead of hardcoded fallbacks
			return colors.primaryButton;
		};

		// Get primaryButton color from the current theme
		const getPrimaryButtonColor = () => {
			// Debug logging to see what colors we're getting
			// @Till kannsch wieder rein machen wenns brauchsch ansonsten spamt mir das die console zu.r
			// if (__DEV__ && variant === 'primary') {
			//   console.debug('🎨 Button primaryButton color:', colors.primaryButton, 'isDark:', isDark, 'themeVariant:', themeVariant);
			// }
			return colors.primaryButton;
		};

		// Get button hover color - etwas dunklere Version der primaryButton-Farbe
		const getButtonHoverColor = () => {
			// For now, use the same color as primary button
			// Could be extended later to support hover variants
			return colors.primaryButton;
		};

		// Determine colors based on theme and variant
		function getBackgroundColor() {
			if (disabled || loading) return isDark ? '#333333' : '#EEEEEE';
			if (variant === 'text') return 'transparent';
			if (variant === 'primary') return isHovered ? getButtonHoverColor() : getPrimaryButtonColor();
			if (active) return getThemeColor(isDark, themeVariant);
			if (variant === 'danger') return '#e74c3c';
			if (variant === 'secondary')
				return isHovered ? colors.contentBackgroundHover : colors.secondaryButton;
			return isDark ? '#1E1E1E' : '#FFFFFF';
		}

		// Get border color from the current theme
		const getThemeBorderColor = () => {
			return colors.borderStrong || colors.border;
		};

		function getBorderColor() {
			if (disabled || loading) return isDark ? '#444444' : '#DDDDDD';
			if (noBorder) return 'transparent';
			if (variant === 'primary') return getPrimaryButtonColor(); // Use same color as background for primary buttons
			if (active) return getThemeColor(isDark, themeVariant);
			if (variant === 'danger') return '#e74c3c';
			if (variant === 'secondary') return colors.border;
			return isDark ? '#444444' : '#DDDDDD';
		}

		// Get button text color from the current theme
		const getButtonTextColor = () => {
			return colors.primaryButtonText;
		};

		function getTextColor() {
			if (disabled || loading) return isDark ? '#777777' : '#999999';
			if (variant === 'primary') return getButtonTextColor();
			if (variant === 'danger') return '#FFFFFF';
			if (variant === 'secondary') return colors.text;
			if (variant === 'text') return colors.text; // Use theme text color for text variant
			return getThemeColor(isDark, themeVariant);
		}

		// Determine the icon color - should match text color
		const defaultIconColor = getTextColor();
		let finalIconColor = iconColor || defaultIconColor;
		if (disabled) {
			finalIconColor = isDark ? '#777777' : '#999999';
		}

		const finalIconSize = iconSize || 20;

		// Hover-Props für Web
		const hoverProps =
			Platform.OS === 'web'
				? {
						onMouseEnter: () => setIsHovered(true),
						onMouseLeave: () => setIsHovered(false),
					}
				: {};

		return (
			<Pressable
				ref={ref}
				style={[
					{
						// Base styles
						width: iconButtonStyle ? 48 : undefined,
						height: 48,
						paddingHorizontal: iconButtonStyle ? 0 : 16,
						borderRadius: 8,
						alignItems: 'center',
						justifyContent: 'center',
						borderWidth: variant === 'text' ? 0 : 1,
						// Theme styles
						backgroundColor: getBackgroundColor(),
						borderColor: getBorderColor(),
						opacity: disabled || loading ? 0.5 : 1,
					},
					style,
				]}
				disabled={disabled || loading}
				onPress={handlePress}
				accessibilityRole="button"
				accessibilityState={{ disabled: disabled || loading }}
				{...hoverProps}
				{...props}
			>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						flex: 1,
						minWidth: 0,
					}}
				>
					{leftIcon && leftIcon()}

					{iconName && (
						<View style={{ marginRight: title ? 8 : 0 }}>
							<Icon
								name={loading ? 'sync-outline' : iconName}
								size={finalIconSize}
								color={finalIconColor}
							/>
						</View>
					)}

					{title && !iconButtonStyle && (
						<Text
							variant="body"
							style={[{ color: getTextColor(), fontWeight: '500' }, textStyle]}
							numberOfLines={numberOfLines}
						>
							{title}
						</Text>
					)}
				</View>
			</Pressable>
		);
	}
);

Button.displayName = 'Button';

export default Button;
