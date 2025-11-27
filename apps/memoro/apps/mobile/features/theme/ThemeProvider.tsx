import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Theme-Varianten
export type ThemeVariant = 'lume' | 'nature' | 'stone' | 'ocean';
export type ColorMode = 'system' | 'light' | 'dark';

// Namen der Theme-Varianten für die UI
export const THEME_NAMES: Record<ThemeVariant, string> = {
	lume: 'Lume',
	nature: 'Nature',
	stone: 'Stone',
	ocean: 'Ocean',
};

// Theme-Farben-Definitionen
const THEME_COLORS: Record<ThemeVariant, { light: ThemeColors; dark: ThemeColors }> = {
	lume: {
		light: {
			primary: '#f8d62b',
			primaryButton: '#f8d62b',
			primaryButtonText: '#000000',
			secondary: '#D4B200',
			secondaryButton: '#FFE9A3',
			contentBackground: '#ffffff',
			contentBackgroundHover: '#f5f5f5',
			contentPageBackground: '#ffffff',
			menuBackground: '#dddddd',
			menuBackgroundHover: '#cccccc',
			pageBackground: '#dddddd',
			text: '#2c2c2c',
			textSecondary: '#666666',
			textTertiary: '#999999',
			borderLight: '#f2f2f2',
			border: '#e6e6e6',
			borderStrong: '#cccccc',
			error: '#e74c3c',
			skeleton: 'rgba(128, 128, 128, 0.2)',
		},
		dark: {
			primary: '#f8d62b',
			primaryButton: '#7C6B16',
			primaryButtonText: '#ffffff',
			secondary: '#D4B200',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#333333',
			contentPageBackground: '#121212',
			menuBackground: '#252525',
			menuBackgroundHover: '#333333',
			pageBackground: '#121212',
			text: '#ffffff',
			textSecondary: '#cccccc',
			textTertiary: '#999999',
			borderLight: '#333333',
			border: '#424242',
			borderStrong: '#616161',
			error: '#e74c3c',
			skeleton: 'rgba(255, 255, 255, 0.1)',
		},
	},
	nature: {
		light: {
			primary: '#4CAF50',
			primaryButton: '#A08500',
			primaryButtonText: '#ffffff',
			secondary: '#81C784',
			secondaryButton: '#F1F8E9',
			contentBackground: '#F1F8E9',
			contentBackgroundHover: '#E8F5E9',
			contentPageBackground: '#ffffff',
			menuBackground: '#E8F5E9',
			menuBackgroundHover: '#C8E6C9',
			pageBackground: '#FBFDF8',
			text: '#1B5E20',
			textSecondary: '#33691E',
			textTertiary: '#558B2F',
			borderLight: '#E8F5E9',
			border: '#C8E6C9',
			borderStrong: '#A5D6A7',
			error: '#E57373',
			skeleton: 'rgba(76, 175, 80, 0.1)',
		},
		dark: {
			primary: '#4CAF50',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#81C784',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#2E7D32',
			contentPageBackground: '#121212',
			menuBackground: '#252525',
			menuBackgroundHover: '#2E7D32',
			pageBackground: '#121212',
			text: '#FFFFFF',
			textSecondary: '#C8E6C9',
			textTertiary: '#A5D6A7',
			borderLight: '#1B5E20',
			border: '#2E7D32',
			borderStrong: '#388E3C',
			error: '#CF6679',
			skeleton: 'rgba(76, 175, 80, 0.1)',
		},
	},
	stone: {
		light: {
			primary: '#607D8B',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#90A4AE',
			secondaryButton: '#ECEFF1',
			contentBackground: '#ECEFF1',
			contentBackgroundHover: '#E0E6EA',
			contentPageBackground: '#ffffff',
			menuBackground: '#E0E6EA',
			menuBackgroundHover: '#CFD8DC',
			pageBackground: '#F5F7F9',
			text: '#263238',
			textSecondary: '#37474F',
			textTertiary: '#546E7A',
			borderLight: '#ECEFF1',
			border: '#CFD8DC',
			borderStrong: '#B0BEC5',
			error: '#EF5350',
			skeleton: 'rgba(96, 125, 139, 0.1)',
		},
		dark: {
			primary: '#78909C',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#90A4AE',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#37474F',
			contentPageBackground: '#121212',
			menuBackground: '#252525',
			menuBackgroundHover: '#37474F',
			pageBackground: '#121212',
			text: '#FFFFFF',
			textSecondary: '#B0BEC5',
			textTertiary: '#90A4AE',
			borderLight: '#37474F',
			border: '#455A64',
			borderStrong: '#546E7A',
			error: '#CF6679',
			skeleton: 'rgba(120, 144, 156, 0.1)',
		},
	},
	ocean: {
		light: {
			primary: '#039BE5',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#4FC3F7',
			secondaryButton: '#E1F5FE',
			contentBackground: '#E1F5FE',
			contentBackgroundHover: '#B3E5FC',
			contentPageBackground: '#ffffff',
			menuBackground: '#E1F5FE',
			menuBackgroundHover: '#B3E5FC',
			pageBackground: '#F5FCFF',
			text: '#01579B',
			textSecondary: '#0277BD',
			textTertiary: '#0288D1',
			borderLight: '#E1F5FE',
			border: '#B3E5FC',
			borderStrong: '#81D4FA',
			error: '#EF5350',
			skeleton: 'rgba(3, 155, 229, 0.1)',
		},
		dark: {
			primary: '#039BE5',
			primaryButton: '#FF9500',
			primaryButtonText: '#000000',
			secondary: '#4FC3F7',
			secondaryButton: '#1E1E1E',
			contentBackground: '#1E1E1E',
			contentBackgroundHover: '#0277BD',
			contentPageBackground: '#121212',
			menuBackground: '#252525',
			menuBackgroundHover: '#0277BD',
			pageBackground: '#121212',
			text: '#FFFFFF',
			textSecondary: '#B3E5FC',
			textTertiary: '#81D4FA',
			borderLight: '#01579B',
			border: '#0277BD',
			borderStrong: '#0288D1',
			error: '#CF6679',
			skeleton: 'rgba(3, 155, 229, 0.1)',
		},
	},
};

// Storage-Keys für persistente Einstellungen
const STORAGE_KEYS = {
	COLOR_MODE: '@theme/colorMode',
	THEME_VARIANT: '@theme/themeVariant',
};

// Theme-Farben-Typ
export type ThemeColors = {
	primary: string;
	primaryButton: string;
	primaryButtonText: string;
	secondary: string;
	secondaryButton: string;
	contentBackground: string;
	contentBackgroundHover: string;
	contentPageBackground: string;
	menuBackground: string;
	menuBackgroundHover: string;
	pageBackground: string;
	text: string;
	textSecondary: string;
	textTertiary: string;
	borderLight: string;
	border: string;
	borderStrong: string;
	error: string;
	skeleton: string;
};

// Theme-Kontext-Typ
type ThemeContextType = {
	isDark: boolean;
	colorMode: ColorMode;
	setColorMode: (mode: ColorMode) => void;
	themeVariant: ThemeVariant;
	setThemeVariant: (variant: ThemeVariant) => void;
	// Tailwind-Klassen-Generator
	tw: (className: string) => string;
	// Aktuelle Theme-Farben
	colors: ThemeColors;
};

// Theme-Update-Kontext-Typ
type ThemeUpdateContextType = {
	toggleTheme: () => void;
	setColorMode: (mode: ColorMode) => void;
	setThemeVariant: (variant: ThemeVariant) => void;
};

// Standard-Werte für den Kontext
const ThemeContext = createContext<ThemeContextType>({
	isDark: false,
	colorMode: 'system',
	setColorMode: () => {},
	themeVariant: 'lume',
	setThemeVariant: () => {},
	tw: (className) => className,
	colors: THEME_COLORS.lume.light,
});

// Kontext für Theme-Update-Funktionen
const ThemeUpdateContext = createContext<ThemeUpdateContextType>({
	toggleTheme: () => {},
	setColorMode: () => {},
	setThemeVariant: () => {},
});

/**
 * Theme-Provider-Komponente
 * Verwaltet den Theme-Zustand und stellt ihn der App zur Verfügung
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const systemColorScheme = useColorScheme();
	const [colorMode, setColorMode] = useState<ColorMode>('system');
	const [themeVariant, setThemeVariant] = useState<ThemeVariant>('lume');
	const [isInitialized, setIsInitialized] = useState(false);

	// Lade gespeicherte Einstellungen beim Start
	useEffect(() => {
		const loadSettings = async () => {
			try {
				const [savedColorMode, savedThemeVariant] = await Promise.all([
					AsyncStorage.getItem(STORAGE_KEYS.COLOR_MODE),
					AsyncStorage.getItem(STORAGE_KEYS.THEME_VARIANT),
				]);

				if (savedColorMode) setColorMode(savedColorMode as ColorMode);
				if (savedThemeVariant) setThemeVariant(savedThemeVariant as ThemeVariant);

				setIsInitialized(true);
			} catch (error) {
				console.error('Error loading theme settings:', error);
				setIsInitialized(true);
			}
		};
		loadSettings();
	}, []);

	// Speichere Einstellungen bei Änderungen
	useEffect(() => {
		if (!isInitialized) return;

		const saveSettings = async () => {
			try {
				await Promise.all([
					AsyncStorage.setItem(STORAGE_KEYS.COLOR_MODE, colorMode),
					AsyncStorage.setItem(STORAGE_KEYS.THEME_VARIANT, themeVariant),
				]);
			} catch (error) {
				console.error('Error saving theme settings:', error);
			}
		};

		saveSettings();
	}, [colorMode, themeVariant, isInitialized]);

	// Bestimme den effektiven Farbmodus (system, light, dark)
	const effectiveColorScheme = colorMode === 'system' ? systemColorScheme : colorMode;
	const isDark = effectiveColorScheme === 'dark';

	// Set dark class on document element for web platform
	useEffect(() => {
		if (Platform.OS === 'web' && typeof document !== 'undefined') {
			if (isDark) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}, [isDark]);

	// Berechne die aktuellen Theme-Farben
	const currentColors = useMemo(() => {
		return THEME_COLORS[themeVariant][isDark ? 'dark' : 'light'];
	}, [themeVariant, isDark]);

	// Cache für transformierte Klassen
	const classCache = useMemo(() => new Map<string, string>(), []);

	// Liste der unterstützten generischen Klassen für Validierung
	const supportedGenericClasses = useMemo(
		() => [
			'bg-primary',
			'text-primary',
			'border-primary',
			'bg-secondary',
			'text-secondary',
			'border-secondary',
			'bg-background',
			'text-default',
			'border-default',
			'border-light',
			'border-strong',
			'bg-pageBackground',
			'bg-contentPageBackground',
		],
		[]
	);

	// Tailwind-Klassen-Generator mit Caching und Validierung
	const tw = useCallback(
		(className: string) => {
			// Wenn die Klasse bereits im Cache ist und sich das Theme nicht geändert hat,
			// gib den gecachten Wert zurück
			const cacheKey = `${className}|${themeVariant}|${isDark}`;
			if (classCache.has(cacheKey)) {
				return classCache.get(cacheKey)!;
			}

			// Validiere die Klassen (nur im Entwicklungsmodus)
			if (__DEV__) {
				// Prüfe auf unbekannte generische Klassen, die mit bg-, text- oder border- beginnen
				const classNames = className.split(' ');
				classNames.forEach((cls) => {
					if (
						(cls.startsWith('bg-') || cls.startsWith('text-') || cls.startsWith('border-')) &&
						!cls.includes('-primary') &&
						!cls.includes('-secondary') &&
						!cls.includes('-background') &&
						!cls.includes('-pageBackground') &&
						!cls.includes('-contentPageBackground') &&
						!cls.includes('-default') &&
						!cls.includes('-error') &&
						!supportedGenericClasses.includes(cls)
					) {
						console.warn(`Möglicherweise nicht unterstützte generische Klasse: ${cls}`);
					}
				});
			}

			// Basis-Klassen
			let classes = className;

			// Ersetze generische Farb-Klassen durch Theme-spezifische
			classes = classes
				.replace(/\bbg-primary\b/g, `bg-${themeVariant}-primary`)
				.replace(/\btext-primary\b/g, `text-${themeVariant}-primary`)
				.replace(/\bborder-primary\b/g, `border-${themeVariant}-primary`)
				.replace(/\bbg-secondary\b/g, `bg-${themeVariant}-secondary`)
				.replace(/\btext-secondary\b/g, `text-${themeVariant}-secondary`)
				.replace(/\bborder-secondary\b/g, `border-${themeVariant}-secondary`)
				.replace(/\bbg-background\b/g, `bg-${themeVariant}-background`)
				.replace(/\bbg-pageBackground\b/g, `bg-${themeVariant}-pageBackground`)
				.replace(/\bbg-contentPageBackground\b/g, `bg-${themeVariant}-contentPageBackground`)
				.replace(/\btext-default\b/g, `text-${themeVariant}-text`)
				.replace(/\bborder-default\b/g, `border-${themeVariant}-border`)
				.replace(/\bborder-light\b/g, `border-${themeVariant}-borderLight`)
				.replace(/\bborder-strong\b/g, `border-${themeVariant}-borderStrong`);

			// Füge Dark-Mode-Klassen hinzu, wenn im Dark-Mode
			if (isDark) {
				// Ersetze alle Theme-spezifischen Klassen durch ihre Dark-Mode-Varianten
				classes = classes
					.replace(new RegExp(`bg-${themeVariant}-primary`, 'g'), `bg-dark-${themeVariant}-primary`)
					.replace(
						new RegExp(`text-${themeVariant}-primary`, 'g'),
						`text-dark-${themeVariant}-primary`
					)
					.replace(
						new RegExp(`border-${themeVariant}-primary`, 'g'),
						`border-dark-${themeVariant}-primary`
					)
					.replace(
						new RegExp(`bg-${themeVariant}-secondary`, 'g'),
						`bg-dark-${themeVariant}-secondary`
					)
					.replace(
						new RegExp(`text-${themeVariant}-secondary`, 'g'),
						`text-dark-${themeVariant}-secondary`
					)
					.replace(
						new RegExp(`border-${themeVariant}-secondary`, 'g'),
						`border-dark-${themeVariant}-secondary`
					)
					.replace(
						new RegExp(`bg-${themeVariant}-background`, 'g'),
						`bg-dark-${themeVariant}-background`
					)
					.replace(
						new RegExp(`bg-${themeVariant}-pageBackground`, 'g'),
						`bg-dark-${themeVariant}-pageBackground`
					)
					.replace(
						new RegExp(`bg-${themeVariant}-contentPageBackground`, 'g'),
						`bg-dark-${themeVariant}-contentPageBackground`
					)
					.replace(new RegExp(`text-${themeVariant}-text`, 'g'), `text-dark-${themeVariant}-text`)
					.replace(
						new RegExp(`border-${themeVariant}-border`, 'g'),
						`border-dark-${themeVariant}-border`
					)
					.replace(
						new RegExp(`border-${themeVariant}-borderLight`, 'g'),
						`border-dark-${themeVariant}-borderLight`
					)
					.replace(
						new RegExp(`border-${themeVariant}-borderStrong`, 'g'),
						`border-dark-${themeVariant}-borderStrong`
					);
			}

			// Speichere das Ergebnis im Cache
			classCache.set(cacheKey, classes);

			return classes;
		},
		[themeVariant, isDark]
	);

	// Toggle-Funktion für das Theme
	const toggleTheme = useCallback(() => {
		const newMode = isDark ? 'light' : 'dark';
		setColorMode(newMode);
	}, [isDark]);

	// Kontext-Wert mit Memoization für Performance
	const contextValue = useMemo(
		() => ({
			isDark,
			colorMode,
			setColorMode,
			themeVariant,
			setThemeVariant,
			tw,
			colors: currentColors,
		}),
		[isDark, colorMode, themeVariant, tw, currentColors]
	);

	// Update-Kontext-Wert
	const updateContextValue = useMemo(
		() => ({
			toggleTheme,
			setColorMode,
			setThemeVariant,
		}),
		[toggleTheme, setColorMode, setThemeVariant]
	);

	// Zeige nichts während der Initialisierung
	if (!isInitialized) {
		return null;
	}

	return (
		<ThemeContext.Provider value={contextValue}>
			<ThemeUpdateContext.Provider value={updateContextValue}>
				{children}
			</ThemeUpdateContext.Provider>
		</ThemeContext.Provider>
	);
};

// Hook für den Zugriff auf das Theme
export const useTheme = () => useContext(ThemeContext);

// Hook für den Zugriff auf die Theme-Update-Funktionen
export const useThemeUpdate = () => useContext(ThemeUpdateContext);
