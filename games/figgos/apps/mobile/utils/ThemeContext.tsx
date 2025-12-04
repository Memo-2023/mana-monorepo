import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeName, ThemeVariant, getTheme } from './themes';

// Keys for AsyncStorage
const THEME_NAME_KEY = 'wtfigure_theme_name';
const THEME_VARIANT_KEY = 'wtfigure_theme_variant';
const THEME_MODE_KEY = 'wtfigure_theme_mode';
const DEBUG_BORDERS_KEY = 'wtfigure_debug_borders';

// Theme mode (auto uses system, or manual override)
export type ThemeMode = 'system' | 'light' | 'dark';

// Context type definition
type ThemeContextType = {
	theme: Theme;
	themeName: ThemeName;
	themeVariant: ThemeVariant;
	themeMode: ThemeMode;
	isDark: boolean;
	debugBorders: boolean;
	setThemeName: (name: ThemeName) => void;
	setThemeMode: (mode: ThemeMode) => void;
	setDebugBorders: (enabled: boolean) => void;
};

// Create the context with default values
const ThemeContext = createContext<ThemeContextType>({
	theme: getTheme('default', 'light'),
	themeName: 'default',
	themeVariant: 'light',
	themeMode: 'system',
	isDark: false,
	debugBorders: false,
	setThemeName: () => {},
	setThemeMode: () => {},
	setDebugBorders: () => {},
});

// Hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	// Get the system color scheme
	const systemColorScheme = useColorScheme();

	// State for theme settings
	const [themeName, setThemeNameState] = useState<ThemeName>('default');
	const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
	const [debugBorders, setDebugBordersState] = useState<boolean>(false);

	// Compute the current theme variant based on mode and system settings
	const themeVariant: ThemeVariant =
		themeMode === 'system'
			? systemColorScheme === 'dark'
				? 'dark'
				: 'light'
			: (themeMode as ThemeVariant);

	// Compute the current theme
	const theme = getTheme(themeName, themeVariant);

	// Determine if we're in dark mode
	const isDark = themeVariant === 'dark';

	// Load saved preferences from AsyncStorage
	useEffect(() => {
		const loadThemePreferences = async () => {
			try {
				const savedThemeName = await AsyncStorage.getItem(THEME_NAME_KEY);
				const savedThemeMode = await AsyncStorage.getItem(THEME_MODE_KEY);
				const savedDebugBorders = await AsyncStorage.getItem(DEBUG_BORDERS_KEY);

				if (savedThemeName) {
					setThemeNameState(savedThemeName as ThemeName);
				}

				if (savedThemeMode) {
					setThemeModeState(savedThemeMode as ThemeMode);
				}

				if (savedDebugBorders) {
					setDebugBordersState(savedDebugBorders === 'true');
				}
			} catch (error) {
				console.error('Failed to load theme preferences:', error);
			}
		};

		loadThemePreferences();
	}, []);

	// Function to set theme name and save to AsyncStorage
	const setThemeName = async (name: ThemeName) => {
		try {
			await AsyncStorage.setItem(THEME_NAME_KEY, name);
			setThemeNameState(name);
		} catch (error) {
			console.error('Failed to save theme name:', error);
		}
	};

	// Function to set theme mode and save to AsyncStorage
	const setThemeMode = async (mode: ThemeMode) => {
		try {
			await AsyncStorage.setItem(THEME_MODE_KEY, mode);
			setThemeModeState(mode);
		} catch (error) {
			console.error('Failed to save theme mode:', error);
		}
	};

	// Function to set debug borders and save to AsyncStorage
	const setDebugBorders = async (enabled: boolean) => {
		try {
			await AsyncStorage.setItem(DEBUG_BORDERS_KEY, enabled.toString());
			setDebugBordersState(enabled);
		} catch (error) {
			console.error('Failed to save debug borders setting:', error);
		}
	};

	return (
		<ThemeContext.Provider
			value={{
				theme,
				themeName,
				themeVariant,
				themeMode,
				isDark,
				debugBorders,
				setThemeName,
				setThemeMode,
				setDebugBorders,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
};
