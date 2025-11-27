import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { StatusBar } from 'react-native';
import { useThemeStore, useTheme as useThemeHook } from '~/store/themeStore';
import type { NativeTheme as Theme, ThemeVariant, ColorMode } from '@picture/design-tokens/native';

// ThemeMode includes 'system' for automatic light/dark switching
type ThemeMode = ColorMode | 'system';

interface ThemeContextValue {
	theme: Theme;
	variant: ThemeVariant;
	mode: ThemeMode;
	actualMode: 'light' | 'dark';
	isLoading: boolean;
	setVariant: (variant: ThemeVariant) => Promise<void>;
	setMode: (mode: ThemeMode) => Promise<void>;
	toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
	children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
	const loadTheme = useThemeStore((state) => state.loadTheme);
	const themeData = useThemeHook();

	// Load theme on mount
	useEffect(() => {
		loadTheme();
	}, []);

	// Update StatusBar when theme changes
	useEffect(() => {
		if (!themeData.isLoading) {
			StatusBar.setBarStyle(
				themeData.actualMode === 'dark' ? 'light-content' : 'dark-content',
				true
			);
		}
	}, [themeData.actualMode, themeData.isLoading]);

	return <ThemeContext.Provider value={themeData}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		// During initial render, return the hook directly as fallback
		// This prevents crashes when components render before ThemeProvider is ready
		return useThemeHook();
	}
	return context;
}
