import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeVariant = 'classic' | 'ocean' | 'sunset';
export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
	primary: string;
	primaryDark: string;
	accent: string;
	background: string;
	backgroundSecondary: string;
	backgroundTertiary: string;
	text: string;
	textSecondary: string;
	textTertiary: string;
	border: string;
	card: string;
	success: string;
	warning: string;
	error: string;
	shadow: string;
}

const THEME_VARIANTS = {
	classic: {
		primary: '#4CAF50',
		primaryDark: '#45a049',
		accent: '#66BB6A',
	},
	ocean: {
		primary: '#2196F3',
		primaryDark: '#1976D2',
		accent: '#42A5F5',
	},
	sunset: {
		primary: '#FF6B6B',
		primaryDark: '#FF5252',
		accent: '#FF8A80',
	},
};

const getThemeColors = (variant: ThemeVariant, isDark: boolean): ThemeColors => {
	const variantColors = THEME_VARIANTS[variant];

	if (isDark) {
		return {
			primary: variantColors.primary,
			primaryDark: variantColors.primaryDark,
			accent: variantColors.accent,
			background: '#121212',
			backgroundSecondary: '#1E1E1E',
			backgroundTertiary: '#2D2D2D',
			text: '#FFFFFF',
			textSecondary: '#AAAAAA',
			textTertiary: '#888888',
			border: '#333333',
			card: '#1E1E1E',
			success: '#4CAF50',
			warning: '#FF9800',
			error: '#FF6B6B',
			shadow: '#000000',
		};
	} else {
		return {
			primary: variantColors.primary,
			primaryDark: variantColors.primaryDark,
			accent: variantColors.accent,
			background: '#F5F5F5',
			backgroundSecondary: '#FFFFFF',
			backgroundTertiary: '#F0F0F0',
			text: '#000000',
			textSecondary: '#666666',
			textTertiary: '#999999',
			border: '#E0E0E0',
			card: '#FFFFFF',
			success: '#4CAF50',
			warning: '#FF9800',
			error: '#F44336',
			shadow: '#000000',
		};
	}
};

type ThemeContextType = {
	isDarkMode: boolean;
	themeVariant: ThemeVariant;
	colors: ThemeColors;
	toggleTheme: () => void;
	setDarkMode: (isDark: boolean) => void;
	setThemeVariant: (variant: ThemeVariant) => void;
};

const ThemeContext = createContext<ThemeContextType>({
	isDarkMode: false,
	themeVariant: 'classic',
	colors: getThemeColors('classic', false),
	toggleTheme: () => {},
	setDarkMode: () => {},
	setThemeVariant: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const THEME_PREFERENCE_KEY = '@theme_preference';
const THEME_VARIANT_KEY = '@theme_variant';

type ThemeProviderProps = {
	children: React.ReactNode | ((themeProps: ThemeContextType) => React.ReactNode);
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
	const systemColorScheme = useColorScheme();
	const [isDarkMode, setIsDarkMode] = useState(false);
	const [themeVariant, setThemeVariantState] = useState<ThemeVariant>('classic');
	const [isLoaded, setIsLoaded] = useState(false);

	// Load saved theme preferences
	useEffect(() => {
		const loadThemePreferences = async () => {
			try {
				const [savedPreference, savedVariant] = await Promise.all([
					AsyncStorage.getItem(THEME_PREFERENCE_KEY),
					AsyncStorage.getItem(THEME_VARIANT_KEY),
				]);

				if (savedPreference !== null) {
					setIsDarkMode(savedPreference === 'dark');
				} else {
					// No saved preference, use system preference
					setIsDarkMode(systemColorScheme === 'dark');
				}

				if (savedVariant !== null && ['classic', 'ocean', 'sunset'].includes(savedVariant)) {
					setThemeVariantState(savedVariant as ThemeVariant);
				}
			} catch (error) {
				console.error('Failed to load theme preferences', error);
			} finally {
				setIsLoaded(true);
			}
		};

		loadThemePreferences();
	}, [systemColorScheme]);

	// Save theme mode preference whenever it changes
	useEffect(() => {
		if (isLoaded) {
			AsyncStorage.setItem(THEME_PREFERENCE_KEY, isDarkMode ? 'dark' : 'light').catch((error) =>
				console.error('Failed to save theme preference', error)
			);
		}
	}, [isDarkMode, isLoaded]);

	// Save theme variant preference whenever it changes
	useEffect(() => {
		if (isLoaded) {
			AsyncStorage.setItem(THEME_VARIANT_KEY, themeVariant).catch((error) =>
				console.error('Failed to save theme variant', error)
			);
		}
	}, [themeVariant, isLoaded]);

	const toggleTheme = () => {
		setIsDarkMode((prev) => !prev);
	};

	const setDarkMode = (isDark: boolean) => {
		setIsDarkMode(isDark);
	};

	const setThemeVariant = (variant: ThemeVariant) => {
		setThemeVariantState(variant);
	};

	const colors = getThemeColors(themeVariant, isDarkMode);

	const themeContextValue = {
		isDarkMode,
		themeVariant,
		colors,
		toggleTheme,
		setDarkMode,
		setThemeVariant,
	};

	return (
		<ThemeContext.Provider value={themeContextValue}>
			{typeof children === 'function' ? children(themeContextValue) : children}
		</ThemeContext.Provider>
	);
};
