import React, { useMemo } from 'react';
import { View, Pressable, PressableProps, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getIconMapping } from '~/features/icons/iconMapping';

// Conditionally import SymbolView only on iOS
let SymbolView: any = null;
if (Platform.OS === 'ios') {
	try {
		SymbolView = require('expo-symbols').SymbolView;
	} catch (e) {
		// expo-symbols not available, will use Ionicons
	}
}

// Unterstützte Icon-Typen
type IconType = 'ionicons';

// Props für die Icon-Komponente
type IconProps = {
	// Icon-Name (aus Ionicons)
	name: string;
	// Größe des Icons
	size?: number;
	// Farbe des Icons (überschreibt die Theme-Farbe)
	color?: string;
	// Automatisch die Theme-Farbe verwenden
	useThemeColor?: boolean;
	// Zusätzliche Tailwind-Klassen
	className?: string;
	// Icon-Typ (für zukünftige Erweiterungen)
	type?: IconType;
	// Als Button anzeigen
	asButton?: boolean;
	// Hintergrundfarbe für Button-Variante
	buttonBackgroundColor?: string;
	// Button-Eigenschaften, wenn asButton=true
	onPress?: PressableProps['onPress'];
	// Zusätzliche Tailwind-Klassen für den Button-Container
	buttonClassName?: string;
	// Deaktiviert den Button
	disabled?: boolean;
};

/**
 * Icon-Komponente
 *
 * Ein Wrapper für verschiedene Icon-Bibliotheken, der automatisch die Theme-Farben verwendet.
 * Standardmäßig wird Ionicons verwendet.
 *
 * Beispiel:
 * ```tsx
 * <Icon name="heart" size={24} />
 * <Icon name="settings-outline" size={20} color="red" />
 * <Icon name="home" className="ml-2" useThemeColor />
 * ```
 */
/**
 * Icon-Komponente mit Memoization für bessere Performance
 *
 * Kann auch als Button verwendet werden, indem asButton=true gesetzt wird
 * und onPress übergeben wird.
 */
export const Icon: React.FC<IconProps> = React.memo(
	({
		name,
		size = 24,
		color,
		useThemeColor = false,
		className = '',
		type = 'ionicons',
		asButton = false,
		buttonBackgroundColor,
		onPress,
		buttonClassName = '',
		disabled = false,
	}: IconProps) => {
		const { tw, themeVariant, isDark, themeVersion } = useTheme();

		// Bestimme die Farbe basierend auf den Props und dem Theme
		// Verwende useMemo, um die Farbe bei Theme-Änderungen neu zu berechnen
		const iconColor = useMemo(() => {
			if (useThemeColor) {
				// Verwende die primäre Themefarbe, wenn keine Farbe angegeben ist
				return isDark
					? `var(--color-dark-${themeVariant}-primary)`
					: `var(--color-${themeVariant}-primary)`;
			} else if (!color && className) {
				// Versuche, die Farbe aus den Tailwind-Klassen zu extrahieren
				const colorClass = className.match(/text-([a-z0-9-]+)/)?.[0];
				if (colorClass) {
					const twClass = tw(colorClass);
					// Extrahiere die Farbe aus der generierten Klasse
					return twClass.includes('text-dark-')
						? `var(--color-${twClass.replace('text-dark-', '')})`
						: `var(--color-${twClass.replace('text-', '')})`;
				}
			}
			return color;
		}, [color, className, useThemeColor, themeVariant, isDark, tw, themeVersion]);

		// Rendere das Icon basierend auf dem Typ
		const renderIcon = () => {
			// Check if we should use SF Symbols on iOS
			if (Platform.OS === 'ios' && SymbolView) {
				const mapping = getIconMapping(name);
				if (mapping?.sfSymbol) {
					// Calculate proper scale for SF Symbols based on size
					let symbolScale = 'medium';
					if (size <= 16) {
						symbolScale = 'small';
					} else if (size >= 32) {
						symbolScale = 'large';
					}

					return (
						<SymbolView
							name={mapping.sfSymbol}
							scale={symbolScale}
							tintColor={iconColor}
							style={{ width: size, height: size }}
						/>
					);
				}
			}

			// Default to Ionicons
			const mapping = getIconMapping(name);
			const ioniconName = mapping?.ionicon || name;

			return <Ionicons name={ioniconName as any} size={size} color={iconColor} />;
		};

		// Handler für Button-Press mit Haptic Feedback
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

		// Wenn als Button angezeigt werden soll
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

		// Standard-Icon ohne Button
		return <View style={className ? tw(className) : undefined}>{renderIcon()}</View>;
	}
);

export default Icon as React.FC<IconProps>;
