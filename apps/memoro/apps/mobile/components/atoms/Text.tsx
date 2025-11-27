import React, { useMemo, forwardRef } from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface TextProps extends Omit<RNTextProps, 'style'> {
	variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'small' | 'tiny';
	children?: React.ReactNode;
	style?: RNTextProps['style'];
	className?: string;
}

/**
 * Text-Komponente
 *
 * Eine Wrapper-Komponente für den nativen Text, die automatisch die Theme-Farben verwendet
 * und verschiedene Textvarianten unterstützt.
 *
 * Beispiel:
 * ```tsx
 * <Text variant="h1">Überschrift</Text>
 * <Text variant="body">Normaler Text</Text>
 * <Text variant="caption">Unterschrift</Text>
 * <Text variant="small">Kleiner Text</Text>
 * ```
 */
const Text = forwardRef<RNText, TextProps>(
	({ children = null, variant = 'body', style = {}, className = '', ...props }, ref) => {
		const { colors } = useTheme();

		// Erstelle Styles basierend auf dem aktuellen Theme
		const styles = useMemo(
			() =>
				StyleSheet.create({
					text: {
						color: colors.text,
					},
					h1: {
						fontSize: 24,
						fontWeight: 'bold',
						lineHeight: 28,
						color: colors.text,
					},
					h2: {
						fontSize: 18,
						fontWeight: '600',
						lineHeight: 22,
						color: colors.text,
					},
					h3: {
						fontSize: 16,
						fontWeight: '600',
						lineHeight: 20,
						color: colors.text,
					},
					body: {
						fontSize: 16,
						lineHeight: 20,
						color: colors.text,
					},
					caption: {
						fontSize: 14,
						color: colors.textSecondary,
						lineHeight: 18,
					},
					small: {
						fontSize: 12,
						lineHeight: 16,
						color: colors.text,
					},
					tiny: {
						fontSize: 14,
						color: colors.textTertiary,
						lineHeight: 18,
					},
				}),
			[colors]
		); // Neu berechnen, wenn sich colors ändert

		// Kombiniere die Styles basierend auf der Variante
		const combinedStyles = [styles[variant], style];

		return (
			<RNText ref={ref} style={combinedStyles} className={className} {...props}>
				{children}
			</RNText>
		);
	}
);

export default Text;
