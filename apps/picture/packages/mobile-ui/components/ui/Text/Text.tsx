import { forwardRef } from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle } from 'react-native';

export type TextVariant =
	| 'h1'
	| 'h2'
	| 'h3'
	| 'h4'
	| 'title'
	| 'body'
	| 'bodyLarge'
	| 'bodySmall'
	| 'caption'
	| 'label'
	| 'button';

export type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextProps = {
	variant?: TextVariant;
	color?: string;
	weight?: TextWeight;
	align?: 'left' | 'center' | 'right';
	children?: React.ReactNode;
} & RNTextProps;

export const Text = forwardRef<RNText, TextProps>(
	({ variant = 'body', color, weight, align = 'left', style, children, ...props }, ref) => {
		const getVariantStyle = (): TextStyle => {
			switch (variant) {
				case 'h1':
					return { fontSize: 32, fontWeight: '700', lineHeight: 40 };
				case 'h2':
					return { fontSize: 28, fontWeight: '700', lineHeight: 36 };
				case 'h3':
					return { fontSize: 24, fontWeight: '600', lineHeight: 32 };
				case 'h4':
					return { fontSize: 20, fontWeight: '600', lineHeight: 28 };
				case 'title':
					return { fontSize: 44, fontWeight: '800', lineHeight: 52 };
				case 'bodyLarge':
					return { fontSize: 18, fontWeight: '400', lineHeight: 28 };
				case 'body':
					return { fontSize: 16, fontWeight: '400', lineHeight: 24 };
				case 'bodySmall':
					return { fontSize: 14, fontWeight: '400', lineHeight: 20 };
				case 'caption':
					return { fontSize: 12, fontWeight: '400', lineHeight: 16 };
				case 'label':
					return { fontSize: 14, fontWeight: '500', lineHeight: 20 };
				case 'button':
					return { fontSize: 16, fontWeight: '600', lineHeight: 24 };
				default:
					return {};
			}
		};

		const getFontWeight = (): TextStyle['fontWeight'] => {
			if (weight) {
				const weightMap: Record<TextWeight, TextStyle['fontWeight']> = {
					regular: '400',
					medium: '500',
					semibold: '600',
					bold: '700',
				};
				return weightMap[weight];
			}
			return undefined;
		};

		const textStyle: TextStyle = {
			...getVariantStyle(),
			...(color && { color }),
			textAlign: align,
			...(weight && { fontWeight: getFontWeight() }),
			...(style as TextStyle),
		};

		return (
			<RNText ref={ref} style={textStyle} {...props}>
				{children}
			</RNText>
		);
	}
);

Text.displayName = 'Text';
