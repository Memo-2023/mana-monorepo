import React from 'react';
import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '~/hooks/useTheme';

export type TextVariant =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'h5'
	| 'h6'
	| 'body'
	| 'bodyLarge'
	| 'bodySmall'
	| 'caption'
	| 'label'
	| 'labelLarge'
	| 'labelSmall'
	| 'button'
	| 'buttonSmall'
	| 'overline'
	| 'subtitle1'
	| 'subtitle2';

export type TextColor =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'accent'
	| 'error'
	| 'warning'
	| 'success'
	| 'info'
	| 'white'
	| 'black'
	| 'gray'
	| 'muted'
	| 'red'
	| 'blue'
	| 'green'
	| 'yellow'
	| 'purple'
	| 'pink'
	| 'indigo'
	| 'cyan'
	| 'orange'
	| 'inherit';

interface TextComponentProps extends RNTextProps {
	variant?: TextVariant;
	color?: TextColor;
	weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
	align?: 'left' | 'center' | 'right' | 'justify';
	className?: string;
	children: React.ReactNode;
}

const variantStyles: Record<TextVariant, string> = {
	h1: 'text-4xl font-bold',
	h2: 'text-3xl font-bold',
	h3: 'text-2xl font-bold',
	h4: 'text-xl font-bold',
	h5: 'text-lg font-bold',
	h6: 'text-base font-bold',
	body: 'text-base',
	bodyLarge: 'text-lg',
	bodySmall: 'text-sm',
	caption: 'text-xs',
	label: 'text-sm font-medium',
	labelLarge: 'text-base font-medium',
	labelSmall: 'text-xs font-medium',
	button: 'text-base font-semibold',
	buttonSmall: 'text-sm font-semibold',
	overline: 'text-xs font-medium uppercase tracking-wide',
	subtitle1: 'text-base font-medium',
	subtitle2: 'text-sm font-medium',
};

const colorStyles: Record<TextColor, string> = {
	primary: 'text-blue-600',
	secondary: 'text-gray-600',
	accent: 'text-purple-600',
	error: 'text-red-600',
	warning: 'text-yellow-600',
	success: 'text-green-600',
	info: 'text-blue-500',
	white: 'text-white',
	black: 'text-black',
	gray: 'text-gray-500',
	muted: 'text-gray-400',
	red: 'text-red-600',
	blue: 'text-blue-600',
	green: 'text-green-600',
	yellow: 'text-yellow-600',
	purple: 'text-purple-600',
	pink: 'text-pink-600',
	indigo: 'text-indigo-600',
	cyan: 'text-cyan-600',
	orange: 'text-orange-600',
};

const weightStyles: Record<string, string> = {
	light: 'font-light',
	normal: 'font-normal',
	medium: 'font-medium',
	semibold: 'font-semibold',
	bold: 'font-bold',
};

const alignStyles: Record<string, string> = {
	left: 'text-left',
	center: 'text-center',
	right: 'text-right',
	justify: 'text-justify',
};

export const Text: React.FC<TextComponentProps> = ({
	variant = 'body',
	color = 'inherit',
	weight,
	align,
	className,
	children,
	...props
}) => {
	const { colors } = useTheme();

	// Map semantic colors to theme colors
	const getThemeColor = (textColor: TextColor): string => {
		switch (textColor) {
			case 'inherit':
			case 'primary':
				return colors.text;
			case 'secondary':
				return colors.textSecondary;
			case 'tertiary':
			case 'muted':
				return colors.textTertiary;
			default:
				return colorStyles[textColor] || colors.text;
		}
	};

	const variantClass = variantStyles[variant];
	const colorClass = getThemeColor(color);
	const weightClass = weight ? weightStyles[weight] : '';
	const alignClass = align ? alignStyles[align] : '';

	const combinedClassName = [variantClass, colorClass, weightClass, alignClass, className]
		.filter(Boolean)
		.join(' ');

	return (
		<RNText className={combinedClassName} {...props}>
			{children}
		</RNText>
	);
};
