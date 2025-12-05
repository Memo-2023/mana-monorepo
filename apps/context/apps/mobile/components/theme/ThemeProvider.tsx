import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { themes, ThemeNames } from '~/utils/theme/colors';

// Typen für die Theme-Modi
export type ThemeMode = 'light' | 'dark' | 'system';

// Interface für das Theme-Objekt
export interface ThemeContextType {
	themeName: ThemeNames;
	mode: 'light' | 'dark';
	setTheme: (themeName: ThemeNames) => void;
	setMode: (mode: ThemeMode) => void;
	isDark: boolean;
}

// Speicherschlüssel für Theme-Einstellungen
const THEME_STORAGE_KEY = 'context_app_theme_settings';
const DEFAULT_THEME: ThemeNames = 'blue';
const DEFAULT_MODE: ThemeMode = 'system';

// Theme-Kontext für die Anwendung
export const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Hook zum Abrufen des aktuellen Themes
 * @returns Das aktuelle Theme-Objekt
 */
export function useAppTheme(): ThemeContextType {
	const theme = useContext(ThemeContext);
	if (!theme) {
		throw new Error('useAppTheme muss innerhalb eines ThemeProviders verwendet werden');
	}
	return theme;
}

/**
 * Theme-Provider-Komponente für die Anwendung
 * Verwaltet den Theme-Zustand und bietet Funktionen zum Ändern des Themes
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const systemColorScheme = useColorScheme();
	const [themeName, setThemeName] = useState<ThemeNames>(DEFAULT_THEME);
	const [themeMode, setThemeMode] = useState<ThemeMode>(DEFAULT_MODE);
	const [isLoaded, setIsLoaded] = useState(false);

	// Lade Theme-Einstellungen aus dem AsyncStorage
	useEffect(() => {
		const loadThemeSettings = async () => {
			try {
				const storedSettings = await AsyncStorage.getItem(THEME_STORAGE_KEY);
				if (storedSettings) {
					const { themeName, mode } = JSON.parse(storedSettings);
					setThemeName(themeName || DEFAULT_THEME);
					setThemeMode(mode || DEFAULT_MODE);
				}
			} catch (error) {
				console.error('Fehler beim Laden der Theme-Einstellungen:', error);
			} finally {
				setIsLoaded(true);
			}
		};

		loadThemeSettings();
	}, []);

	// Speichere Theme-Einstellungen im AsyncStorage
	const saveThemeSettings = async (name: ThemeNames, mode: ThemeMode) => {
		try {
			await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ themeName: name, mode }));
		} catch (error) {
			console.error('Fehler beim Speichern der Theme-Einstellungen:', error);
		}
	};

	// Setze das Theme
	const setTheme = (name: ThemeNames) => {
		setThemeName(name);
		saveThemeSettings(name, themeMode);
	};

	// Setze den Theme-Modus
	const setMode = (mode: ThemeMode) => {
		setThemeMode(mode);
		saveThemeSettings(themeName, mode);
	};

	// Bestimme den aktuellen Modus basierend auf den Einstellungen
	const currentMode = themeMode === 'system' ? systemColorScheme || 'light' : themeMode;

	const isDark = currentMode === 'dark';

	// Erstelle das Theme-Objekt
	const themeContextValue: ThemeContextType = {
		themeName,
		mode: currentMode,
		setTheme,
		setMode,
		isDark,
	};

	// Rendere den Provider nur, wenn die Theme-Einstellungen geladen wurden
	if (!isLoaded) {
		return null;
	}

	return <ThemeContext.Provider value={themeContextValue}>{children}</ThemeContext.Provider>;
}
