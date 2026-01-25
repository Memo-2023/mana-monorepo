import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from './constants';
import type { Theme } from './constants';

export type ColorMode = 'system' | 'light' | 'dark';
export type ContrastLevel = 1 | 2 | 3 | 4 | 5;

const STORAGE_KEYS = {
	COLOR_MODE: '@theme/colorMode',
	CONTRAST_LEVEL: '@theme/contrastLevel',
};

type ThemeContextType = {
	theme: Theme;
	isDark: boolean;
	colorMode: ColorMode;
	setColorMode: (mode: ColorMode) => void;
	contrastLevel: ContrastLevel;
	setContrastLevel: (level: ContrastLevel) => void;
};

const ThemeContext = createContext<ThemeContextType>({
	theme: getTheme('light'),
	isDark: false,
	colorMode: 'system',
	setColorMode: () => {},
	contrastLevel: 3,
	setContrastLevel: () => {},
});

export const useTheme = () => useContext(ThemeContext);

// Hilfsfunktion zum Konvertieren von Hex zu RGB
const hexToRgb = (hex: string) => {
	const h = hex.replace('#', '');
	return {
		r: parseInt(h.substr(0, 2), 16),
		g: parseInt(h.substr(2, 2), 16),
		b: parseInt(h.substr(4, 2), 16),
	};
};

// Hilfsfunktion zum Konvertieren von RGB zu Hex mit Alpha
const rgbaToHex = (r: number, g: number, b: number, a = 1) => {
	const alpha = Math.round(a * 255);
	return (
		'#' +
		[r, g, b, alpha]
			.map((x) => {
				const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
				return hex.length === 1 ? '0' + hex : hex;
			})
			.join('')
	);
};

// Funktion zum Anpassen des Kontrasts
const adjustContrast = (
	color: string,
	level: ContrastLevel,
	type: 'text' | 'primary' | 'background',
	isDark: boolean
): string => {
	if (level === 3) return color;

	const { r, g, b } = hexToRgb(color);

	if (level < 3) {
		// Niedrigerer Kontrast: Nur Text-Opacity wird reduziert
		if (type === 'text') {
			const opacity = 0.5 + (level - 1) * 0.25; // 0.5 für Level 1, 0.75 für Level 2
			return rgbaToHex(r, g, b, opacity);
		}
		return color;
	} else {
		// Höherer Kontrast: Nur Hintergründe werden angepasst
		if (type === 'background') {
			const factor = (level - 3) * 0.45; // 0.45 für Level 4, 0.9 für Level 5
			if (isDark) {
				// Im Dark Mode: Hintergründe werden schwärzer
				return rgbaToHex(
					Math.round(r * (1 - factor)),
					Math.round(g * (1 - factor)),
					Math.round(b * (1 - factor))
				);
			} else {
				// Im Light Mode: Hintergründe werden weißer
				return rgbaToHex(
					Math.round(r + (255 - r) * factor),
					Math.round(g + (255 - g) * factor),
					Math.round(b + (255 - b) * factor)
				);
			}
		}
		return color;
	}
};

// Funktion zum Anpassen des gesamten Themes basierend auf dem Kontrast-Level
const adjustThemeContrast = (theme: Theme, level: ContrastLevel, isDark: boolean): Theme => {
	return {
		...theme,
		colors: {
			...theme.colors,
			textPrimary: adjustContrast(theme.colors.textPrimary, level, 'text', isDark),
			textSecondary: adjustContrast(theme.colors.textSecondary, level, 'text', isDark),
			backgroundPage: adjustContrast(theme.colors.backgroundPage, level, 'background', isDark),
			backgroundPrimary: adjustContrast(
				theme.colors.backgroundPrimary,
				level,
				'background',
				isDark
			),
			backgroundSecondary: adjustContrast(
				theme.colors.backgroundSecondary,
				level,
				'background',
				isDark
			),
		},
	};
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const systemColorScheme = useColorScheme();
	const [colorMode, setColorMode] = useState<ColorMode>('system');
	const [contrastLevel, setContrastLevel] = useState<ContrastLevel>(3);

	// Lade gespeicherte Einstellungen
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const savedColorMode = await AsyncStorage.getItem(STORAGE_KEYS.COLOR_MODE);
				if (savedColorMode) {
					setColorMode(savedColorMode as ColorMode);
				}

				const savedContrastLevel = await AsyncStorage.getItem(STORAGE_KEYS.CONTRAST_LEVEL);
				if (savedContrastLevel) {
					setContrastLevel(parseInt(savedContrastLevel) as ContrastLevel);
				}
			} catch (error) {
				console.error('Error loading theme settings:', error);
			}
		};
		loadSettings();
	}, []);

	// Speichere Einstellungen bei Änderungen
	const handleColorModeChange = async (mode: ColorMode) => {
		try {
			await AsyncStorage.setItem(STORAGE_KEYS.COLOR_MODE, mode);
			setColorMode(mode);
		} catch (error) {
			console.error('Error saving color mode:', error);
		}
	};

	const handleContrastLevelChange = async (level: ContrastLevel) => {
		try {
			await AsyncStorage.setItem(STORAGE_KEYS.CONTRAST_LEVEL, level.toString());
			setContrastLevel(level);
		} catch (error) {
			console.error('Error saving contrast level:', error);
		}
	};

	// Bestimme den aktiven Modus
	const isDark = colorMode === 'system' ? systemColorScheme === 'dark' : colorMode === 'dark';

	// Hole das Basis-Theme und passe den Kontrast an
	const baseTheme = getTheme(isDark ? 'dark' : 'light');
	const theme = adjustThemeContrast(baseTheme, contrastLevel, isDark);

	return (
		<ThemeContext.Provider
			value={{
				theme,
				isDark,
				colorMode,
				setColorMode: handleColorModeChange,
				contrastLevel,
				setContrastLevel: handleContrastLevelChange,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
};
