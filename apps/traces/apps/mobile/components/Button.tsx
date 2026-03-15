import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

import { useTheme } from '../utils/themeContext';

type ButtonProps = {
	title: string;
	variant?: 'primary' | 'secondary';
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
	({ title, variant = 'primary', ...touchableProps }, ref) => {
		const { isDarkMode } = useTheme();

		// Dynamic button styles based on variant and theme
		const getButtonStyle = () => {
			if (variant === 'primary') {
				return 'bg-primary';
			} else {
				return 'bg-secondary';
			}
		};

		return (
			<TouchableOpacity
				ref={ref}
				{...touchableProps}
				className={`${styles.button} ${getButtonStyle()} ${isDarkMode ? 'shadow-lg shadow-black/50' : 'shadow-md'} ${touchableProps.className}`}
			>
				<Text className={styles.buttonText}>{title}</Text>
			</TouchableOpacity>
		);
	}
);

const styles = {
	button: 'items-center rounded-[28px] p-4',
	buttonText: 'text-white text-lg font-semibold text-center',
};
