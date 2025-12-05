import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
	isDarkMode: boolean;
	themeMode: ThemeMode;
	theme: Theme;
	setThemeMode: (mode: ThemeMode) => void;
	toggleTheme: () => void;
}

const THEME_STORAGE_KEY = '@mail/theme-mode';

// Custom themes with Mail brand colors
const MailDarkTheme: Theme = {
	...DarkTheme,
	colors: {
		...DarkTheme.colors,
		primary: '#6366f1',
		background: '#000000',
		card: '#1c1c1e',
		text: '#ffffff',
		border: '#38383a',
		notification: '#ff453a',
	},
};

const MailLightTheme: Theme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		primary: '#6366f1',
		background: '#f2f2f7',
		card: '#ffffff',
		text: '#000000',
		border: '#c6c6c8',
		notification: '#ff3b30',
	},
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useAppTheme = () => {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useAppTheme must be used within a ThemeProvider');
	}
	return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const systemColorScheme = useColorScheme();
	const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
	const [isLoaded, setIsLoaded] = useState(false);

	// Load saved theme preference
	useEffect(() => {
		const loadTheme = async () => {
			try {
				const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
				if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
					setThemeModeState(savedMode as ThemeMode);
				}
			} catch (error) {
				console.error('Error loading theme:', error);
			} finally {
				setIsLoaded(true);
			}
		};

		loadTheme();
	}, []);

	// Determine if dark mode is active
	const isDarkMode =
		themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');

	// Get the navigation theme
	const theme = isDarkMode ? MailDarkTheme : MailLightTheme;

	// Set theme mode and persist
	const setThemeMode = async (mode: ThemeMode) => {
		setThemeModeState(mode);
		try {
			await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
		} catch (error) {
			console.error('Error saving theme:', error);
		}
	};

	// Toggle between light and dark
	const toggleTheme = () => {
		const newMode = isDarkMode ? 'light' : 'dark';
		setThemeMode(newMode);
	};

	if (!isLoaded) {
		return null;
	}

	return (
		<ThemeContext.Provider
			value={{
				isDarkMode,
				themeMode,
				theme,
				setThemeMode,
				toggleTheme,
			}}
		>
			{children}
		</ThemeContext.Provider>
	);
}
