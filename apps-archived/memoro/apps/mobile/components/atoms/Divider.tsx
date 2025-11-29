import React from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface DividerProps {
	orientation?: 'horizontal' | 'vertical';
	color?: string;
	thickness?: number;
	length?: DimensionValue;
	spacing?: 'small' | 'medium' | 'large';
	className?: string;
}

/**
 * Divider-Komponente
 *
 * Eine einfache Trennlinie, die horizontal oder vertikal dargestellt werden kann.
 *
 * Beispiel:
 * ```tsx
 * <Divider />
 * <Divider orientation="vertical" length={24} />
 * <Divider spacing="large" />
 * ```
 */
function Divider({
	orientation = 'horizontal',
	color,
	thickness = 1,
	length = '100%',
	spacing = 'medium',
	className,
}: DividerProps) {
	const { isDark, themeVariant } = useTheme();

	// Bestimme die Farbe basierend auf dem Theme
	const dividerColor = color || (isDark ? '#444444' : '#DDDDDD');

	const isHorizontal = orientation === 'horizontal';

	// Bestimme den Abstand basierend auf dem Spacing-Parameter
	const getSpacing = () => {
		switch (spacing) {
			case 'small':
				return 4;
			case 'large':
				return 16;
			case 'medium':
			default:
				return 8;
		}
	};

	const spacingValue = getSpacing();

	// Erstelle das Style-Objekt basierend auf der Orientierung
	const dividerStyle: ViewStyle = isHorizontal
		? {
				backgroundColor: dividerColor,
				height: thickness,
				width: length,
				marginVertical: spacingValue,
			}
		: {
				backgroundColor: dividerColor,
				width: thickness,
				height: length,
				marginHorizontal: spacingValue,
			};

	return <View style={dividerStyle} className={className} />;
}

export default Divider;
