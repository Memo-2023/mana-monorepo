import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { ReactNode } from 'react';

type TextProps = {
	variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
	children: ReactNode;
} & RNTextProps;

export const Text = ({ variant = 'body', children, className, ...props }: TextProps) => {
	const variantStyles = {
		h1: 'text-3xl font-bold text-gray-900 dark:text-white',
		h2: 'text-2xl font-bold text-gray-900 dark:text-white',
		h3: 'text-xl font-semibold text-gray-900 dark:text-white',
		h4: 'text-lg font-semibold text-gray-900 dark:text-white',
		body: 'text-base text-gray-700 dark:text-gray-300',
		caption: 'text-sm text-gray-500 dark:text-gray-400',
		label: 'text-sm font-medium text-gray-700 dark:text-gray-300',
	};

	return (
		<RNText className={`${variantStyles[variant]} ${className || ''}`} {...props}>
			{children}
		</RNText>
	);
};
