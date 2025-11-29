import { useColorScheme } from 'nativewind';
import { useAppStore } from '../store/AppStore';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'user-theme-preference';

export const useTheme = () => {
	const { colorScheme, setColorScheme } = useColorScheme();
	const { theme, setTheme } = useAppStore();

	// Initialize theme from storage on app start
	useEffect(() => {
		const initializeTheme = async () => {
			try {
				const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
				if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
					const parsedTheme = storedTheme as 'light' | 'dark' | 'system';
					setTheme(parsedTheme);

					// Apply the theme to NativeWind
					if (parsedTheme === 'system') {
						setColorScheme('system');
					} else {
						setColorScheme(parsedTheme);
					}
				}
			} catch (error) {
				console.error('Error loading theme from storage:', error);
			}
		};

		initializeTheme();
	}, [setTheme, setColorScheme]);

	const updateTheme = async (newTheme: 'light' | 'dark' | 'system') => {
		try {
			// Update AppStore
			setTheme(newTheme);

			// Update NativeWind
			if (newTheme === 'system') {
				setColorScheme('system');
			} else {
				setColorScheme(newTheme);
			}

			// Persist to storage
			await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
		} catch (error) {
			console.error('Error saving theme to storage:', error);
		}
	};

	return {
		theme,
		colorScheme,
		updateTheme,
		isDark: colorScheme === 'dark',
		isLight: colorScheme === 'light',
	};
};
