import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';
import { useIsDarkMode, useFontSize } from '~/store/settingsStore';

type TextVariant =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'body'
	| 'bodyLarge'
	| 'bodySmall'
	| 'caption'
	| 'label'
	| 'button'
	| 'quote';

type TextColor =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'accent'
	| 'danger'
	| 'success'
	| 'warning'
	| 'inherit';

interface TextProps extends Omit<RNTextProps, 'style'> {
	variant?: TextVariant;
	color?: TextColor;
	weight?: 'normal' | 'medium' | 'semibold' | 'bold';
	align?: 'left' | 'center' | 'right' | 'justify';
	className?: string;
	style?: TextStyle;
	children?: React.ReactNode;
}

export default function Text({
	variant = 'body',
	color = 'primary',
	weight,
	align,
	className = '',
	style,
	children,
	...props
}: TextProps) {
	const isDarkMode = useIsDarkMode();
	const fontSize = useFontSize();

	// Font size multiplier based on user preference
	const sizeMultiplier = fontSize === 'small' ? 0.9 : fontSize === 'large' ? 1.1 : 1;

	// Base styles for each variant
	const variantStyles: Record<TextVariant, string> = {
		h1: 'text-4xl font-bold',
		h2: 'text-3xl font-bold',
		h3: 'text-2xl font-semibold',
		h4: 'text-xl font-semibold',
		body: 'text-base',
		bodyLarge: 'text-lg',
		bodySmall: 'text-sm',
		caption: 'text-xs',
		label: 'text-sm font-medium uppercase tracking-wider',
		button: 'text-base font-semibold',
		quote: 'text-lg italic',
	};

	// Color styles based on theme
	const getColorClass = (color: TextColor): string => {
		if (color === 'inherit') return '';

		const colors: Record<TextColor, { dark: string; light: string }> = {
			primary: {
				dark: 'text-white',
				light: 'text-black',
			},
			secondary: {
				dark: 'text-white/60',
				light: 'text-black/60',
			},
			tertiary: {
				dark: 'text-white/40',
				light: 'text-black/40',
			},
			accent: {
				dark: 'text-purple-400',
				light: 'text-purple-600',
			},
			danger: {
				dark: 'text-red-400',
				light: 'text-red-600',
			},
			success: {
				dark: 'text-green-400',
				light: 'text-green-600',
			},
			warning: {
				dark: 'text-yellow-400',
				light: 'text-yellow-600',
			},
			inherit: {
				dark: '',
				light: '',
			},
		};

		return isDarkMode ? colors[color].dark : colors[color].light;
	};

	// Weight styles
	const weightStyles: Record<string, string> = {
		normal: 'font-normal',
		medium: 'font-medium',
		semibold: 'font-semibold',
		bold: 'font-bold',
	};

	// Alignment styles
	const alignStyles: Record<string, string> = {
		left: 'text-left',
		center: 'text-center',
		right: 'text-right',
		justify: 'text-justify',
	};

	// Combine all classes
	const combinedClassName = [
		variantStyles[variant],
		getColorClass(color),
		weight ? weightStyles[weight] : '',
		align ? alignStyles[align] : '',
		className,
	]
		.filter(Boolean)
		.join(' ');

	// Apply size multiplier to style
	const combinedStyle: TextStyle = {
		...(style || {}),
		...(sizeMultiplier !== 1 ? { fontSize: (style?.fontSize || 16) * sizeMultiplier } : {}),
	};

	return (
		<RNText className={combinedClassName} style={combinedStyle} {...props}>
			{children}
		</RNText>
	);
}

// Export convenience components for common use cases
export const H1 = (props: Omit<TextProps, 'variant'>) => <Text variant="h1" {...props} />;
export const H2 = (props: Omit<TextProps, 'variant'>) => <Text variant="h2" {...props} />;
export const H3 = (props: Omit<TextProps, 'variant'>) => <Text variant="h3" {...props} />;
export const H4 = (props: Omit<TextProps, 'variant'>) => <Text variant="h4" {...props} />;
export const Body = (props: Omit<TextProps, 'variant'>) => <Text variant="body" {...props} />;
export const Caption = (props: Omit<TextProps, 'variant'>) => <Text variant="caption" {...props} />;
export const Label = (props: Omit<TextProps, 'variant'>) => <Text variant="label" {...props} />;
export const Quote = (props: Omit<TextProps, 'variant'>) => <Text variant="quote" {...props} />;
