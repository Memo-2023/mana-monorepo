import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Button as ExpoButton, Host } from '@expo/ui/swift-ui';
import * as Haptics from 'expo-haptics';
import { useIsDarkMode } from '~/store/settingsStore';

export type ButtonVariant = 'default' | 'bordered' | 'borderless';
export type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
	children: React.ReactNode;
	onPress: () => void;
	variant?: ButtonVariant;
	size?: ButtonSize;
	disabled?: boolean;
	style?: ViewStyle;
	className?: string;
	hapticFeedback?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
	children,
	onPress,
	variant = 'default',
	size = 'medium',
	disabled = false,
	style,
	className = '',
	hapticFeedback = true,
}) => {
	const isDarkMode = useIsDarkMode();

	const handlePress = () => {
		if (disabled) return;

		if (hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
		onPress();
	};

	// Determine host size based on size prop
	const getHostStyle = (): ViewStyle => {
		const baseStyle: ViewStyle = {
			...style,
		};

		switch (size) {
			case 'small':
				return { ...baseStyle, minHeight: 32 };
			case 'medium':
				return { ...baseStyle, minHeight: 44 };
			case 'large':
				return { ...baseStyle, minHeight: 56 };
			default:
				return baseStyle;
		}
	};

	return (
		<Host matchContents style={getHostStyle()} className={className}>
			<ExpoButton onPress={handlePress} variant={variant}>
				{children}
			</ExpoButton>
		</Host>
	);
};

export default Button;
